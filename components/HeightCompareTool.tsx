import React, { useState, useCallback, useEffect } from 'react';
import {
  Trash2, Edit3, Search, Plus, Users, Crown, Mountain, Palette, Settings, Share2, Download,
  ChevronRight, ChevronDown, Star, Heart, Building, TreePine, Zap, User, UserCheck,
  MoreHorizontal, Grid, List, Filter, Eye, EyeOff, Ruler, Palette as PaletteIcon
} from 'lucide-react';

// 单位制枚举
enum Unit {
  CM = 'cm',
  FT_IN = 'ft-in',
  IN = 'in'
}

// 性别枚举
enum Gender {
  MALE = 'male',
  FEMALE = 'female',
  NEUTRAL = 'neutral'
}

// 角色类型枚举
enum CharacterType {
  GENERIC = 'generic',
  CELEBRITY = 'celebrity',
  FICTIONAL = 'fictional',
  OBJECT = 'object',
  BUILDING = 'building',
  ANIMAL = 'animal',
  PLANT = 'plant'
}

// 角色接口
interface Character {
  id: string;
  name: string;
  height: number; // 以cm为单位
  gender: Gender;
  type: CharacterType;
  color: string;
  isCustom: boolean;
  avatarUrl?: string;
  description?: string;
  category?: string;
  // 高跟鞋相关
  barefoot?: boolean;
  shoeHeight?: number;
  // 身体部位高度 (相对于总身高的比例)
  shoulderHeight?: number;
  waistHeight?: number;
  hipHeight?: number;
  // 分组
  groupId?: string;
  // 位置调整
  xOffset?: number;
  yOffset?: number;
}

// 比较项目接口
interface ComparisonItem {
  id: string;
  character: Character;
  visible: boolean;
  selected: boolean;
  order: number;
}

// 样式设置接口
interface StyleSettings {
  backgroundColor: string;
  backgroundImage?: string;
  gridLines: boolean;
  labels: boolean;
  shadows: boolean;
  theme: 'light' | 'dark';
  chartHeight: number;
  spacing: number;
}

// 预设角色数据
const PRESET_CHARACTERS: Character[] = [
  // 通用角色
  { id: '1', name: '成年男性', height: 175, gender: Gender.MALE, type: CharacterType.GENERIC, color: '#3B82F6', isCustom: false },
  { id: '2', name: '成年女性', height: 165, gender: Gender.FEMALE, type: CharacterType.GENERIC, color: '#EC4899', isCustom: false },
  { id: '3', name: '青少年', height: 160, gender: Gender.NEUTRAL, type: CharacterType.GENERIC, color: '#10B981', isCustom: false },
  { id: '4', name: '儿童', height: 120, gender: Gender.NEUTRAL, type: CharacterType.GENERIC, color: '#F59E0B', isCustom: false },

  // 名人
  { id: '5', name: '姚明', height: 226, gender: Gender.MALE, type: CharacterType.CELEBRITY, color: '#8B5CF6', isCustom: false },
  { id: '6', name: '泰勒·斯威夫特', height: 180, gender: Gender.FEMALE, type: CharacterType.CELEBRITY, color: '#EF4444', isCustom: false },

  // 物体建筑
  { id: '7', name: '埃菲尔铁塔', height: 32400, gender: Gender.NEUTRAL, type: CharacterType.BUILDING, color: '#6B7280', isCustom: false },
  { id: '8', name: '自由女神像', height: 4615, gender: Gender.NEUTRAL, type: CharacterType.BUILDING, color: '#059669', isCustom: false },

  // 动物
  { id: '9', name: '长颈鹿', height: 550, gender: Gender.NEUTRAL, type: CharacterType.ANIMAL, color: '#D97706', isCustom: false },
  { id: '10', name: '大象', height: 400, gender: Gender.NEUTRAL, type: CharacterType.ANIMAL, color: '#6B7280', isCustom: false },
];

// 单位转换函数
const convertHeight = (cm: number, unit: Unit): string => {
  switch (unit) {
    case Unit.CM:
      return `${cm}cm`;
    case Unit.IN:
      return `${(cm / 2.54).toFixed(1)}"`;
    case Unit.FT_IN:
      const totalInches = cm / 2.54;
      const feet = Math.floor(totalInches / 12);
      const inches = totalInches % 12;
      return `${feet}' ${inches.toFixed(1)}"`;
    default:
      return `${cm}cm`;
  }
};

// 人体轮廓SVG组件
const HumanSilhouette: React.FC<{
  gender: Gender;
  color: string;
  height: number;
  maxHeight: number;
  shoulderHeight?: number;
  waistHeight?: number;
  hipHeight?: number;
  barefoot?: boolean;
  shoeHeight?: number;
}> = ({ gender, color, height, maxHeight, shoulderHeight, waistHeight, hipHeight, barefoot, shoeHeight }) => {
  const actualHeight = barefoot ? height - (shoeHeight || 0) : height;

  // 基础尺寸设置
  const baseWidth = 40;
  const baseHeight = 160; // 基准高度，用于计算宽高比
  const aspectRatio = baseHeight / baseWidth;

  // 计算实际显示尺寸
  const scale = actualHeight / maxHeight; // 相对于最高角色的缩放比例
  const displayHeight = Math.max(scale * 400, 40); // 最小显示高度为40px
  const displayWidth = displayHeight / aspectRatio;

  // 根据性别调整轮廓
  const getPath = () => {
    const shoulderWidth = gender === Gender.MALE ? displayWidth * 1.2 : displayWidth * 0.9;
    const waistWidth = gender === Gender.MALE ? displayWidth * 0.8 : displayWidth * 0.7;
    const hipWidth = gender === Gender.FEMALE ? displayWidth * 1.1 : displayWidth * 0.9;

    return `
      M ${displayWidth / 2} 0
      C ${displayWidth / 2 + displayWidth * 0.2} 0 ${displayWidth / 2 + displayWidth * 0.3} ${displayHeight * 0.05} ${displayWidth / 2 + displayWidth * 0.3} ${displayHeight * 0.1}
      C ${displayWidth / 2 + displayWidth * 0.3} ${displayHeight * 0.15} ${displayWidth / 2 + displayWidth * 0.2} ${displayHeight * 0.2} ${displayWidth / 2} ${displayHeight * 0.2}
      C ${displayWidth / 2 - displayWidth * 0.2} ${displayHeight * 0.2} ${displayWidth / 2 - displayWidth * 0.3} ${displayHeight * 0.15} ${displayWidth / 2 - displayWidth * 0.3} ${displayHeight * 0.1}
      C ${displayWidth / 2 - displayWidth * 0.3} ${displayHeight * 0.05} ${displayWidth / 2 - displayWidth * 0.2} 0 ${displayWidth / 2} 0
      Z
      M ${displayWidth / 2 - shoulderWidth / 2} ${displayHeight * 0.2}
      L ${displayWidth / 2 + shoulderWidth / 2} ${displayHeight * 0.2}
      L ${displayWidth / 2 + waistWidth / 2} ${displayHeight * 0.5}
      L ${displayWidth / 2 + hipWidth / 2} ${displayHeight * 0.7}
      L ${displayWidth / 2 + displayWidth / 4} ${displayHeight}
      L ${displayWidth / 2 - displayWidth / 4} ${displayHeight}
      L ${displayWidth / 2 - hipWidth / 2} ${displayHeight * 0.7}
      L ${displayWidth / 2 - waistWidth / 2} ${displayHeight * 0.5}
      Z
    `;
  };

  return (
    <svg
      width={displayWidth}
      height={displayHeight}
      className="overflow-visible"
      style={{ minHeight: '40px' }}
    >
      {/* 身体轮廓 */}
      <path d={getPath()} fill={color} fillOpacity="0.8" stroke={color} strokeWidth="1" />

      {/* 鞋子 */}
      {!barefoot && shoeHeight && shoeHeight > 0 && (
        <rect
          x={displayWidth * 0.25}
          y={displayHeight - (shoeHeight / maxHeight) * displayHeight}
          width={displayWidth * 0.5}
          height={(shoeHeight / maxHeight) * displayHeight}
          fill="#8B4513"
          rx={displayWidth * 0.05}
        />
      )}

      {/* 身体部位标记线 */}
      {shoulderHeight && (
        <line
          x1="0"
          y1={displayHeight * (1 - shoulderHeight)}
          x2={displayWidth}
          y2={displayHeight * (1 - shoulderHeight)}
          stroke="#666"
          strokeWidth="1"
          strokeDasharray="3,3"
        />
      )}

      {waistHeight && (
        <line
          x1="0"
          y1={displayHeight * (1 - waistHeight)}
          x2={displayWidth}
          y2={displayHeight * (1 - waistHeight)}
          stroke="#666"
          strokeWidth="1"
          strokeDasharray="3,3"
        />
      )}

      {hipHeight && (
        <line
          x1="0"
          y1={displayHeight * (1 - hipHeight)}
          x2={displayWidth}
          y2={displayHeight * (1 - hipHeight)}
          stroke="#666"
          strokeWidth="1"
          strokeDasharray="3,3"
        />
      )}
    </svg>
  );
};

// 角色卡片组件
const CharacterCard: React.FC<{
  character: Character;
  isSelected: boolean;
  isInComparison: boolean;
  unit: Unit;
  onSelect: () => void;
  onAddToComparison: () => void;
  onRemoveFromComparison: () => void;
}> = ({ character, isSelected, isInComparison, unit, onSelect, onAddToComparison, onRemoveFromComparison }) => {
  const getTypeIcon = () => {
    switch (character.type) {
      case CharacterType.CELEBRITY: return <Crown className="w-4 h-4" />;
      case CharacterType.FICTIONAL: return <Zap className="w-4 h-4" />;
      case CharacterType.BUILDING: return <Building className="w-4 h-4" />;
      case CharacterType.ANIMAL: return <Heart className="w-4 h-4" />;
      case CharacterType.PLANT: return <TreePine className="w-4 h-4" />;
      default: return <User className="w-4 h-4" />;
    }
  };

  return (
    <div
      className={`p-3 rounded-lg border-2 cursor-pointer transition-all duration-200 ${isSelected
        ? 'border-blue-500 bg-blue-50'
        : 'border-gray-200 hover:border-gray-300 bg-white'
        }`}
      onClick={onSelect}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          {getTypeIcon()}
          <span className="font-medium text-sm">{character.name}</span>
        </div>
        <div className="flex items-center gap-1">
          {isInComparison ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onRemoveFromComparison();
              }}
              className="text-red-500 hover:text-red-700 p-1"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onAddToComparison();
              }}
              className="text-blue-500 hover:text-blue-700 p-1"
            >
              <Plus className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
      <div className="flex items-center justify-between">
        <div
          className="w-6 h-6 rounded-full border-2 border-white"
          style={{ backgroundColor: character.color }}
        />
        <span className="text-sm text-gray-600">{convertHeight(character.height, unit)}</span>
      </div>
    </div>
  );
};

// 主组件
const HeightCompareTool: React.FC = () => {
  const [unit, setUnit] = useState<Unit>(Unit.CM);
  const [comparisonItems, setComparisonItems] = useState<ComparisonItem[]>([]);
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null);
  const [showRightPanel, setShowRightPanel] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<CharacterType | 'all'>('all');
  const [styleSettings, setStyleSettings] = useState<StyleSettings>({
    backgroundColor: '#ffffff',
    gridLines: true,
    labels: true,
    shadows: false,
    theme: 'light',
    chartHeight: 400,
    spacing: 60
  });

  const [expandedCategories, setExpandedCategories] = useState<Set<CharacterType>>(new Set([
    CharacterType.GENERIC,
    CharacterType.CELEBRITY
  ]));

  const [leftPanelSplit, setLeftPanelSplit] = useState(50); // 百分比，控制上下两个区域的高度分配
  const [isDragging, setIsDragging] = useState(false);

  // 筛选角色
  const filteredCharacters = PRESET_CHARACTERS.filter(char => {
    const matchesSearch = char.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || char.type === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // 按类型分组角色
  const groupedCharacters = filteredCharacters.reduce((acc, char) => {
    if (!acc[char.type]) acc[char.type] = [];
    acc[char.type].push(char);
    return acc;
  }, {} as Record<CharacterType, Character[]>);

  const getCategoryName = (type: CharacterType): string => {
    switch (type) {
      case CharacterType.GENERIC: return '通用角色';
      case CharacterType.CELEBRITY: return '名人';
      case CharacterType.FICTIONAL: return '虚构角色';
      case CharacterType.OBJECT: return '物体';
      case CharacterType.BUILDING: return '建筑';
      case CharacterType.ANIMAL: return '动物';
      case CharacterType.PLANT: return '植物';
      default: return '其他';
    }
  };

  const toggleCategory = (type: CharacterType) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(type)) {
      newExpanded.delete(type);
    } else {
      newExpanded.add(type);
    }
    setExpandedCategories(newExpanded);
  };

  const addToComparison = (character: Character) => {
    const newItem: ComparisonItem = {
      id: `${character.id}-${Date.now()}`,
      character,
      visible: true,
      selected: false,
      order: comparisonItems.length
    };
    setComparisonItems([...comparisonItems, newItem]);
  };

  const removeFromComparison = (itemId: string) => {
    setComparisonItems(comparisonItems.filter(item => item.id !== itemId));
  };

  const selectComparisonItem = (item: ComparisonItem) => {
    setSelectedCharacter(item.character);
    setShowRightPanel(true);
    setComparisonItems(comparisonItems.map(i => ({
      ...i,
      selected: i.id === item.id
    })));
  };

  const isCharacterInComparison = (character: Character): boolean => {
    return comparisonItems.some(item => item.character.id === character.id);
  };

  const getMaxHeight = (): number => {
    if (comparisonItems.length === 0) return 200;
    return Math.max(...comparisonItems.map(item => item.character.height), 200);
  };

  const updateCharacter = (key: string, value: any) => {
    if (!selectedCharacter) return;

    // 更新比较列表中的角色
    setComparisonItems(comparisonItems.map(item =>
      item.character.id === selectedCharacter.id
        ? { ...item, character: { ...item.character, [key]: value } }
        : item
    ));

    // 更新选中的角色
    setSelectedCharacter({ ...selectedCharacter, [key]: value });
  };

  // 处理拖拽分隔线
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    e.preventDefault();
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging) return;

    const leftPanel = document.querySelector('.left-panel') as HTMLElement;
    if (!leftPanel) return;

    const rect = leftPanel.getBoundingClientRect();
    const y = e.clientY - rect.top;
    // 确保分割线始终可见，限制在25%-75%之间
    const percentage = Math.max(25, Math.min(75, (y / rect.height) * 100));
    setLeftPanelSplit(percentage);
  }, [isDragging]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  return (
    <>
      {/* 全局细滚动条样式 */}
      <style dangerouslySetInnerHTML={{
        __html: `
          .thin-scrollbar::-webkit-scrollbar {
            width: 4px;
            height: 4px;
          }
          
          .thin-scrollbar::-webkit-scrollbar-track {
            background: transparent;
          }
          
          .thin-scrollbar::-webkit-scrollbar-thumb {
            background: #cbd5e1;
            border-radius: 2px;
          }
          
          .thin-scrollbar::-webkit-scrollbar-thumb:hover {
            background: #94a3b8;
          }
          
          /* Firefox */
          .thin-scrollbar {
            scrollbar-width: thin;
            scrollbar-color: #cbd5e1 transparent;
          }
        `
      }} />

      <div className="height-compare-tool relative flex bg-gray-50" style={{ height: '90vh' }}>
        {/* 左侧面板 */}
        <div className="w-80 bg-white border-r border-gray-200 flex flex-col left-panel h-full">
          {/* 当前角色列表 */}
          <div className="border-b border-gray-200 flex flex-col" style={{ height: `${leftPanelSplit}%` }}>
            <div className="px-4 py-2 border-b border-gray-200 bg-gray-100">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">当前角色</h2>
                <div className="flex gap-2">
                  <button
                    onClick={() => setUnit(unit === Unit.CM ? Unit.FT_IN : Unit.CM)}
                    className="text-sm px-2 py-1 bg-gray-100 rounded hover:bg-gray-200"
                  >
                    {unit === Unit.CM ? 'cm' : 'ft'}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex-1 p-4 overflow-y-auto thin-scrollbar">
              <div className="space-y-1">
                {comparisonItems.length === 0 ? (
                  <p className="text-gray-500 text-sm">暂无比较对象</p>
                ) : (
                  comparisonItems.map(item => (
                    <div
                      key={item.id}
                      className={`flex items-center justify-between p-2 text-sm border-l-4 cursor-pointer ${item.selected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:bg-gray-50'
                        }`}
                      onClick={() => selectComparisonItem(item)}
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{item.character.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-gray-600">
                          {convertHeight(item.character.height, unit)}
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            removeFromComparison(item.id);
                          }}
                          className="text-red-500 hover:text-red-700 p-1"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* 可拖拽分隔线 */}
          <div
            className="relative cursor-row-resize transition-colors flex-shrink-0"
            onMouseDown={handleMouseDown}
          >
            {/* 增强可视性的中心线 */}
            <div className="absolute top-1/2 left-0 right-0 h-px bg-gray-300 transform -translate-y-1/2" />
            {/* 拖拽指示器 */}
            <div className="absolute top-1/2 left-1/2 w-8 h-1 bg-gray-300 rounded-full transform -translate-x-1/2 -translate-y-1/2" />
          </div>

          {/* 角色库 */}
          <div className="flex flex-col" style={{ height: `${100 - leftPanelSplit}%` }}>
            <div className="px-4 py-2 border-b border-gray-200 bg-gray-100">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">角色库</h2>
                <div className="relative">
                  <Search className="absolute left-2 top-2 w-3 h-3 text-gray-400" />
                  <input
                    type="text"
                    placeholder="搜索..."
                    className="text-sm pl-7 pr-2 py-1 border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 w-24"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>

            </div>

            {/* 角色分类tabs */}
            <div className="flex border-b border-gray-200">
              <button
                onClick={() => setSelectedCategory('all')}
                className={`flex-1 px-2 py-2 text-xs text-center border-r border-gray-200 ${selectedCategory === 'all'
                  ? 'text-blue-600 border-b-2 border-b-blue-600 -mb-px'
                  : 'text-gray-700 hover:text-gray-900'
                  }`}
              >
                通用角色
              </button>
              <button
                onClick={() => setSelectedCategory(CharacterType.CELEBRITY)}
                className={`flex-1 px-2 py-2 text-xs text-center border-r border-gray-200 ${selectedCategory === CharacterType.CELEBRITY
                  ? 'text-blue-600 border-b-2 border-b-blue-600 -mb-px'
                  : 'text-gray-700 hover:text-gray-900'
                  }`}
              >
                名人
              </button>
              <button
                onClick={() => setSelectedCategory(CharacterType.BUILDING)}
                className={`flex-1 px-2 py-2 text-xs text-center border-r border-gray-200 ${selectedCategory === CharacterType.BUILDING
                  ? 'text-blue-600 border-b-2 border-b-blue-600 -mb-px'
                  : 'text-gray-700 hover:text-gray-900'
                  }`}
              >
                物体
              </button>
              <button
                onClick={() => setSelectedCategory(CharacterType.FICTIONAL)}
                className={`flex-1 px-2 py-2 text-xs text-center ${selectedCategory === CharacterType.FICTIONAL
                  ? 'text-blue-600 border-b-2 border-b-blue-600 -mb-px'
                  : 'text-gray-700 hover:text-gray-900'
                  }`}
              >
                图片
              </button>
            </div>

            {/* 角色网格 */}
            <div className="flex-1 overflow-y-auto p-4 thin-scrollbar relative">
              <div className="absolute inset-4">
                <div className="grid grid-cols-3 gap-3">
                  {filteredCharacters.map(character => (
                    <div
                      key={character.id}
                      className="relative group cursor-pointer"
                      onClick={() => {
                        setSelectedCharacter(character);
                        setShowRightPanel(true);
                        if (!isCharacterInComparison(character)) {
                          addToComparison(character);
                        }
                      }}
                    >
                      {/* 正方形容器 */}
                      <div className="aspect-square w-full flex items-center justify-center bg-gray-50 rounded overflow-hidden">
                        {/* 角色缩略图 - 保持原始比例 */}
                        <div
                          className={`w-12 h-16 rounded flex items-center justify-center text-white text-sm font-bold transition-all ${selectedCharacter?.id === character.id
                            ? 'ring-2 ring-blue-500 ring-offset-1'
                            : 'hover:ring-2 hover:ring-gray-300 hover:ring-offset-1'
                            }`}
                          style={{ backgroundColor: character.color }}
                        >
                          {character.gender === Gender.MALE ? '♂' :
                            character.gender === Gender.FEMALE ? '♀' : '○'}
                        </div>
                      </div>

                      {/* 悬浮提示 */}
                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-10">
                        <div className="font-medium">{character.name}</div>
                        <div className="text-gray-300">
                          {convertHeight(character.height, Unit.CM)} / {convertHeight(character.height, Unit.FT_IN)}
                        </div>
                        {/* 小三角 */}
                        <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 中间图表区域 */}
        <div className="flex-1 flex flex-col">
          {/* 工具栏 */}
          <div className="p-4 bg-white border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <h1 className="text-xl font-bold">身高比较工具</h1>
                <div className="text-sm text-gray-600">
                  {comparisonItems.length} 个对象
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setStyleSettings({ ...styleSettings, gridLines: !styleSettings.gridLines })}
                  className={`p-2 rounded ${styleSettings.gridLines ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'}`}
                  title="网格线"
                >
                  <Grid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setStyleSettings({ ...styleSettings, labels: !styleSettings.labels })}
                  className={`p-2 rounded ${styleSettings.labels ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'}`}
                  title="标签"
                >
                  {styleSettings.labels ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </button>
                <button className="p-2 rounded bg-gray-100 text-gray-600 hover:bg-gray-200" title="导出">
                  <Download className="w-4 h-4" />
                </button>
                <button className="p-2 rounded bg-gray-100 text-gray-600 hover:bg-gray-200" title="分享">
                  <Share2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* 图表区域 */}
          <div className="flex-1 p-8 overflow-auto thin-scrollbar" style={{ backgroundColor: styleSettings.backgroundColor }}>
            <div className="w-full min-h-[600px] flex items-end justify-center relative">
              {/* 网格线 */}
              {styleSettings.gridLines && (
                <div className="absolute inset-0 pointer-events-none">
                  {Array.from({ length: 20 }, (_, i) => {
                    const maxHeight = getMaxHeight();
                    const height = (maxHeight / 19) * i;
                    const cmHeight = Math.round(height);
                    const ftInHeight = height / 2.54;
                    const feet = Math.floor(ftInHeight / 12);
                    const inches = (ftInHeight % 12).toFixed(2);

                    return (
                      <div
                        key={i}
                        className="absolute left-0 w-full border-t border-gray-300"
                        style={{ bottom: `${(i / 19) * 100}%` }}
                      >
                        {styleSettings.labels && (
                          <>
                            <span className="absolute left-2 -top-2 text-xs text-gray-600">
                              {cmHeight}cm
                            </span>
                            <span className="absolute right-2 -top-2 text-xs text-gray-600">
                              {feet}' {inches}"
                            </span>
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* 角色展示 */}
              {comparisonItems.length === 0 ? (
                <div className="text-center text-gray-500">
                  <Users className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <p className="text-lg">请从左侧添加角色进行比较</p>
                </div>
              ) : (
                <div className="flex items-end justify-center gap-8 pb-8">
                  {comparisonItems
                    .filter(item => item.visible)
                    .sort((a, b) => a.order - b.order)
                    .map(item => (
                      <div
                        key={item.id}
                        className={`flex flex-col items-center cursor-pointer group ${item.selected ? 'ring-2 ring-blue-500 ring-offset-2 rounded-lg' : ''
                          }`}
                        onClick={() => selectComparisonItem(item)}
                      >
                        <div className="relative">
                          {/* 头顶信息 */}
                          <div className="absolute -top-16 left-1/2 transform -translate-x-1/2 text-center whitespace-nowrap">
                            <div className="font-medium text-sm">{item.character.name}</div>
                            <div className="text-xs text-gray-600">
                              {convertHeight(item.character.height, unit)}
                            </div>
                            {item.character.barefoot && item.character.shoeHeight && (
                              <div className="text-xs text-gray-500">
                                赤脚: {convertHeight(item.character.height - item.character.shoeHeight, unit)}
                              </div>
                            )}
                          </div>

                          <HumanSilhouette
                            gender={item.character.gender}
                            color={item.character.color}
                            height={item.character.height}
                            maxHeight={getMaxHeight()}
                            shoulderHeight={item.character.shoulderHeight}
                            waistHeight={item.character.waistHeight}
                            hipHeight={item.character.hipHeight}
                            barefoot={item.character.barefoot}
                            shoeHeight={item.character.shoeHeight}
                          />
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 右侧编辑面板 - 工具区域内的绝对定位 */}
        {showRightPanel && selectedCharacter && (
          <div className="absolute right-0 top-0 h-full w-80 bg-white shadow-xl z-10 overflow-y-auto border-l border-gray-200 thin-scrollbar">
            <div className="px-4 py-2 border-b border-gray-200 bg-gray-50">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">角色详情</h3>
                <button
                  onClick={() => setShowRightPanel(false)}
                  className="text-gray-500 hover:text-gray-700 w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100"
                >
                  <span className="text-xl">×</span>
                </button>
              </div>
            </div>

            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">名称</label>
                <input
                  type="text"
                  value={selectedCharacter.name}
                  onChange={(e) => updateCharacter('name', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">身高</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={selectedCharacter.height}
                    onChange={(e) => updateCharacter('height', Number(e.target.value))}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    min="30"
                    max="300"
                  />
                  <span className="px-3 py-2 bg-gray-100 rounded-md text-sm">cm</span>
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {convertHeight(selectedCharacter.height, Unit.FT_IN)}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">性别</label>
                <div className="flex gap-2">
                  {Object.values(Gender).map(gender => (
                    <button
                      key={gender}
                      onClick={() => updateCharacter('gender', gender)}
                      className={`px-3 py-1 rounded text-sm ${selectedCharacter.gender === gender
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 text-gray-700'
                        }`}
                    >
                      {gender === Gender.MALE ? '男' : gender === Gender.FEMALE ? '女' : '中性'}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">颜色</label>
                <div className="flex gap-2 flex-wrap">
                  {['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#6B7280'].map(color => (
                    <button
                      key={color}
                      onClick={() => updateCharacter('color', color)}
                      className={`w-8 h-8 rounded-full border-2 ${selectedCharacter.color === color ? 'border-gray-800' : 'border-gray-300'
                        }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>

              {selectedCharacter.isCustom && (
                <>
                  <div>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={selectedCharacter.barefoot || false}
                        onChange={(e) => updateCharacter('barefoot', e.target.checked)}
                        className="rounded"
                      />
                      <span className="text-sm">赤脚测量</span>
                    </label>
                  </div>

                  {!selectedCharacter.barefoot && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">鞋跟高度</label>
                      <div className="flex gap-2">
                        <input
                          type="number"
                          value={selectedCharacter.shoeHeight || 0}
                          onChange={(e) => updateCharacter('shoeHeight', Number(e.target.value))}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          min="0"
                          max="30"
                        />
                        <span className="px-3 py-2 bg-gray-100 rounded-md text-sm">cm</span>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export { HeightCompareTool };