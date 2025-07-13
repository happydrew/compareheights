import { useState } from "react";
import { CharacterType, type Character, Unit, convertHeight } from "./HeightCompareTool";
import {
    Trash2, Edit3, Move
} from 'lucide-react';

// 角色展示组件
const CharacterDisplay: React.FC<{
    character: Character;
    pixelsPerCm: number;
    isSelected?: boolean;
    unit: Unit;
    isDragging?: boolean;
    onEdit?: () => void;
    onMove?: (e: React.MouseEvent<Element> | React.TouchEvent<Element>) => void;
    onDelete?: () => void;
}> = ({ character, pixelsPerCm, isSelected, unit, isDragging = false, onEdit, onMove, onDelete }) => {
    // 计算显示尺寸
    const displayHeight = character.height * pixelsPerCm;
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


    // 获取当前单位的高度显示
    const getHeightDisplay = (unit: Unit) => {
        switch (unit) {
            case Unit.CM:
                return `cm: ${character.height}`;
            case Unit.FT_IN:
                return `ft: ${convertHeight(character.height, Unit.FT_IN)}`;
        }
    };

    return (
        <div
            className={`relative group ${isSelected ? 'ring-2 ring-blue-500' : ''} cursor-pointer`}
            style={{
                height: `${displayHeight}px`,
                width: `${displayWidth}px`,
            }}
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
                        transform -translate-x-1/2 pb-2 text-center transition-transform duration-150 ease-out 
                        whitespace-nowrap info-card group-hover:scale-[var(--hover-scale)] rounded-md group-hover:bg-white 
                        pointer-events-auto ${isDragging ? 'scale-[var(--hover-scale)]' : ''}`}
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
                        className={`flex items-center justify-center invisible group-hover:visible ${isDragging ? 'visible' : ''}`}
                        style={{
                            gap: `${4 / hoverScale}px`,
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
                    <div className="font-medium mb-0.5">{character.name}</div>
                    {/* 正常状态只显示当前单位 */}
                    <div className={`flex flex-col gap-0.5 font-medium`}>
                        <div className="flex items-center justify-center">
                            {getHeightDisplay(unit)}
                        </div>
                    </div>
                </div>
            </div>

            {/* 内部容器 - 完全贴合内容 */}
            <div className="w-full h-full flex items-center justify-center relative z-10">
                {character.imageUrl ? (
                    <img
                        src={character.imageUrl}
                        alt={character.name}
                        className="w-full h-full object-contain"
                    />
                ) : (
                    // 默认显示一个简单的矩形作为占位
                    <div
                        className="w-full h-full"
                        style={{
                            backgroundColor: character.color,
                            opacity: 0.8
                        }}
                    />
                )}
            </div>
        </div>
    );
};

export { CharacterDisplay };