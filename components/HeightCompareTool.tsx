export { CharacterType, type Character, Unit, convertHeight };

import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import {
  Trash2, Search, Users, Share2, Download,
  Grid, Eye, EyeOff, ArrowLeftRight, RotateCcw
} from 'lucide-react';
import { CharacterDisplay } from './CharacterDisplay';
import 'simplebar-react/dist/simplebar.min.css';


// 单位制枚举
enum Unit {
  CM = 'cm',
  FT_IN = 'ft-in'
}

// 角色类型枚举
enum CharacterType {
  GENERIC = 'generic',    // 通用角色
  CELEBRITY = 'celebrity', // 名人
  FICTIONAL = 'fictional', // 虚构角色
  OBJECT = 'object',      // 物体
  BUILDING = 'building',   // 建筑
  ANIMAL = 'animal',      // 动物
  PLANT = 'plant'         // 植物
}

// 角色接口
interface Character {
  id: string;
  name: string;
  height: number; // 以cm为单位
  width: number; // 以cm为单位
  type: CharacterType;
  color: string;
  imageUrl?: string; // 角色图片或SVG的URL
  isCustom: boolean;
  description?: string;
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
  { id: '1', name: '成年男性', height: 175, width: 50, type: CharacterType.GENERIC, color: '#3B82F6', isCustom: false },
  { id: '2', name: '成年女性', height: 165, width: 45, type: CharacterType.GENERIC, color: '#EC4899', isCustom: false },
  { id: '3', name: '青少年', height: 160, width: 40, type: CharacterType.GENERIC, color: '#10B981', isCustom: false },
  { id: '4', name: '儿童', height: 120, width: 35, type: CharacterType.GENERIC, color: '#F59E0B', isCustom: false },

  // 名人
  { id: '5', name: '姚明', height: 226, width: 60, type: CharacterType.CELEBRITY, color: '#8B5CF6', isCustom: false },
  { id: '6', name: '泰勒·斯威夫特', height: 180, width: 48, type: CharacterType.CELEBRITY, color: '#EF4444', isCustom: false },

  // 物体建筑
  { id: '7', name: '埃菲尔铁塔', height: 32400, width: 12400, type: CharacterType.BUILDING, color: '#6B7280', isCustom: false },
  { id: '8', name: '自由女神像', height: 4615, width: 1400, type: CharacterType.BUILDING, color: '#059669', isCustom: false },

  // 动物
  { id: '9', name: '长颈鹿', height: 550, width: 200, type: CharacterType.ANIMAL, color: '#D97706', isCustom: false },
  { id: '10', name: '大象', height: 400, width: 600, type: CharacterType.ANIMAL, color: '#6B7280', isCustom: false },
];

// 单位转换函数
const convertHeight = (cm: number, unit: Unit): string => {
  switch (unit) {
    case Unit.CM:
      return `${cm}cm`;
    case Unit.FT_IN:
      const totalInches = cm / 2.54;
      const feet = Math.floor(totalInches / 12);
      const inches = totalInches % 12;
      return `${feet}' ${inches.toFixed(1)}"`;
    default:
      return `${cm}cm`;
  }
};


// 添加拖拽状态接口
interface DragState {
  isDragging: boolean;
  draggedItemId: string | null;
  startX: number;
  offsetX: number;
  originalStartX: number; // 记录原始起始位置，不受重排影响
  mouseX: number;
  draggedOriginalLeft: number; // 记录被拖动元素的原始左边缘位置，如果发生位置交换，则计算的是交换后的位置
  preventNextClick?: boolean; // 添加新的标记
}

// 获取元素内容区域尺寸的工具函数
const getContentRect = (element: HTMLElement) => {
  const style = window.getComputedStyle(element);
  const paddingTop = parseFloat(style.paddingTop);
  const paddingBottom = parseFloat(style.paddingBottom);
  const paddingLeft = parseFloat(style.paddingLeft);
  const paddingRight = parseFloat(style.paddingRight);

  return {
    width: element.clientWidth - paddingLeft - paddingRight,
    height: element.clientHeight - paddingTop - paddingBottom,
    x: element.clientLeft + paddingLeft,
    y: element.clientTop + paddingTop
  };
};

// 主组件
const HeightCompareTool: React.FC = () => {
  const [unit, setUnit] = useState<Unit>(Unit.CM);
  /**
   * 当前在比较列表中的角色
   */
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

  const [chartAreaHeightPix, setChartAreaHeightPix] = useState(0);
  const [pixelsPerCmState, setPixelsPerCmState] = useState(1); // 添加新的状态

  // 添加重置缩放函数
  const resetZoom = () => {
    setPixelsPerCmState(1); // 重置为默认值1，这会触发自动计算
  };

  // 计算图表展示区的像素高度
  useEffect(() => {
    const chartArea = chartAreaRef.current;
    if (!chartArea) return;

    // 初始设置高度 - 使用工具函数获取内容区域高度
    const chartAreaHeightPix = getContentRect(chartArea).height;
    console.log('ChartAreaHeightPix: ' + chartAreaHeightPix);
    setChartAreaHeightPix(chartAreaHeightPix);

    // 创建 ResizeObserver 实例
    const resizeObserver = new ResizeObserver(([entry]) => {
      if (entry) {
        // contentRect.height 已经自动排除了内边距，直接使用即可
        setChartAreaHeightPix(entry.contentRect.height);
      }
    });

    // 开始观察元素
    resizeObserver.observe(chartArea);

    // 清理函数
    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  /**当前cm与px（px为屏幕像素）的转换比例，即1cm等于多少px */
  const pixelsPerCm = useMemo(() => {
    // 如果有手动调整的值，使用手动调整的值
    if (pixelsPerCmState !== 1) {
      return pixelsPerCmState;
    }
    // 否则使用自动计算的值
    const maxHeight = comparisonItems.length > 0 ? Math.max(...comparisonItems.map(item => item.character.height)) : 200;
    return (chartAreaHeightPix - 70) / maxHeight;
  }, [chartAreaHeightPix, comparisonItems, pixelsPerCmState]);

  // 添加缩放事件处理
  useEffect(() => {
    const chartArea = chartAreaRef.current;
    if (!chartArea) return;

    const handleWheel = (e: WheelEvent) => {
      // 检查是否按住了 Ctrl 键
      if (e.ctrlKey) {
        e.preventDefault(); // 阻止默认的缩放行为

        if (zoomStateRef.current.isZooming || Date.now() - zoomStateRef.current.zoomStart < 100) {
          return;
        }

        const container = scrollContainerRef.current;
        if (!container) return;

        zoomStateRef.current.isZooming = true;
        zoomStateRef.current.zoomStart = Date.now();

        // 记录中心点位置
        const scrollLeftRatio = (container.scrollLeft + container.clientWidth / 2) / container.scrollWidth;

        //console.log(`handleWheel方法中，开始缩放，scrollLeft：${container.scrollLeft}，scrollWidth：${container.scrollWidth}，clientWidth：${container.clientWidth}，scrollLeftRatio：${scrollLeftRatio}`);

        zoomStateRef.current.scrollLeftRatio = scrollLeftRatio;

        // 根据滚轮方向调整缩放比例
        const delta = e.deltaY > 0 ? -0.1 : 0.1;
        const currentScale = pixelsPerCm;
        const newScale = currentScale + (currentScale * delta); // 添加最小缩放限制

        setPixelsPerCmState(newScale);
      }
    }

    // 添加事件监听
    chartArea.addEventListener('wheel', handleWheel, { passive: false });

    // 清理函数
    return () => {
      chartArea.removeEventListener('wheel', handleWheel);
    };
  }, [pixelsPerCm]); // 移除 pixelsPerCm 依赖，避免重复绑定事件

  const [leftPanelSplit, setLeftPanelSplit] = useState(50); // 百分比，控制上下两个区域的高度分配
  const [isDragging, setIsDragging] = useState(false);

  // 添加 refs
  const rightPanelRef = useRef<HTMLDivElement>(null);
  const characterListRef = useRef<HTMLDivElement>(null);
  const chartAreaRef = useRef<HTMLDivElement>(null);

  // 添加拖拽状态
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    draggedItemId: null,
    startX: 0,
    offsetX: 0,
    originalStartX: 0,
    mouseX: 0,
    draggedOriginalLeft: 0,
  });

  // 添加拖拽相关的ref
  const charactersContainerRef = useRef<HTMLDivElement>(null);

  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // const isZooming = useRef(false);

  // 添加横向滚动状态
  const [horizontalScrollState, setHorizontalScrollState] = useState({
    isDragging: false,
    startX: 0,
    scrollLeft: 0
  });

  // 自定义滚动条状态
  const [scrollbarState, setScrollbarState] = useState({
    scrollLeft: 0,        // 当前滚动位置（从左边开始的像素距离）
    scrollWidth: 0,       // 内容的总宽度（包括不可见部分）
    clientWidth: 0,       // 容器的可见宽度（不包括滚动条）
    isDragging: false,    // 是否正在拖拽滚动条滑块
    startX: 0,           // 开始拖拽时的鼠标X坐标
    startScrollLeft: 0   // 开始拖拽时的滚动位置
  });

  const zoomStateRef = useRef({
    isZooming: false,
    scrollLeftRatio: 0,
    zoomStart: 0
  })


  // 处理点击事件
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!showRightPanel) return;

      const target = event.target as HTMLElement;

      // 检查点击是否在右侧面板内
      const isClickInRightPanel = rightPanelRef.current?.contains(target);

      // 检查点击是否在某个角色项上
      const isClickOnCharacterItem = target.closest('[data-character-item="true"]');

      // 检查是否点击了编辑按钮
      const isClickOnEditButton = target.closest('button[title="编辑角色"]');

      // 如果点击不在右侧面板内且不在角色项上且不是编辑按钮，关闭面板
      if (!isClickInRightPanel && !isClickOnCharacterItem && !isClickOnEditButton) {
        setShowRightPanel(false);
        setSelectedCharacter(null);
        setComparisonItems(items => items.map(item => ({ ...item, selected: false })));
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showRightPanel]);

  // 处理拖拽开始
  const handleDragStart = useCallback((itemId: string, e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const container = charactersContainerRef.current;
    if (!container) return;

    const itemElement = container.querySelector(`[data-item-id="${itemId}"]`) as HTMLElement;
    if (!itemElement) return;

    const rect = itemElement.getBoundingClientRect();
    const offsetX = clientX - rect.left;

    setDragState({
      isDragging: true,
      draggedItemId: itemId,
      startX: rect.left,
      offsetX,
      originalStartX: rect.left,
      mouseX: clientX,
      draggedOriginalLeft: rect.left
    });

    document.body.style.cursor = 'grabbing';
    document.body.style.userSelect = 'none';
  }, []);

  // 处理拖拽移动
  const handleDragMove = useCallback((e: MouseEvent | TouchEvent) => {
    if (!dragState.isDragging || !dragState.draggedItemId) return;

    e.preventDefault();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const container = charactersContainerRef.current;
    if (!container) return;

    setDragState(prev => ({ ...prev, mouseX: clientX }));

    // 计算位置交换
    const items = Array.from(container.querySelectorAll('[data-item-id]'));
    const draggedIndex = comparisonItems.findIndex(item => item.id === dragState.draggedItemId);
    if (draggedIndex === -1) return;

    // 获取被拖动元素的原始尺寸
    const draggedElement = items.find(item =>
      (item as HTMLElement).getAttribute('data-item-id') === dragState.draggedItemId
    );
    if (!draggedElement) return;

    const draggedRect = draggedElement.getBoundingClientRect();
    // 计算被拖动元素的实际位置（当前鼠标位置减去偏移量）
    const actualX = clientX - dragState.offsetX;
    const draggedLeftEdge = actualX;
    const draggedRightEdge = actualX + draggedRect.width;
    const draggedCenterX = actualX + draggedRect.width / 2;

    let targetIndex = draggedIndex;
    let closestDistance = Infinity;

    items.forEach((element, index) => {
      if (index === draggedIndex) return;

      const rect = (element as HTMLElement).getBoundingClientRect();
      const elementCenterX = rect.left + rect.width / 2;
      const distance = Math.abs(draggedCenterX - elementCenterX);

      // 向右拖动：当拖动元素的右边缘越过右侧元素的中心线时
      if (index > draggedIndex && draggedRightEdge > elementCenterX && distance < closestDistance) {
        targetIndex = index;
        closestDistance = distance;
      }
      // 向左拖动：当拖动元素的左边缘越过左侧元素的中心线时
      else if (index < draggedIndex && draggedLeftEdge < elementCenterX && distance < closestDistance) {
        targetIndex = index;
        closestDistance = distance;
      }
    });

    // 如果位置发生变化且冷却时间已过，更新顺序
    if (targetIndex !== draggedIndex) {

      const newItems = [...comparisonItems];
      const [draggedItem] = newItems.splice(draggedIndex, 1);
      newItems.splice(targetIndex, 0, draggedItem);

      const updatedItems = newItems.map((item, index) => ({
        ...item,
        order: index
      }));

      // 计算交换后被拖动元素的原始左边缘位置
      const targetElement = items[targetIndex] as HTMLElement;
      const newOriginalLeft = targetIndex > draggedIndex ? targetElement.getBoundingClientRect().right - draggedRect.width : targetElement.getBoundingClientRect().left;
      // console.log('角色即将交换，handleDragMove方法中： newOriginalLeft: ' + newOriginalLeft);
      setDragState(prev => ({ ...prev, draggedOriginalLeft: newOriginalLeft }));

      setComparisonItems(updatedItems);
    }
  }, [dragState, comparisonItems]);

  // 处理拖拽结束
  const handleDragEnd = useCallback((e: any) => {
    e.preventDefault();
    e.stopPropagation();

    setDragState(prev => ({
      isDragging: false,
      draggedItemId: null,
      startX: 0,
      offsetX: 0,
      originalStartX: 0,
      mouseX: 0,
      draggedOriginalLeft: 0,
      preventNextClick: true // 设置标记
    }));

    document.body.style.cursor = '';
    document.body.style.userSelect = '';
  }, []);

  // 添加全局事件监听
  useEffect(() => {
    if (dragState.isDragging) {
      const handleMouseMove = (e: MouseEvent) => handleDragMove(e);
      const handleMouseUp = (e) => handleDragEnd(e);
      const handleTouchMove = (e: TouchEvent) => handleDragMove(e);
      const handleTouchEnd = (e: TouchEvent) => handleDragEnd(e);

      document.addEventListener('mousemove', handleMouseMove, { passive: false });
      document.addEventListener('mouseup', handleMouseUp);
      document.addEventListener('touchmove', handleTouchMove, { passive: false });
      document.addEventListener('touchend', handleTouchEnd);

      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.removeEventListener('touchmove', handleTouchMove);
        document.removeEventListener('touchend', handleTouchEnd);
      };
    }
  }, [dragState.isDragging, handleDragMove, handleDragEnd]);

  // 计算每个项目的样式
  const getItemStyle = useCallback((itemId: string, index: number): React.CSSProperties => {
    if (!dragState.isDragging || itemId !== dragState.draggedItemId) {
      return {};
    }

    // 获取被拖动元素在当前位置下的原始左边缘位置（没有偏移量时）
    const container = charactersContainerRef.current;
    if (!container) return {};

    const draggedElement = container.querySelector(`[data-item-id="${itemId}"]`) as HTMLElement;
    if (!draggedElement) return {};

    // 计算translateX：鼠标位置 - (原始左边缘 + 鼠标偏移量)
    // console.log('getItemStyle方法中： dragState.mouseX: ' + dragState.mouseX + ' \ndragState.draggedOriginalLeft: ' + dragState.draggedOriginalLeft + ' \ndragState.offsetX: ' + dragState.offsetX);
    const translateX = dragState.mouseX - (dragState.draggedOriginalLeft + dragState.offsetX);
    // console.log('translateX: ' + translateX);

    return {
      transform: `translateX(${translateX}px)`,
      transition: 'none',
      opacity: 0.8,
      cursor: 'grabbing',
      zIndex: 1000,
      filter: 'brightness(0.9)',
      boxShadow: '0 8px 25px rgba(0,0,0,0.15)',
      position: 'relative'
    };
  }, [dragState]);


  // 筛选角色
  const filteredCharacters = PRESET_CHARACTERS.filter(char => {
    const matchesSearch = char.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || char.type === selectedCategory;
    return matchesSearch && matchesCategory;
  });


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

  const clearAllCharacters = () => {
    setComparisonItems([]);
    setSelectedCharacter(null);
    setShowRightPanel(false);
  };

  const selectComparisonItem = (item: ComparisonItem) => {
    setSelectedCharacter(item.character);
    setShowRightPanel(true);
    setComparisonItems(comparisonItems.map(i => ({
      ...i,
      selected: i.id === item.id
    })));
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

  // 处理横向滚动拖拽开始
  const handleHorizontalScrollStart = useCallback((e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    // 只有在没有点击角色且没有进行角色拖拽时才允许横向滚动
    if (target.closest('[data-item-id]') || dragState.isDragging) {
      return;
    }

    const container = scrollContainerRef.current;
    if (!container) return;

    setHorizontalScrollState({
      isDragging: true,
      startX: e.clientX,
      scrollLeft: container.scrollLeft
    });

    e.preventDefault();
  }, [dragState.isDragging]);

  // 处理横向滚动拖拽移动
  const handleHorizontalScrollMove = useCallback((e: MouseEvent) => {
    if (!horizontalScrollState.isDragging) return;

    const container = scrollContainerRef.current;
    if (!container) return;

    const deltaX = e.clientX - horizontalScrollState.startX;
    container.scrollLeft = horizontalScrollState.scrollLeft - deltaX;

    e.preventDefault();
  }, [horizontalScrollState]);

  // 处理横向滚动拖拽结束
  const handleHorizontalScrollEnd = useCallback(() => {
    if (horizontalScrollState.isDragging) {
      setHorizontalScrollState(prev => ({ ...prev, isDragging: false }));
    }
  }, [horizontalScrollState.isDragging]);

  // 添加横向滚动事件监听
  useEffect(() => {
    if (horizontalScrollState.isDragging) {
      document.addEventListener('mousemove', handleHorizontalScrollMove);
      document.addEventListener('mouseup', handleHorizontalScrollEnd);
      return () => {
        document.removeEventListener('mousemove', handleHorizontalScrollMove);
        document.removeEventListener('mouseup', handleHorizontalScrollEnd);
      };
    }
  }, [horizontalScrollState.isDragging, handleHorizontalScrollMove, handleHorizontalScrollEnd]);


  // 更新滚动条状态
  const updateScrollbarState = () => {
    const container = scrollContainerRef.current;
    if (!container) return;

    let newState = {};
    if (zoomStateRef.current.isZooming) {
      const scrollLeft = Math.max(0, Math.min(
        container.scrollWidth * zoomStateRef.current.scrollLeftRatio - container.clientWidth / 2,
        container.scrollWidth - container.clientWidth
      ));
      //console.log(`updateScrollbarState方法中，正在放大: scrollLeftRatio： ${zoomStateRef.current.scrollLeftRatio}, scrollWidth: ${container.scrollWidth},clientWidth: ${container.clientWidth}, 计算后的scrollLeft: ${scrollLeft}`);

      container.scrollLeft = scrollLeft;

      newState = {
        scrollLeft,
        scrollWidth: container.scrollWidth,
        clientWidth: container.clientWidth
      };
      zoomStateRef.current.isZooming = false;
    } else {
      newState = {
        scrollLeft: container.scrollLeft,
        scrollWidth: container.scrollWidth,
        clientWidth: container.clientWidth
      };
    }
    setScrollbarState(prev => ({
      ...prev,
      ...newState
    }));

    zoomStateRef.current.isZooming = false;
  };

  // 监听容器滚动和大小变化
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    // 初始更新
    updateScrollbarState();

    // 监听滚动事件
    const handleScroll = () => {
      updateScrollbarState();
    };

    // 创建 ResizeObserver 实例
    const resizeObserver = new ResizeObserver((entries) => {
      // isZooming.current = true;
      updateScrollbarState();
    });

    // 监听容器本身的大小变化
    resizeObserver.observe(container);

    let charactersContainerResizeObserver: ResizeObserver | null = null;

    if (charactersContainerRef.current) {
      charactersContainerResizeObserver = new ResizeObserver((entries) => {
        if (entries.length > 0) {
          // isZooming.current = true;
          const entry = entries[0];
          // if (entry.contentRect.width >= scrollbarState.clientWidth) {
          // console.log(`charactersContainerResizeObserver监测到charactersContainer大小发生变化，iszooming:${zoomStateRef.current.isZooming}, contentRect.width：${entry.contentRect.width}, 更新滚动条状态`);
          updateScrollbarState();
          // }
        }
      });

      charactersContainerResizeObserver.observe(charactersContainerRef.current);
    }

    container.addEventListener('scroll', handleScroll);

    return () => {
      container.removeEventListener('scroll', handleScroll);
      resizeObserver.disconnect();
      if (charactersContainerResizeObserver) {
        charactersContainerResizeObserver.disconnect();
      }
    };
  }, [comparisonItems.length]);

  // 特殊处理：当角色清空时强制更新滚动条状态
  useEffect(() => {
    if (comparisonItems.length === 0) {
      updateScrollbarState();
    }
  }, [comparisonItems.length]);

  // 处理自定义滚动条拖拽
  const handleScrollbarDragStart = useCallback((e: React.MouseEvent) => {
    setScrollbarState(prev => ({
      ...prev,
      isDragging: true,
      startX: e.clientX,
      startScrollLeft: prev.scrollLeft
    }));
    e.preventDefault();
  }, []);

  const handleScrollbarDragMove = useCallback((e: MouseEvent) => {
    if (!scrollbarState.isDragging) return;

    const container = scrollContainerRef.current;
    if (!container) return;

    const deltaX = e.clientX - scrollbarState.startX;
    const scrollbarTrackWidth = container.clientWidth;
    const thumbWidth = Math.max(20, (scrollbarState.clientWidth / scrollbarState.scrollWidth) * scrollbarTrackWidth);
    const maxThumbPosition = scrollbarTrackWidth - thumbWidth;
    const scrollRatio = deltaX / maxThumbPosition;
    const maxScrollLeft = scrollbarState.scrollWidth - scrollbarState.clientWidth;

    const newScrollLeft = Math.max(0, Math.min(maxScrollLeft, scrollbarState.startScrollLeft + (scrollRatio * maxScrollLeft)));
    container.scrollLeft = newScrollLeft;

    e.preventDefault();
  }, [scrollbarState]);

  const handleScrollbarDragEnd = useCallback(() => {
    setScrollbarState(prev => ({ ...prev, isDragging: false }));
  }, []);

  // 监听滚动条拖拽事件
  useEffect(() => {
    if (scrollbarState.isDragging) {
      document.addEventListener('mousemove', handleScrollbarDragMove);
      document.addEventListener('mouseup', handleScrollbarDragEnd);
      return () => {
        document.removeEventListener('mousemove', handleScrollbarDragMove);
        document.removeEventListener('mouseup', handleScrollbarDragEnd);
      };
    }
  }, [scrollbarState.isDragging, handleScrollbarDragMove, handleScrollbarDragEnd]);

  // 计算滚动条thumb的位置和大小
  const getScrollbarThumbStyle = useCallback(() => {
    const { scrollLeft, scrollWidth, clientWidth } = scrollbarState;

    if (scrollWidth <= clientWidth) {
      return { display: 'none' };
    }

    const trackWidth = clientWidth;
    const thumbWidth = Math.max(20, (clientWidth / scrollWidth) * trackWidth);
    const maxScrollLeft = scrollWidth - clientWidth;
    const thumbPosition = maxScrollLeft > 0 ? (scrollLeft / maxScrollLeft) * (trackWidth - thumbWidth) : 0;

    return {
      width: `${thumbWidth}px`,
      transform: `translateX(${thumbPosition}px)`,
      display: 'block'
    };
  }, [scrollbarState]);

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

          /* 完全隐藏滚动条但保持滚动功能 - 用于角色展示容器 */
          .custom-scrollbar {
            /* 隐藏滚动条但保持滚动功能 */
            -ms-overflow-style: none;  /* IE and Edge */
            scrollbar-width: none;  /* Firefox */
          }
          
          .custom-scrollbar::-webkit-scrollbar {
            display: none;  /* Chrome, Safari, Opera */
          }

          /* 拖动时的样式 */
          .dragging-item {
            user-select: none;
            -webkit-user-select: none;
            -moz-user-select: none;
            -ms-user-select: none;
          }

          .drag-preview {
            filter: brightness(0.9) blur(0.5px);
            transform: scale(1.02);
          }
        `
      }} />

      <div className="w-full relative flex bg-gray-50 h-[85vh]">
        {/* 左侧面板 */}
        <div className="min-w-80 w-1/5 h-full bg-white border-r border-gray-200 flex flex-col left-panel">
          {/* 当前角色列表 */}
          <div className="border-b border-gray-200 flex flex-col" style={{ height: `${leftPanelSplit}%` }}>
            <div className="px-4 py-2 border-b border-gray-200 bg-gray-100">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">当前角色</h2>
                <div className="flex gap-2">
                  <button
                    onClick={() => setUnit(unit === Unit.CM ? Unit.FT_IN : Unit.CM)}
                    className="flex items-center gap-1.5 px-2 py-1 bg-gray-100 rounded hover:bg-gray-200 text-sm font-medium"
                    title={`切换到${unit === Unit.CM ? '英尺' : '厘米'}`}
                  >
                    <span className={unit === Unit.CM ? 'text-blue-600' : 'text-gray-500'}>cm</span>
                    <ArrowLeftRight className="w-3.5 h-3.5 text-gray-400" />
                    <span className={unit === Unit.FT_IN ? 'text-blue-600' : 'text-gray-500'}>ft</span>
                  </button>
                </div>
              </div>
            </div>

            <div ref={characterListRef} className="flex-1 p-4 overflow-y-auto thin-scrollbar">
              <div className="space-y-1">
                {comparisonItems.length === 0 ? (
                  <p className="text-gray-500 text-sm">暂无比较对象</p>
                ) : (
                  comparisonItems.map(item => (
                    <div
                      key={item.id}
                      data-character-item="true"
                      data-item-id={item.id}
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
                          title="删除角色"
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
                    className="text-sm pl-7 pr-2 py-1 border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 w-36"
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
                      data-character-item="true"
                      className="relative group cursor-pointer"
                      onClick={() => {
                        addToComparison(character);
                      }}
                    >
                      {/* 正方形容器 */}
                      <div className="aspect-square w-full flex items-center justify-center bg-gray-50 rounded overflow-hidden">
                        {/* 角色缩略图 - 保持原始比例 */}
                        <div
                          className={`w-12 h-16 rounded flex items-center justify-center text-white text-sm font-bold hover:ring-2 hover:ring-gray-300 hover:ring-offset-1`}
                          style={{
                            backgroundColor: character.color
                          }}
                        >
                          {character.type === CharacterType.GENERIC ? '○' :
                            character.type === CharacterType.CELEBRITY ? '♂' :
                              character.type === CharacterType.FICTIONAL ? '⚡' :
                                character.type === CharacterType.OBJECT ? '🏠' :
                                  character.type === CharacterType.BUILDING ? '🏛️' :
                                    character.type === CharacterType.ANIMAL ? '🐘' :
                                      character.type === CharacterType.PLANT ? '🌳' : '○'}
                        </div>
                      </div>

                      {/* 悬浮提示 */}
                      <div className={`absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 z-10`}>
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
        <div className='flex flex-col h-full w-4/5'>
          <div id="top-ads" className="w-full h-[120px] m-0 py-[10px]"></div>
          <div className="flex-1 flex flex-col w-full">
            {/* 工具栏 */}
            <div className="p-4 bg-white border-b border-gray-200 h-16">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <h1 className="text-xl font-bold">身高比较工具</h1>
                  <div className="text-sm text-gray-600">
                    {comparisonItems.length} 个对象
                  </div>
                  <div className="text-sm text-gray-600">
                    pixelsPerCm: {pixelsPerCm.toFixed(2)}
                  </div>
                  <div className="text-sm text-gray-600">
                    chartAreaHeightPix: {chartAreaHeightPix}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={resetZoom}
                    className={`p-2 rounded transition-colors ${pixelsPerCmState === 1
                      ? 'bg-gray-50 text-gray-400 cursor-not-allowed'
                      : 'bg-gray-100 text-gray-600 hover:bg-blue-100 hover:text-blue-600'
                      }`}
                    title="重置缩放"
                    disabled={pixelsPerCmState === 1}
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      console.log('点击清除按钮，当前角色数量:', comparisonItems.length);
                      clearAllCharacters();
                    }}
                    className={`p-2 rounded transition-colors ${comparisonItems.length === 0
                      ? 'bg-gray-50 text-gray-400 cursor-not-allowed'
                      : 'bg-gray-100 text-gray-600 hover:bg-blue-100 hover:text-blue-600'
                      }`}
                    title="重置/清除全部角色"
                    disabled={comparisonItems.length === 0}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <div className="w-px h-6 bg-gray-300"></div>
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
            <div className="w-full flex-1 p-4 thin-scrollbar" style={{ backgroundColor: styleSettings.backgroundColor, height: `calc(100% - 16px)` }}>
              <div ref={chartAreaRef} className="relative w-full px-20 h-full flex items-end justify-center">
                {/* 网格线 */}
                {styleSettings.gridLines && (
                  <div className="absolute inset-0 pointer-events-none">
                    {Array.from({ length: 21 }, (_, i) => {
                      const heightPercentage = i / 20;
                      const pixHeight = chartAreaHeightPix * heightPercentage;
                      const cmHeight = Math.round(pixHeight / pixelsPerCm);
                      const inchHeight = cmHeight / 2.54;
                      const feet = Math.floor(inchHeight / 12);
                      const inches = (inchHeight % 12).toFixed(1);

                      return (
                        <div
                          key={i}
                          className="absolute left-0 w-full border-t border-gray-300"
                          style={{ bottom: `${heightPercentage * 100}%` }}
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
                <div className="relative w-full h-full p-0 m-0">
                  {/* 角色展示区域 */}
                  <div ref={scrollContainerRef}
                    className="w-full overflow-auto custom-scrollbar"
                    // 这里使用数值来设置容器高度，是为了防止内部内容变大时把容器撑大。h-full（即height: 100%;）会自动撑大容器。
                    style={{ height: chartAreaHeightPix }}
                    onMouseDown={handleHorizontalScrollStart}
                  >
                    {comparisonItems.length === 0 ? (
                      <div className="w-full h-full flex flex-col items-center justify-end text-gray-500">
                        <Users className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                        <p className="text-lg">请从左侧添加角色进行比较</p>
                      </div>
                    ) : (
                      <div
                        ref={charactersContainerRef}
                        className="w-fit h-full flex items-end justify-start mx-auto"
                        onMouseEnter={(e) => {
                          const target = e.target as HTMLElement;
                          if (!target.closest('[data-item-id]')) {
                            target.style.cursor = horizontalScrollState.isDragging ? 'grabbing' : 'grab';
                          }
                        }}
                        onMouseLeave={(e) => {
                          const target = e.target as HTMLElement;
                          target.style.cursor = '';
                        }}
                        onMouseMove={(e) => {
                          const target = e.target as HTMLElement;
                          if (!target.closest('[data-item-id]')) {
                            target.style.cursor = horizontalScrollState.isDragging ? 'grabbing' : 'grab';
                          } else {
                            target.style.cursor = '';
                          }
                        }}
                      >
                        {comparisonItems
                          .filter(item => item.visible)
                          .sort((a, b) => a.order - b.order)
                          .map((item, index) => (
                            <div
                              key={item.id}
                              data-item-id={item.id}
                              className={`flex flex-col items-center px-3 relative ${dragState.draggedItemId === item.id ? 'dragging-item' : ''}`}
                              style={getItemStyle(item.id, index)}
                              onClick={(e) => {
                                // 如果是拖拽后的点击，阻止事件
                                if (dragState.preventNextClick) {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  setDragState(prev => ({ ...prev, preventNextClick: false }));
                                  return;
                                }
                                if (!dragState.isDragging) {
                                  selectComparisonItem(item);
                                }
                              }}
                            >
                              <CharacterDisplay
                                character={item.character}
                                pixelsPerCm={pixelsPerCm}
                                isSelected={item.selected}
                                unit={unit}
                                isDragging={dragState.draggedItemId === item.id}
                                onEdit={() => !dragState.isDragging && selectComparisonItem(item)}
                                onMove={(e) => handleDragStart(item.id, e)}
                                onDelete={() => !dragState.isDragging && removeFromComparison(item.id)}
                              />
                            </div>
                          ))}
                      </div>
                    )}
                  </div>

                  {/* 自定义横向滚动条 */}
                  {comparisonItems.length > 0 && scrollbarState.scrollWidth > scrollbarState.clientWidth && (
                    <div className="absolute bottom-[-7px] left-0 h-[6px] bg-gray-100 rounded-full mx-2 mt-2">
                      {/* 滚动条轨道 */}
                      <div className="absolute inset-0 bg-gray-200 rounded-full"></div>
                      {/* 滚动条滑块 */}
                      <div
                        className={`absolute top-0 h-full bg-gray-400 rounded-full transition-colors cursor-pointer ${scrollbarState.isDragging ? 'bg-gray-600' : 'hover:bg-gray-500'
                          }`}
                        style={getScrollbarThumbStyle()}
                        onMouseDown={handleScrollbarDragStart}
                      ></div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 右侧编辑面板 - 工具区域内的绝对定位 */}
        {showRightPanel && selectedCharacter && (
          <div ref={rightPanelRef} className="absolute right-0 top-0 h-full w-80 bg-white shadow-xl z-10 overflow-y-auto border-l border-gray-200 thin-scrollbar">
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
                <label htmlFor="character-name" className="block text-sm font-medium text-gray-700 mb-1">名称</label>
                <input
                  id="character-name"
                  type="text"
                  value={selectedCharacter.name}
                  onChange={(e) => updateCharacter('name', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="输入角色名称"
                />
              </div>

              <div>
                <label htmlFor="character-height" className="block text-sm font-medium text-gray-700 mb-1">身高</label>
                <div className="flex gap-2">
                  <input
                    id="character-height"
                    type="number"
                    value={selectedCharacter.height}
                    onChange={(e) => updateCharacter('height', Number(e.target.value))}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    min="30"
                    max="300"
                    placeholder="输入身高"
                  />
                  <span className="px-3 py-2 bg-gray-100 rounded-md text-sm">cm</span>
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {convertHeight(selectedCharacter.height, Unit.FT_IN)}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">颜色</label>
                <div className="flex gap-2 flex-wrap">
                  {['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#6B7280'].map(color => (
                    <button
                      key={color}
                      onClick={() => updateCharacter('color', color)}
                      className={`w-8 h-8 rounded-full border-2 ${selectedCharacter.color === color ? 'border-gray-800' : 'border-gray-300'}`}
                      style={{ backgroundColor: color }}
                      title={`选择颜色: ${color}`}
                    />
                  ))}
                </div>
              </div>

              {selectedCharacter.isCustom && (
                <div>
                  <label htmlFor="character-description" className="block text-sm font-medium text-gray-700 mb-1">描述</label>
                  <textarea
                    id="character-description"
                    value={selectedCharacter.description || ''}
                    onChange={(e) => updateCharacter('description', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={3}
                    placeholder="输入角色描述"
                  />
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export { HeightCompareTool };

