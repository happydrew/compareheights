import { useState, useEffect, useMemo } from "react";
import { type Character } from "../lib/characters";
import {
    Trash2, Edit3
} from 'lucide-react';
import { Unit, convertHeightSmart, convertHeightSmartImperial } from './HeightCalculates';

// SVG 缓存管理器 - 用于缓存已获取的 SVG 内容
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

// 全局 SVG 缓存实例
const svgCache = new SVGCacheManager();

// SVG 颜色处理函数 - 支持多个颜色属性和智能替换
const processSVGColor = (svgContent: string, color?: string, colorProperty: string = 'fill'): string => {
    if (!color) return svgContent;

    let processedContent = svgContent;

    // 支持多个颜色属性，用逗号分隔
    const properties = colorProperty.split(',').map(prop => prop.trim());

    properties.forEach(prop => {
        // 1. 替换已存在的属性值
        const regex = new RegExp(`\\b${prop}\\s*=\\s*"[^"]*"`, 'g');
        let hasExistingAttribute = regex.test(processedContent);
        processedContent = processedContent.replace(regex, `${prop}="${color}"`);

        // 同时处理单引号的情况
        const regexSingleQuote = new RegExp(`\\b${prop}\\s*=\\s*'[^']*'`, 'g');
        if (!hasExistingAttribute) {
            hasExistingAttribute = regexSingleQuote.test(processedContent);
        }
        processedContent = processedContent.replace(regexSingleQuote, `${prop}='${color}'`);

        // 2. 处理 style 属性中的内联样式
        if (prop === 'fill' || prop === 'stroke') {
            const styleRegex = new RegExp(`\\bstyle\\s*=\\s*"([^"]*\\b${prop}\\s*:\\s*)[^;"]*(;?[^"]*)"`, 'g');
            const hasStyleProp = styleRegex.test(processedContent);
            processedContent = processedContent.replace(styleRegex, `style="$1${color}$2"`);

            const styleSingleQuoteRegex = new RegExp(`\\bstyle\\s*=\\s*'([^']*\\b${prop}\\s*:\\s*)[^;']*(;?[^']*)'`, 'g');
            processedContent = processedContent.replace(styleSingleQuoteRegex, `style='$1${color}$2'`);

            // 3. 如果没有该属性，则添加到所有图形元素
            if (!hasExistingAttribute && !hasStyleProp) {
                // 为 path, circle, rect, polygon, ellipse, line 等图形元素添加颜色属性
                const graphicElements = ['path', 'circle', 'rect', 'polygon', 'ellipse', 'line', 'polyline'];

                graphicElements.forEach(element => {
                    // 匹配开始标签，但排除已经有该属性或已经是自闭合的标签
                    const elementRegex = new RegExp(`<${element}([^>]*?)(?<!${prop}\\s*=\\s*"[^"]*")(?<!${prop}\\s*=\\s*'[^']*')(?<!/)>`, 'gi');
                    processedContent = processedContent.replace(elementRegex, (match, attributes) => {
                        return `<${element}${attributes} ${prop}="${color}">`;
                    });

                    // 处理自闭合标签
                    const selfClosingRegex = new RegExp(`<${element}([^>]*?)(?<!${prop}\\s*=\\s*"[^"]*")(?<!${prop}\\s*=\\s*'[^']*')\\s*/>`, 'gi');
                    processedContent = processedContent.replace(selfClosingRegex, (match, attributes) => {
                        return `<${element}${attributes} ${prop}="${color}" />`;
                    });
                });
            }
        }
    });

    return processedContent;
};

// SVG 内联渲染组件
const InlineSVGRenderer: React.FC<{
    svgContent: string;
    color?: string;
    colorProperty?: string;
    className?: string;
    style?: React.CSSProperties;
}> = ({ svgContent, color, colorProperty = 'fill', className = '', style }) => {
    const processedSVG = useMemo(() => {
        let processedContent = processSVGColor(svgContent, color, colorProperty);

        // 确保 SVG 能填充父容器
        // 移除固定的宽高属性，添加响应式属性
        processedContent = processedContent.replace(
            /<svg([^>]*?)>/i,
            (match, attributes) => {
                // 移除宽度和高度属性
                let newAttributes = attributes
                    .replace(/\s+width\s*=\s*["'][^"']*["']/gi, '')
                    .replace(/\s+height\s*=\s*["'][^"']*["']/gi, '');

                // 确保 viewBox 属性存在，如果不存在则尝试从宽高属性推导
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

                // 添加响应式属性
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

// 角色图片渲染组件 - 强制填充容器，包含 SVG 内联处理
const CharacterImageRenderer: React.FC<{
    character: Character;
    className?: string;
    onLoad?: () => void;
    onError?: () => void;
}> = ({
    character,
    className = '',
    onLoad,
    onError
}) => {
        const [isLoading, setIsLoading] = useState(false);
        const [hasError, setHasError] = useState(false);
        const [inlinedSvgContent, setInlinedSvgContent] = useState<string | null>(null);

        // 处理 SVG 内联化
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

        // 获取要使用的 SVG 内容
        const svgContentToUse = character.svgContent || inlinedSvgContent;

        return (
            <div className={`w-full h-full relative ${className}`}>
                {/* 加载状态 */}
                {isLoading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded">
                        <div className="w-4 h-4 border-2 border-green-500 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                )}

                {/* 错误状态 */}
                {hasError && (
                    <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded">
                        <div className="text-gray-500 text-xs text-center p-2">
                            Load failed<br />
                            {character.name}
                        </div>
                    </div>
                )}

                {/* 图片内容 - 强制填充容器 */}
                {!isLoading && !hasError && (
                    character.mediaType === 'svg' ? (
                        svgContentToUse ? (
                            // 使用内联 SVG 内容 - 更好的性能
                            <InlineSVGRenderer
                                svgContent={svgContentToUse}
                                color={character.colorCustomizable ? character.color : undefined}
                                colorProperty={character.colorProperty}
                                className="w-full h-full"
                            />
                        ) : (
                            // 回退到直接使用 SVG URL
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

// 获取 SVG viewBox 尺寸的工具函数
const getSVGDimensions = (svgContent: string): { width: number; height: number } | null => {
    try {
        // 尝试从 viewBox 获取尺寸
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

        // 如果 viewBox 不可用，尝试从宽高属性获取
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

// 角色显示组件
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
    // 实际媒体宽高比状态
    const [actualAspectRatio, setActualAspectRatio] = useState<number | null>(null);
    const [isLoadingAspectRatio, setIsLoadingAspectRatio] = useState(false);

    // 拉取角色图片，并根据图片计算宽高比
    useEffect(() => {
        const loadAspectRatio = async () => {
            if (!character.mediaUrl) return;

            setIsLoadingAspectRatio(true);

            try {
                if (character.mediaType === 'svg') {
                    // 处理 SVG - 优先使用现有的 svgContent，否则重新获取
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
                        // 如果无法获取 SVG 尺寸，回退到默认宽高比
                        setActualAspectRatio(DEFAUL_ASPECT);
                    }
                } else if (character.mediaType === 'image') {
                    // 处理图片
                    const img = new Image();
                    img.onload = () => {
                        setActualAspectRatio(img.naturalWidth / img.naturalHeight);
                        setIsLoadingAspectRatio(false);
                    };
                    img.onerror = () => {
                        // 图片加载失败，回退到默认宽高比
                        setActualAspectRatio(DEFAUL_ASPECT);
                        setIsLoadingAspectRatio(false);
                    };
                    img.src = character.mediaUrl;
                    return; // 异步加载，不在此处设置加载状态
                }
            } catch (error) {
                console.warn('Failed to load media aspect ratio:', error);
                // 出错时回退到角色定义的宽高比
                setActualAspectRatio(DEFAUL_ASPECT);
            } finally {
                setIsLoadingAspectRatio(false);
            }
        };

        loadAspectRatio();
    }, [character.mediaUrl, character.mediaType, character.svgContent, character.height]);

    // 计算显示尺寸 - 使用实际宽高比或回退到角色定义的宽高比
    const displayHeight = character.height * pixelsPerM;
    const displayWidth = displayHeight * (actualAspectRatio != null ? actualAspectRatio : DEFAUL_ASPECT);

    // 基于显示高度动态计算字体大小
    const baseFontSize = 12;  // 基础字体大小
    const minFontSize = 8;   // 最小字体大小
    const hoverFontSize = 13; // 悬停时的固定字体大小

    // 当显示高度小于 100px 时字体开始缩小
    const fontSizeRatio = Math.min(1, displayHeight / 100);
    const normalFontSize = Math.max(
        minFontSize,
        baseFontSize * fontSizeRatio
    );

    const hoverScale = hoverFontSize / normalFontSize; // 计算所需的缩放比例

    const buttonHoverSize = 16;
    const buttonNormalSize = buttonHoverSize / hoverScale;

    // 获取当前单位的高度显示 - 使用智能单位系统
    const getHeightDisplay = (unit: Unit) => {
        switch (unit) {
            case Unit.CM:
                return convertHeightSmart(character.height, true); // 公制智能单位
            case Unit.FT_IN:
                return convertHeightSmartImperial(character.height); // 英制智能单位
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
            {/* 顶部信息卡容器 - 使用 portal 避免溢出干扰 */}
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
                    {/* 操作按钮组 */}
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
                    {/* 正常状态只显示当前单位 */}
                    <div className={`w-full flex items-center justify-center font-medium`}
                        title={getHeightDisplay(unit)}
                    >
                        {getHeightDisplay(unit)}
                    </div>
                </div>
            </div>

            {/* 内部容器 - 完全适配内容 */}
            <div className="w-full h-full flex items-center justify-center relative z-10">
                {/* 宽高比加载状态 */}
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
                    // 默认使用简单矩形作为占位符（兼容旧数据）
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