import { useState } from "react";
import { CharacterType, type Character, Unit, convertHeight, convertHeightSmart, convertHeightSmartImperial, getBestUnit, UnitSystem, UNIT_CONVERSIONS, CharacterImageRenderer } from "./HeightCompareTool";
import {
    Trash2, Edit3, Move
} from 'lucide-react';

// 角色展示组件
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
    // 计算显示尺寸
    const displayHeight = character.height * pixelsPerM;
    const displayWidth = (character.width / character.height) * displayHeight; // 保持原始宽高比

    // 根据显示高度动态计算字体大小
    const baseFontSize = 12;  // 基准字体大小
    const minFontSize = 8;   // 最小字体大小
    const hoverFontSize = 13; // 悬浮时的固定字体大小

    // 当显示高度小于100px时，字体开始缩小
    const fontSizeRatio = Math.min(1, displayHeight / 100);
    const normalFontSize = Math.max(
        minFontSize,
        baseFontSize * fontSizeRatio
    );

    const hoverScale = hoverFontSize / normalFontSize; // 计算需要的缩放比例

    const buttonHoverSize = 16;
    const buttonNormalSize = buttonHoverSize / hoverScale;

    const [hovered, setHovered] = useState(false);


    // 获取当前单位的高度显示 - 使用智能单位制
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
            title="拖拽移动角色位置"
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            onMouseDown={(e) => {
                e.stopPropagation();
                onMove?.(e);
            }}
            onTouchStart={(e) => {
                e.stopPropagation();
                onMove?.(e);
            }}
        >
            {/* 头顶信息卡片容器 - 使用portal确保不被overflow影响 */}
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
                            title="编辑角色"
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
                            title="删除角色"
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

            {/* 内部容器 - 完全贴合内容 */}
            <div className="w-full h-full flex items-center justify-center relative z-10">
                {character.media ? (
                    <CharacterImageRenderer
                        character={character}
                        containerWidth={displayWidth}
                        containerHeight={displayHeight}
                        className="w-full h-full"
                    />
                ) : (
                    // 默认显示一个简单的矩形作为占位（兼容旧数据）
                    <div
                        className="w-full h-full"
                        style={{
                            backgroundColor: character.appearance?.color || (character as any).color || '#3B82F6',
                            opacity: 0.8
                        }}
                    />
                )}
            </div>
        </div>
    );
};

export { CharacterDisplay };