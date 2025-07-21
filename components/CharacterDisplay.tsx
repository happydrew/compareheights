import { useState, useEffect, useMemo } from "react";
import { type Character } from "../lib/characters";
import {
    Trash2, Edit3
} from 'lucide-react';
import { Unit, convertHeightSmart, convertHeightSmartImperial } from './HeightCalculates';

// SVG Cache Manager - for caching fetched SVG content
class SVGCacheManager {
    private cache = new Map<string, string>();
    private loadingPromises = new Map<string, Promise<string>>();

    async fetchSVG(url: string): Promise<string> {
        if (this.cache.has(url)) {
            return this.cache.get(url)!;
        }

        if (this.loadingPromises.has(url)) {
            return this.loadingPromises.get(url)!;
        }

        const promise = fetch(url)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Failed to fetch SVG: ${url}`);
                }
                return response.text();
            })
            .then(svgContent => {
                this.cache.set(url, svgContent);
                this.loadingPromises.delete(url);
                return svgContent;
            })
            .catch(error => {
                this.loadingPromises.delete(url);
                throw error;
            });

        this.loadingPromises.set(url, promise);
        return promise;
    }

    getCachedSVG(url: string): string | null {
        return this.cache.get(url) || null;
    }

    clearCache() {
        this.cache.clear();
        this.loadingPromises.clear();
    }
}

// Global SVG cache instance
const svgCache = new SVGCacheManager();

// SVG color processing function - supports multiple color attributes and smarter replacement
const processSVGColor = (svgContent: string, color?: string, colorProperty: string = 'fill'): string => {
    if (!color) return svgContent;

    let processedContent = svgContent;

    // Support multiple color attributes, separated by commas
    const properties = colorProperty.split(',').map(prop => prop.trim());

    properties.forEach(prop => {
        // Precisely match attributes and replace values
        const regex = new RegExp(`\\b${prop}\\s*=\\s*"[^"]*"`, 'g');
        processedContent = processedContent.replace(regex, `${prop}="${color}"`);

        // Also handle single quote cases
        const regexSingleQuote = new RegExp(`\\b${prop}\\s*=\\s*'[^']*'`, 'g');
        processedContent = processedContent.replace(regexSingleQuote, `${prop}='${color}'`);

        // Handle inline styles in style attributes
        if (prop === 'fill' || prop === 'stroke') {
            const styleRegex = new RegExp(`\\bstyle\\s*=\\s*"([^"]*\\b${prop}\\s*:\\s*)[^;"]*(;?[^"]*)"`, 'g');
            processedContent = processedContent.replace(styleRegex, `style="$1${color}$2"`);

            const styleSingleQuoteRegex = new RegExp(`\\bstyle\\s*=\\s*'([^']*\\b${prop}\\s*:\\s*)[^;']*(;?[^']*)'`, 'g');
            processedContent = processedContent.replace(styleSingleQuoteRegex, `style='$1${color}$2'`);
        }
    });

    return processedContent;
};

// SVG inline rendering component
const InlineSVGRenderer: React.FC<{
    svgContent: string;
    color?: string;
    colorProperty?: string;
    className?: string;
    style?: React.CSSProperties;
}> = ({ svgContent, color, colorProperty = 'fill', className = '', style }) => {
    const processedSVG = useMemo(() => {
        let processedContent = processSVGColor(svgContent, color, colorProperty);

        // Ensure SVG can fill the parent container
        // Remove fixed width and height attributes, add responsive attributes
        processedContent = processedContent.replace(
            /<svg([^>]*?)>/i,
            (match, attributes) => {
                // Remove width and height attributes
                let newAttributes = attributes
                    .replace(/\s+width\s*=\s*["'][^"']*["']/gi, '')
                    .replace(/\s+height\s*=\s*["'][^"']*["']/gi, '');

                // Ensure viewBox attribute exists, if not try to derive from width/height
                if (!newAttributes.includes('viewBox')) {
                    const widthMatch = attributes.match(/width\s*=\s*["']([^"']*)["']/i);
                    const heightMatch = attributes.match(/height\s*=\s*["']([^"']*)["']/i);
                    if (widthMatch && heightMatch) {
                        const width = parseFloat(widthMatch[1]);
                        const height = parseFloat(heightMatch[1]);
                        if (!isNaN(width) && !isNaN(height)) {
                            newAttributes += ` viewBox="0 0 ${width} ${height}"`;
                        }
                    }
                }

                // Add responsive attributes
                newAttributes += ' width="100%" height="100%" preserveAspectRatio="none"';

                return `<svg${newAttributes}>`;
            }
        );

        return processedContent;
    }, [svgContent, color, colorProperty]);

    return (
        <div
            className={className}
            style={style}
            dangerouslySetInnerHTML={{ __html: processedSVG }}
        />
    );
};

// Character image rendering component - force fill container, includes SVG inline processing
const CharacterImageRenderer: React.FC<{
    character: Character;
    customColor?: string;
    className?: string;
    onLoad?: () => void;
    onError?: () => void;
}> = ({
    character,
    customColor,
    className = '',
    onLoad,
    onError
}) => {
        const [isLoading, setIsLoading] = useState(false);
        const [hasError, setHasError] = useState(false);
        const [inlinedSvgContent, setInlinedSvgContent] = useState<string | null>(null);

        const finalColor = customColor || character.color;

        // Handle SVG inlining
        useEffect(() => {
            if (character.mediaType === 'svg' && character.mediaUrl && !character.svgContent) {
                setIsLoading(true);
                setHasError(false);

                svgCache.fetchSVG(character.mediaUrl)
                    .then(svgContent => {
                        setInlinedSvgContent(svgContent);
                        setIsLoading(false);
                        onLoad?.();
                    })
                    .catch(error => {
                        console.warn('Failed to fetch and inline SVG:', error);
                        setIsLoading(false);
                        setHasError(true);
                        onError?.();
                    });
            } else if (character.mediaType === 'image') {
                setIsLoading(true);
                setHasError(false);

                const img = new Image();
                img.onload = () => {
                    setIsLoading(false);
                    onLoad?.();
                };
                img.onerror = () => {
                    setIsLoading(false);
                    setHasError(true);
                    onError?.();
                };
                img.src = character.mediaUrl;
            } else {
                onLoad?.();
            }
        }, [character.mediaUrl, character.mediaType, character.svgContent, onLoad, onError]);

        // Get SVG content to use
        const svgContentToUse = character.svgContent || inlinedSvgContent;

        return (
            <div className={`w-full h-full relative ${className}`}>
                {/* Loading state */}
                {isLoading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded">
                        <div className="w-4 h-4 border-2 border-green-500 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                )}

                {/* Error state */}
                {hasError && (
                    <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded">
                        <div className="text-gray-500 text-xs text-center p-2">
                            Load failed<br />
                            {character.name}
                        </div>
                    </div>
                )}

                {/* Image content - force fill container */}
                {!isLoading && !hasError && (
                    character.mediaType === 'svg' ? (
                        svgContentToUse ? (
                            // Use inline SVG content - better performance
                            <InlineSVGRenderer
                                svgContent={svgContentToUse}
                                color={character.colorCustomizable ? finalColor : undefined}
                                colorProperty={character.colorProperty}
                                className="w-full h-full"
                            />
                        ) : (
                            // Fallback to direct SVG URL
                            <img
                                src={character.mediaUrl}
                                alt={character.name}
                                className="w-full h-full"
                                style={{ objectFit: 'fill' }}
                                onLoad={() => onLoad?.()}
                                onError={() => {
                                    setHasError(true);
                                    onError?.();
                                }}
                            />
                        )
                    ) : (
                        <img
                            src={character.mediaUrl}
                            alt={character.name}
                            className="w-full h-full"
                            style={{ objectFit: 'fill' }}
                            onLoad={() => onLoad?.()}
                            onError={() => {
                                setHasError(true);
                                onError?.();
                            }}
                        />
                    )
                )}
            </div>
        );
    };

// Utility function to get SVG viewBox dimensions
const getSVGDimensions = (svgContent: string): { width: number; height: number } | null => {
    try {
        // Try to get dimensions from viewBox
        const viewBoxMatch = svgContent.match(/viewBox\s*=\s*["']([^"']*)["']/i);
        if (viewBoxMatch) {
            const viewBoxValues = viewBoxMatch[1].split(/[\s,]+/).map(Number);
            if (viewBoxValues.length >= 4) {
                const [, , width, height] = viewBoxValues;
                if (!isNaN(width) && !isNaN(height) && width > 0 && height > 0) {
                    return { width, height };
                }
            }
        }

        // If viewBox is not available, try to get from width and height attributes
        const widthMatch = svgContent.match(/width\s*=\s*["']([^"']*)["']/i);
        const heightMatch = svgContent.match(/height\s*=\s*["']([^"']*)["']/i);

        if (widthMatch && heightMatch) {
            const width = parseFloat(widthMatch[1]);
            const height = parseFloat(heightMatch[1]);
            if (!isNaN(width) && !isNaN(height) && width > 0 && height > 0) {
                return { width, height };
            }
        }

        return null;
    } catch (error) {
        console.warn('Failed to parse SVG dimensions:', error);
        return null;
    }
};

const DEFAUL_ASPECT: number = 1 / 3

// Character display component
const CharacterDisplay: React.FC<{
    character: Character;
    pixelsPerM: number;
    isSelected?: boolean;
    unit: Unit;
    isDragging?: boolean;
    onEdit?: () => void;
    onMove?: (e: React.MouseEvent<Element> | React.TouchEvent<Element>) => void;
    onDelete?: () => void;
}> = ({ character, pixelsPerM, isSelected, unit, isDragging = false, onEdit, onMove, onDelete }) => {
    // Actual media aspect ratio state
    const [actualAspectRatio, setActualAspectRatio] = useState<number | null>(null);
    const [isLoadingAspectRatio, setIsLoadingAspectRatio] = useState(false);

    // Get the actual aspect ratio of media resources
    useEffect(() => {
        const loadAspectRatio = async () => {
            if (!character.mediaUrl) return;

            setIsLoadingAspectRatio(true);

            try {
                if (character.mediaType === 'svg') {
                    // Handle SVG - prioritize existing svgContent, otherwise fetch
                    let svgContent = character.svgContent;
                    if (!svgContent) {
                        const response = await fetch(character.mediaUrl);
                        if (!response.ok) {
                            throw new Error(`Failed to fetch SVG: ${character.mediaUrl}`);
                        }
                        svgContent = await response.text();
                    }

                    const dimensions = getSVGDimensions(svgContent);
                    if (dimensions) {
                        setActualAspectRatio(dimensions.width / dimensions.height);
                    } else {
                        // If unable to get SVG dimensions, fallback to default aspect ratio
                        setActualAspectRatio(DEFAUL_ASPECT);
                    }
                } else if (character.mediaType === 'image') {
                    // Handle images
                    const img = new Image();
                    img.onload = () => {
                        setActualAspectRatio(img.naturalWidth / img.naturalHeight);
                        setIsLoadingAspectRatio(false);
                    };
                    img.onerror = () => {
                        // Image load failed, fallback to default aspect ratio
                        setActualAspectRatio(DEFAUL_ASPECT);
                        setIsLoadingAspectRatio(false);
                    };
                    img.src = character.mediaUrl;
                    return; // Async loading, don't set loading state here
                }
            } catch (error) {
                console.warn('Failed to load media aspect ratio:', error);
                // Fallback to character-defined aspect ratio on error
                setActualAspectRatio(DEFAUL_ASPECT);
            } finally {
                setIsLoadingAspectRatio(false);
            }
        };

        loadAspectRatio();
    }, [character.mediaUrl, character.mediaType, character.svgContent, character.height]);

    // Calculate display dimensions - use actual aspect ratio or fallback to character-defined ratio
    const displayHeight = character.height * pixelsPerM;
    const displayWidth = displayHeight * (actualAspectRatio != null ? actualAspectRatio : DEFAUL_ASPECT);

    // Dynamically calculate font size based on display height
    const baseFontSize = 12;  // Base font size
    const minFontSize = 8;   // Minimum font size
    const hoverFontSize = 13; // Fixed font size on hover

    // Font starts to shrink when display height is less than 100px
    const fontSizeRatio = Math.min(1, displayHeight / 100);
    const normalFontSize = Math.max(
        minFontSize,
        baseFontSize * fontSizeRatio
    );

    const hoverScale = hoverFontSize / normalFontSize; // Calculate required scale ratio

    const buttonHoverSize = 16;
    const buttonNormalSize = buttonHoverSize / hoverScale;

    // Get height display for current unit - use smart unit system
    const getHeightDisplay = (unit: Unit) => {
        switch (unit) {
            case Unit.CM:
                return convertHeightSmart(character.height, true); // Metric smart units
            case Unit.FT_IN:
                return convertHeightSmartImperial(character.height); // Imperial smart units
        }
    };

    return (
        <div
            className={`relative group ${isSelected ? 'ring-2 ring-blue-500' : ''} cursor-pointer`}
            style={{
                height: `${displayHeight}px`,
                width: `${displayWidth}px`,
            }}
            title="Drag to move character position"
            onMouseDown={(e) => {
                e.stopPropagation();
                onMove?.(e);
            }}
            onTouchStart={(e) => {
                e.stopPropagation();
                onMove?.(e);
            }}
        >
            {/* Top info card container - use portal to avoid overflow interference */}
            <div className="absolute inset-0 overflow-visible pointer-events-none">
                <div
                    className={`absolute group-hover:opacity-100 group-hover:!z-[1001] bottom-full left-1/2 
                        transform -translate-x-1/2 pb-2 px-0 text-center transition-transform duration-150 ease-out 
                        whitespace-nowrap info-card group-hover:scale-[var(--hover-scale)] rounded-md group-hover:bg-white 
                        pointer-events-auto ${isDragging ? 'opacity-100 !z-[1001] bg-white' : ''}`}
                    style={{
                        fontSize: `${normalFontSize}px`,
                        '--hover-scale': hoverScale,
                        zIndex: isDragging ? 1001 : 'auto',
                        transformOrigin: 'center bottom',
                        width: `${64 / hoverScale}px`,
                    } as React.CSSProperties}
                >
                    {/* Action button group */}
                    <div
                        className={`flex items-center justify-around invisible group-hover:visible ${isDragging ? 'visible' : ''}`}
                        style={{
                            // gap: `${4 / hoverScale}px`,
                            marginTop: `${4 / hoverScale}px`,
                        }}
                    >
                        <button
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                onEdit?.();
                            }}
                            onMouseDown={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                            }}
                            onTouchStart={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                            }}
                            className="rounded-full bg-white text-gray-600 hover:text-blue-600 hover:bg-blue-50 transition-colors shadow-sm"
                            title="Edit character"
                            disabled={isDragging}
                            style={{
                                padding: `${4 / hoverScale}px`,
                            }}
                        >
                            <Edit3 width={buttonNormalSize} height={buttonNormalSize} />
                        </button>
                        {/* <button
                            onMouseDown={(e) => {
                                e.stopPropagation();
                                onMove?.(e);
                            }}
                            onTouchStart={(e) => {
                                e.stopPropagation();
                                onMove?.(e);
                            }}
                            className="p-1 rounded-full bg-white text-gray-600 hover:text-green-600 hover:bg-green-50 transition-colors shadow-sm cursor-move"
                            title="拖拽调整位置"
                        >
                            <Move width={buttonNormalSize} height={buttonNormalSize} />
                        </button> */}
                        <button
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                onDelete?.();
                            }}
                            onMouseDown={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                            }}
                            onTouchStart={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                            }}
                            className="p-1 rounded-full bg-white text-gray-600 hover:text-red-600 hover:bg-red-50 transition-colors shadow-sm"
                            title="Remove character"
                            disabled={isDragging}
                        >
                            <Trash2 width={buttonNormalSize} height={buttonNormalSize} />
                        </button>
                    </div>
                    <div className="w-full text-center font-medium mb-0.5"
                        title={character.name}
                    >
                        {character.name}
                    </div>
                    {/* Normal state only shows current unit */}
                    <div className={`w-full flex items-center justify-center font-medium`}
                        title={getHeightDisplay(unit)}
                    >
                        {getHeightDisplay(unit)}
                    </div>
                </div>
            </div>

            {/* Inner container - fully fitted content */}
            <div className="w-full h-full flex items-center justify-center relative z-10">
                {/* Aspect ratio loading state */}
                {isLoadingAspectRatio && (
                    <div className="absolute inset-0 bg-gray-100 bg-opacity-75 flex items-center justify-center rounded z-20">
                        <div className="w-3 h-3 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                )}

                {character.mediaUrl ? (
                    <CharacterImageRenderer
                        character={character}
                        className="w-full h-full"
                    />
                ) : (
                    // Default to a simple rectangle as placeholder (compatible with legacy data)
                    <div
                        className="w-full h-full"
                        style={{
                            backgroundColor: character.color || '#3B82F6',
                            opacity: 0.8
                        }}
                    />
                )}
            </div>
        </div>
    );
};

export { CharacterDisplay };