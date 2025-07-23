import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import {
  Trash2, Search, Users, Share2, Download,
  Grid, Eye, EyeOff, ArrowLeftRight, RotateCcw, ZoomIn, ZoomOut, GripVertical
} from 'lucide-react';
import html2canvas from 'html2canvas';
import { CharacterDisplay } from './CharacterDisplay';
import { ImageUploadModal } from './ImageUploadModal';
import 'simplebar-react/dist/simplebar.min.css';
import { type Character, CharacterType } from '@lib/characters';
import { queryCharacters, type QueryCharactersResponse } from '@lib/characters';
import {
  Unit, Precision, convertHeightSmart, convertHeightSmartImperial, formatNumber, getBestUnit,
  getImperialGridUnitLabel, convertHeightPrecision, convertHeightForGridImperial, convertHeight
} from './HeightCalculates';
import { getContentRect } from '@lib/utils';
import { generateRandomName, shouldGenerateRandomName } from '@lib/nameGenerator';

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

// 获取最大高度用于动态单位制选择
const getMaxHeightInComparison = (items: ComparisonItem[]): number => {
  if (items.length === 0) return 2; // 默认值（米）
  return Math.max(...items.map(item => item.character.height));
};


// 添加拖拽状态接口
interface DragState {
  isDragging: boolean;
  draggedItemId: string | null;
  startMouseX: number;
  startMouseY: number;
  currentMouseX: number;
  currentMouseY: number;
  fixedElementX: number; // fixed元素的初始X位置
  fixedElementY: number; // fixed元素的初始Y位置
  draggedElement: HTMLElement | null; // 被拖拽元素的引用
  preventNextClick?: boolean;
}

// 主组件
const HeightCompareTool: React.FC = () => {
  const [unit, setUnit] = useState<Unit>(Unit.CM);
  /**
   * 当前在比较列表中的角色
   */
  const [comparisonItems, setComparisonItems] = useState<ComparisonItem[]>([]);
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null);
  const [selectedComparisonItemId, setSelectedComparisonItemId] = useState<string | null>(null);
  const [showRightPanel, setShowRightPanel] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<CharacterType | 'all'>(CharacterType.GENERIC);
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
  const [pixelsPerMState, setPixelsPerMState] = useState(1); // 添加新的状态
  const [showImageUploadModal, setShowImageUploadModal] = useState(false);

  // API相关状态
  const [characters, setCharacters] = useState<Character[]>([]);
  const [isLoadingCharacters, setIsLoadingCharacters] = useState(false);
  const [charactersError, setCharactersError] = useState<string | null>(null);

  const loadCharactersRequestId = useRef<number>(0); // 记录当前请求的ID，用于取消请求

  const loadCharacters = useCallback(() => {
    setIsLoadingCharacters(true);
    setCharactersError(null);

    let requestId = ++loadCharactersRequestId.current; // 记录当前请求的ID
    console.log(`开始加载角色数据，requestId：${requestId}, type：${selectedCategory}, search：${searchTerm}`)
    queryCharacters({
      type: selectedCategory,
      search: searchTerm,
      limit: 1000 // 可根据需要调整
    }).then(response => {
      if (requestId !== loadCharactersRequestId.current) {
        console.log(`requestId：${requestId} 请求已被覆盖，跳过处理, 最新的 requestId：${loadCharactersRequestId.current}`);
        // 如果本请求被覆盖，说明又最新的请求在进行中，那么此时不用把IsLoadingCharacters设为true
        return;
      }
      if (response.success) {
        console.log(`加载角色数据成功，requestId：${requestId}`);
        setCharacters(response.data);
      } else {
        setCharactersError(response.message || 'Failed to load characters');
      }
      setIsLoadingCharacters(false);
    }).catch(error => {
      setCharactersError('Failed to load characters');
      if (requestId == loadCharactersRequestId.current) {
        setIsLoadingCharacters(false);
      }
      console.error('Error loading characters:', error);
    })
  }, [selectedCategory, searchTerm])

  // 初始加载和搜索条件变化时重新加载角色数据
  useEffect(() => {
    loadCharacters()
  }, [loadCharacters]);

  // 添加重置缩放函数
  const resetZoom = () => {
    setPixelsPerMState(1); // 重置为默认值1，这会触发自动计算
  };

  // 角色数量为0时，重置缩放
  useEffect(() => {
    if (comparisonItems.length == 0) {
      resetZoom();
    }
  }, [comparisonItems.length])

  // 计算图表显示区域的像素高度
  useEffect(() => {
    const chartArea = chartAreaRef.current;
    if (!chartArea) return;

    // 初始化高度 - 使用工具函数获取内容区域高度
    const chartAreaHeightPix = getContentRect(chartArea).height;
    console.log('ChartAreaHeightPix: ' + chartAreaHeightPix);
    setChartAreaHeightPix(chartAreaHeightPix);

    // 创建 ResizeObserver 实例
    const resizeObserver = new ResizeObserver(([entry]) => {
      if (entry) {
        // contentRect.height 已经排除了内边距，直接使用
        setChartAreaHeightPix(entry.contentRect.height);
      }
    });

    // 开始监听元素
    resizeObserver.observe(chartArea);

    // 清理函数
    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  /**Current conversion ratio between m and px (screen pixels), i.e., how many px equals 1m */
  const pixelsPerM = useMemo(() => {
    // 如果有手动调整的值，使用手动调整的值
    if (pixelsPerMState !== 1) {
      return pixelsPerMState;
    }
    // 否则使用自动计算值，采用高精度计算
    const maxHeight = getMaxHeightInComparison(comparisonItems);
    const availablePixHeight = chartAreaHeightPix - 70;

    // 使用高精度计算以避免极端情况下的精度损失
    const pixHeightPrecision = Precision.from(availablePixHeight);
    const maxHeightPrecision = Precision.from(maxHeight);
    const ratio = pixHeightPrecision.divide(maxHeightPrecision);
    console.log(`Calculate ratio: availableHeight=${availablePixHeight}, maxHeight=${maxHeight}, ratio=${ratio}`);

    return ratio.toNumber();
  }, [chartAreaHeightPix, comparisonItems, pixelsPerMState]);

  const handleZoom = useCallback((zoomDelta: number) => {
    if (comparisonItems.length == 0) {
      return;
    }
    if (zoomStateRef.current.isZooming || Date.now() - zoomStateRef.current.zoomStart < 50) {
      return;
    }

    const container = scrollContainerRef.current;
    if (!container) return;

    zoomStateRef.current.isZooming = true;
    zoomStateRef.current.zoomStart = Date.now();

    // 记录中心点位置
    const scrollLeftRatio = (container.scrollLeft + container.clientWidth / 2) / container.scrollWidth;

    console.log(`handleZoom方法中，开始缩放，scrollLeft：${container.scrollLeft}，scrollWidth：${container.scrollWidth}，clientWidth：${container.clientWidth}，scrollLeftRatio：${scrollLeftRatio}`);

    zoomStateRef.current.scrollLeftRatio = scrollLeftRatio;

    // 清除之前的定时器
    if (zoomIndicatorTimerRef.current) {
      clearTimeout(zoomIndicatorTimerRef.current);
    }

    // 显示缩放指示器
    setZoomIndicator({
      show: true,
      type: zoomDelta > 0 ? 'in' : 'out',
      exiting: false
    });

    // 根据滚轮方向调整缩放比例
    const currentScale = pixelsPerM;
    const newScale = currentScale + (currentScale * zoomDelta);
    console.log(`handleZoom方法中，当前缩放比例：${currentScale}，新缩放比例：${newScale}`);

    setPixelsPerMState(newScale);

    // 重新设置定时器，800ms后开始淡出
    zoomIndicatorTimerRef.current = setTimeout(() => {
      setZoomIndicator(prev => ({ ...prev, exiting: true }));
      // 再等待200ms淡出动画完成后隐藏
      setTimeout(() => {
        setZoomIndicator({ show: false, type: 'in', exiting: false });
      }, 200);
      zoomIndicatorTimerRef.current = null;
    }, 800);
  }, [pixelsPerM, comparisonItems]);

  // 添加缩放事件处理
  useEffect(() => {
    const chartArea = chartAreaRef.current;
    if (!chartArea) return;

    const handleWheel = (e: WheelEvent) => {
      // 检查是否按下了Ctrl键
      if (e.ctrlKey) {
        console.log('Ctrl key pressed, starting zoom');
        e.preventDefault(); // 阻止默认的缩放行为
        const delta = e.deltaY > 0 ? -0.1 : 0.1;
        handleZoom(delta);
      }
    }

    // 添加事件监听器
    chartArea.addEventListener('wheel', handleWheel, { passive: false });

    // 清理函数
    return () => {
      chartArea.removeEventListener('wheel', handleWheel);
    };
  }, [handleZoom]); // 移除pixelsPerM依赖以避免重复的事件绑定

  const [leftPanelSplit, setLeftPanelSplit] = useState(50); // 百分比，控制上下区域的高度分配
  const [isDragging, setIsDragging] = useState(false);

  // 添加refs引用
  const rightPanelRef = useRef<HTMLDivElement>(null);
  const characterListRef = useRef<HTMLDivElement>(null);
  const chartAreaRef = useRef<HTMLDivElement>(null);

  // 添加拖拽状态
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    draggedItemId: null,
    startMouseX: 0,
    startMouseY: 0,
    currentMouseX: 0,
    currentMouseY: 0,
    fixedElementX: 0,
    fixedElementY: 0,
    draggedElement: null,
  });

  // 添加左侧面板角色列表拖拽状态
  const [leftPanelDragState, setLeftPanelDragState] = useState<DragState>({
    isDragging: false,
    draggedItemId: null,
    startMouseX: 0,
    startMouseY: 0,
    currentMouseX: 0,
    currentMouseY: 0,
    fixedElementX: 0,
    fixedElementY: 0,
    draggedElement: null,
  });

  // 添加拖拽相关的ref
  const charactersContainerRef = useRef<HTMLDivElement>(null);

  const scrollContainerRef = useRef<HTMLDivElement>(null);

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

  // 缩放指示器状态
  const [zoomIndicator, setZoomIndicator] = useState({
    show: false,
    type: 'in' as 'in' | 'out', // 'in' 表示放大，'out' 表示缩小
    exiting: false // 是否正在退出（淡出）
  })

  // 缩放指示器定时器引用
  const zoomIndicatorTimerRef = useRef<NodeJS.Timeout | null>(null)

  // 导出功能状态
  const [showExportDropdown, setShowExportDropdown] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const exportButtonRef = useRef<HTMLDivElement>(null)

  // 分享功能状态
  const [showShareDropdown, setShowShareDropdown] = useState(false)
  const [isSharing, setIsSharing] = useState(false)
  const shareButtonRef = useRef<HTMLDivElement>(null)

  // 图表标题状态
  const [chartTitle, setChartTitle] = useState('Height Comparison')
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const titleInputRef = useRef<HTMLInputElement>(null)

  // 添加水印到canvas
  const addWatermark = (originalCanvas: HTMLCanvasElement): HTMLCanvasElement => {
    console.log('Adding watermark to canvas:', originalCanvas.width, 'x', originalCanvas.height);

    // 创建新的canvas来合成图像和水印
    const newCanvas = document.createElement('canvas');
    const ctx = newCanvas.getContext('2d');
    if (!ctx) {
      console.error('Failed to get canvas context');
      return originalCanvas;
    }

    // 设置新canvas的尺寸与原canvas相同
    newCanvas.width = originalCanvas.width;
    newCanvas.height = originalCanvas.height;

    // 首先绘制原始图像
    ctx.drawImage(originalCanvas, 0, 0);

    // 设置水印样式
    const fontSize = Math.max(16, Math.min(36, originalCanvas.width / 25));
    ctx.font = `${fontSize}px Arial, sans-serif`;
    ctx.textAlign = 'center'; // 中心对齐
    ctx.textBaseline = 'bottom';

    // 水印文本
    const watermarkText = 'compareheights.org';

    // 计算水印位置 (底部中间)
    const padding = 15;
    const x = originalCanvas.width / 2; // 水平中心
    const y = originalCanvas.height - padding; // 底部留边距

    // 测量文本尺寸
    const textMetrics = ctx.measureText(watermarkText);
    const textWidth = textMetrics.width;
    const textHeight = fontSize;

    // 绘制半透明白色背景 (中心对齐的矩形)
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.fillRect(x - textWidth / 2 - 10, y - textHeight - 5, textWidth + 20, textHeight + 10);

    // 绘制水印文字 - 黑色
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillText(watermarkText, x, y);

    console.log('Watermark added successfully to new canvas');
    return newCanvas;
  };

  // 导出图表为图片
  const exportChart = useCallback(async (format: 'png' | 'jpg' | 'webp' = 'png') => {
    if (!chartAreaRef.current || comparisonItems.length === 0) {
      console.warn('Chart area not found or no character data');
      return;
    }

    setIsExporting(true);

    // 让React先更新UI显示加载状态，然后再执行耗时操作
    setTimeout(async () => {
      const element = chartAreaRef.current;
      if (!element) {
        setIsExporting(false);
        return;
      }

      try {
        // 使用html2canvas进行截图，手动扩展捕获区域
        const canvas = await html2canvas(element, {
          backgroundColor: styleSettings.backgroundColor,
          useCORS: true,
          scale: 2,
          x: -20,  // 向左扩展20px
          y: -60,  // 向上扩展60px（包含标题）
          width: element.offsetWidth + 40,   // 左右各扩展20px
          height: element.offsetHeight + 100, // 上下扩展100px（上60px+下40px）
          // 忽略特定元素
          ignoreElements: (element) => {
            return element.id == 'zoom-controlls' ||
              element.id == 'characters-container-scrollbar';
          },
        });

        // 添加水印后下载图片
        const canvasWithWatermark = addWatermark(canvas);
        downloadCanvas(canvasWithWatermark, format, chartTitle);

      } catch (error) {
        console.error('Export failed:', error);

        // 错误处理：提供用户友好的提示
        const errorMessage = `Image export failed. Possible reasons:
• Image resource loading issues
• Browser security restrictions

Suggested solutions:
1. Refresh the page and try again
2. Use browser screenshot function:
   - Chrome: F12 → Ctrl+Shift+P → Type "screenshot"
   - Or use system screenshot tool (Win+Shift+S)`;

        alert(errorMessage);
      } finally {
        setIsExporting(false);
        setShowExportDropdown(false);
      }
    }, 0); // 使用0延迟，让React先完成一次渲染循环
  }, [comparisonItems, styleSettings.backgroundColor, chartTitle]);

  // 将Canvas下载为图片
  const downloadCanvas = (canvas: HTMLCanvasElement, format: 'png' | 'jpg' | 'webp', title: string) => {
    try {
      const link = document.createElement('a');
      link.download = title;

      // 根据格式设置不同的质量参数
      let dataUrl: string;
      if (format === 'jpg') {
        dataUrl = canvas.toDataURL('image/jpeg', 0.92); // 高质量JPEG
      } else if (format === 'webp') {
        dataUrl = canvas.toDataURL('image/webp', 0.95); // 高质量WebP
      } else {
        dataUrl = canvas.toDataURL('image/png'); // PNG无损
      }

      link.href = dataUrl;

      // 触发下载
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // 显示成功消息
      console.log(`Image exported as ${format.toUpperCase()} format`);

    } catch (error) {
      console.error('Download failed:', error);
      alert('File download failed, please check browser download settings');
    }
  };

  // 生成分享用的 PNG 图片
  const generateShareImage = useCallback(async (): Promise<Blob | null> => {
    if (comparisonItems.length === 0) return null;

    const element = chartAreaRef.current;
    if (!element) return null;

    try {
      setIsSharing(true);

      // 使用与导出相同的配置生成图片
      const canvas = await html2canvas(element, {
        backgroundColor: styleSettings.backgroundColor,
        useCORS: true,
        scale: 2,
        x: -20,
        y: -60,
        width: element.offsetWidth + 40,
        height: element.offsetHeight + 100,
        ignoreElements: (element) => {
          return element.id == 'zoom-controlls' ||
            element.id == 'characters-container-scrollbar';
        },
      });

      // 添加水印
      const canvasWithWatermark = addWatermark(canvas);

      // 转换为 Blob
      return new Promise((resolve) => {
        canvasWithWatermark.toBlob((blob) => {
          resolve(blob);
        }, 'image/png', 1.0);
      });
    } catch (error) {
      console.error('Failed to generate share image:', error);
      return null;
    } finally {
      setIsSharing(false);
    }
  }, [comparisonItems, styleSettings.backgroundColor, chartTitle]);

  // 社交媒体分享配置
  const socialPlatforms = [
    {
      name: 'Twitter',
      icon: '🐦',
      color: '#1DA1F2',
      shareUrl: (text: string, url: string) =>
        `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`
    },
    {
      name: 'Facebook',
      icon: '📘',
      color: '#1877F2',
      shareUrl: (text: string, url: string) =>
        `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}&quote=${encodeURIComponent(text)}`
    },
    {
      name: 'LinkedIn',
      icon: '💼',
      color: '#0A66C2',
      shareUrl: (text: string, url: string) =>
        `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}&summary=${encodeURIComponent(text)}`
    },
    {
      name: 'Reddit',
      icon: '🔶',
      color: '#FF4500',
      shareUrl: (text: string, url: string) =>
        `https://reddit.com/submit?url=${encodeURIComponent(url)}&title=${encodeURIComponent(text)}`
    },
    {
      name: 'Telegram',
      icon: '✈️',
      color: '#0088CC',
      shareUrl: (text: string, url: string) =>
        `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`
    },
    {
      name: 'WhatsApp',
      icon: '💬',
      color: '#25D366',
      shareUrl: (text: string, url: string) =>
        `https://wa.me/?text=${encodeURIComponent(`${text} ${url}`)}`
    }
  ];

  // 生成分享文案
  const generateShareText = useCallback(() => {
    const characterNames = comparisonItems
      .slice(0, 3) // 最多显示前3个角色
      .map(item => item.character.name)
      .join(', ');

    const moreText = comparisonItems.length > 3 ? ` and ${comparisonItems.length - 3} more` : '';

    const titles = [
      `🏗️ Amazing height comparison: ${characterNames}${moreText}! 📷 Image included! Check it out at compareheights.org`,
      `📏 Mind-blowing size comparison featuring ${characterNames}${moreText}! 🖼️ See the visual scale at compareheights.org`,
      `🎯 Visual height showdown: ${characterNames}${moreText}! 📈 Compare sizes with image at compareheights.org`,
      `⚡ Epic scale comparison with ${characterNames}${moreText}! 🎆 Explore with visual at compareheights.org`,
      `🔥 Height battle: ${characterNames}${moreText}! 🎭 Discover the differences (image attached) at compareheights.org`
    ];

    // 随机选择一个标题
    return titles[Math.floor(Math.random() * titles.length)];
  }, [comparisonItems]);

  // 复制图片到剪贴板的函数
  const copyImageToClipboard = useCallback(async (imageBlob: Blob): Promise<boolean> => {
    try {
      // 检查是否支持 ClipboardItem 和图片复制
      if ('ClipboardItem' in window && navigator.clipboard.write) {
        const clipboardItem = new ClipboardItem({
          'image/png': imageBlob
        });
        await navigator.clipboard.write([clipboardItem]);
        return true;
      }
    } catch (error) {
      console.log('Clipboard image copy not supported:', error);
    }
    return false;
  }, []);

  // 处理社交媒体分享
  const handleSocialShare = useCallback(async (platform: typeof socialPlatforms[0]) => {
    const shareText = generateShareText();
    const shareUrl = 'https://compareheights.org';

    try {
      // 使用 Web Share API (如果支持)
      if (navigator.share && platform.name === 'Native') {
        const imageBlob = await generateShareImage();
        const shareData: ShareData = {
          title: 'Height Comparison Tool',
          text: shareText,
          url: shareUrl
        };

        // 如果支持文件分享，添加图片
        if (imageBlob && navigator.canShare) {
          const files = [new File([imageBlob], 'height-comparison.png', { type: 'image/png' })];
          try {
            if (navigator.canShare({ files })) {
              shareData.files = files;
            }
          } catch (e) {
            // 如果 canShare 不支持 files 参数，则跳过
          }
        }

        await navigator.share(shareData);
      } else {
        // 对于其他平台，尝试多种方式分享图片
        const imageBlob = await generateShareImage();
        let shareMethod = '';
        
        if (imageBlob) {
          // 方法1: 尝试复制图片到剪贴板
          const clipboardSuccess = await copyImageToClipboard(imageBlob);
          
          if (clipboardSuccess) {
            shareMethod = 'clipboard';
            // 复制文本到剪贴板
            try {
              await navigator.clipboard.writeText(shareText);
            } catch (e) {
              console.log('Text copy failed:', e);
            }
          } else {
            // 方法2: 下载图片作为备选
            shareMethod = 'download';
            const url = URL.createObjectURL(imageBlob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `height-comparison-${Date.now()}.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
          }
        }
        
        // 延迟一下确保操作完成
        await new Promise(resolve => setTimeout(resolve, 300));
        
        // 打开社交媒体分享页面
        const platformUrl = platform.shareUrl(shareText, shareUrl);
        window.open(platformUrl, '_blank', 'width=600,height=400,scrollbars=yes,resizable=yes');
        
        // 根据分享方法显示不同的提示
        setTimeout(() => {
          if (shareMethod === 'clipboard') {
            alert(`📋 Image and text copied to clipboard!\n\nIn the ${platform.name} sharing page:\n1. Paste text content (Ctrl+V)\n2. Paste image (Ctrl+V)\n\nYou can now publish your post with the image!`);
          } else if (shareMethod === 'download') {
            alert(`📥 Image downloaded to your device!\n\nIn the ${platform.name} sharing page:\n1. Type or paste the sharing text\n2. Click the image upload button and select the downloaded image\n\nYou can now publish your post with the image!`);
          }
        }, 500);
      }

      setShowShareDropdown(false);
    } catch (error) {
      console.error('Share failed:', error);
      // 如果分享失败，至少复制链接到剪贴板
      try {
        await navigator.clipboard.writeText(`${shareText} ${shareUrl}`);
        alert('📎 Share link copied to clipboard!');
      } catch (clipboardError) {
        console.error('Failed to copy to clipboard:', clipboardError);
        alert('Share failed. Please manually copy the link: ' + shareUrl);
      }
    }
  }, [generateShareText, generateShareImage, copyImageToClipboard]);

  // 处理复制链接
  const handleCopyLink = useCallback(async () => {
    try {
      const text = `${generateShareText()} https://compareheights.org`;
      await navigator.clipboard.writeText(text);
      alert('Share text copied to clipboard!');
      setShowShareDropdown(false);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
      // 创建临时文本区域作为备选方案
      const textArea = document.createElement('textarea');
      textArea.value = `${generateShareText()} https://compareheights.org`;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      alert('Share text copied to clipboard!');
      setShowShareDropdown(false);
    }
  }, [generateShareText]);

  // 处理下载分享图片
  const handleDownloadShareImage = useCallback(async () => {
    const imageBlob = await generateShareImage();
    if (!imageBlob) {
      alert('Failed to generate share image');
      return;
    }

    try {
      const url = URL.createObjectURL(imageBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `height-comparison-${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      setShowShareDropdown(false);
    } catch (error) {
      console.error('Failed to download share image:', error);
      alert('Failed to download image');
    }
  }, [generateShareImage]);

  // 处理分享下拉菜单
  const handleShareClick = useCallback(() => {
    setShowShareDropdown(!showShareDropdown);
  }, [showShareDropdown]);

  // 处理导出下拉菜单
  const handleExportClick = useCallback(() => {
    setShowExportDropdown(!showExportDropdown);
  }, [showExportDropdown]);

  // 处理导出下拉菜单的外部点击
  useEffect(() => {
    if (!showExportDropdown) return;

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;

      // 如果点击导出按钮和下拉菜单外部，则关闭下拉菜单
      if (exportButtonRef.current && !exportButtonRef.current.contains(target)) {
        setShowExportDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showExportDropdown]);

  // 处理分享下拉菜单的外部点击
  useEffect(() => {
    if (!showShareDropdown) return;

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;

      // 如果点击分享按钮和下拉菜单外部，则关闭下拉菜单
      if (shareButtonRef.current && !shareButtonRef.current.contains(target)) {
        setShowShareDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showShareDropdown]);

  const handleTitleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === 'Escape') {
      e.preventDefault();
      setIsEditingTitle(false);
    }
  };

  // 当开始编辑标题时，自动聚焦输入框
  useEffect(() => {
    if (isEditingTitle && titleInputRef.current) {
      titleInputRef.current.focus();
      titleInputRef.current.select();
    }
  }, [isEditingTitle]);

  // 处理标题编辑时的全局点击事件
  useEffect(() => {
    if (!isEditingTitle) return;

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;

      // 如果点击的不是标题输入框，则保存并退出编辑
      if (titleInputRef.current && !titleInputRef.current.contains(target)) {
        setIsEditingTitle(false);
      }
    };

    // 添加全局点击监听器
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isEditingTitle]);

  // 处理点击事件
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!showRightPanel) return;

      const target = event.target as HTMLElement;

      // 检查点击是否在右侧面板内
      const isClickInRightPanel = rightPanelRef.current?.contains(target);

      // 检查点击是否在角色项目上
      const isClickOnCharacterItem = target.closest('[data-character-item="true"]');

      // 检查是否点击了编辑按钮
      const isClickOnEditButton = target.closest('button[title="Edit character"]');

      // 如果点击不在右侧面板、不在角色项目上、也不是编辑按钮，则关闭面板
      if (!isClickInRightPanel && !isClickOnCharacterItem && !isClickOnEditButton) {
        setShowRightPanel(false);
        setSelectedCharacter(null);
        setSelectedComparisonItemId(null);
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
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const container = charactersContainerRef.current;
    if (!container) return;

    const itemElement = container.querySelector(`[data-item-id="${itemId}"]`) as HTMLElement;
    if (!itemElement) return;

    const rect = itemElement.getBoundingClientRect();

    setDragState({
      isDragging: true,
      draggedItemId: itemId,
      startMouseX: clientX,
      startMouseY: clientY,
      currentMouseX: clientX,
      currentMouseY: clientY,
      fixedElementX: rect.left,
      fixedElementY: rect.top,
      draggedElement: itemElement,
    });

    document.body.style.cursor = 'grabbing';
    document.body.style.userSelect = 'none';
  }, []);

  // 处理拖拽移动
  const handleDragMove = useCallback((e: MouseEvent | TouchEvent) => {
    if (!dragState.isDragging || !dragState.draggedItemId) return;

    e.preventDefault();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const container = charactersContainerRef.current;
    if (!container) return;

    // 更新当前鼠标位置
    setDragState(prev => ({
      ...prev,
      currentMouseX: clientX,
      currentMouseY: clientY
    }));

    // 计算fixed拖拽元素应该与哪个占位元素交换
    const items = Array.from(container.querySelectorAll('[data-item-id]')).filter(
      item => (item as HTMLElement).getAttribute('data-item-id') !== dragState.draggedItemId
    );

    const draggedIndex = comparisonItems.findIndex(item => item.id === dragState.draggedItemId);
    if (draggedIndex === -1) return;

    // 获取fixed元素的边缘位置
    const dragOffsetX = clientX - dragState.startMouseX;
    const fixedElementWidth = dragState.draggedElement?.offsetWidth || 0;
    const fixedLeftEdge = dragState.fixedElementX + dragOffsetX;
    const fixedRightEdge = fixedLeftEdge + fixedElementWidth;

    let targetIndex = draggedIndex;
    let closestDistance = Infinity;

    items.forEach((element, originalIndex) => {
      // 需要根据原始数组找到正确的索引
      const itemId = (element as HTMLElement).getAttribute('data-item-id');
      const actualIndex = comparisonItems.findIndex(item => item.id === itemId);
      if (actualIndex === -1) return;

      const rect = (element as HTMLElement).getBoundingClientRect();
      const elementCenterX = rect.left + rect.width / 2;

      // 计算距离用于选择最近的目标
      const distance = Math.abs((fixedLeftEdge + fixedRightEdge) / 2 - elementCenterX);

      // 当fixed元素边缘越过其他元素中心时判断交换
      if (actualIndex !== draggedIndex && distance < closestDistance) {
        // 向右拖动：被拖角色右边缘越过右边角色中心线
        // 向左拖动：被拖角色左边缘越过左边角色中心线
        if ((actualIndex > draggedIndex && fixedRightEdge > elementCenterX) ||
          (actualIndex < draggedIndex && fixedLeftEdge < elementCenterX)) {
          targetIndex = actualIndex;
          closestDistance = distance;
        }
      }
    });

    // 如果需要交换位置，只更新占位元素的顺序
    if (targetIndex !== draggedIndex) {
      const newItems = [...comparisonItems];
      const [draggedItem] = newItems.splice(draggedIndex, 1);
      newItems.splice(targetIndex, 0, draggedItem);

      const updatedItems = newItems.map((item, index) => ({
        ...item,
        order: index
      }));

      setComparisonItems(updatedItems);
    }
  }, [dragState, comparisonItems]);

  // 处理拖拽结束
  const handleDragEnd = useCallback((e: any) => {
    e.preventDefault();
    e.stopPropagation();

    setDragState({
      isDragging: false,
      draggedItemId: null,
      startMouseX: 0,
      startMouseY: 0,
      currentMouseX: 0,
      currentMouseY: 0,
      fixedElementX: 0,
      fixedElementY: 0,
      draggedElement: null,
      preventNextClick: true
    });

    document.body.style.cursor = '';
    document.body.style.userSelect = '';
  }, []);

  // 左侧角色列表拖拽处理函数
  const handleLeftPanelDragStart = useCallback((itemId: string, e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const container = characterListRef.current;
    if (!container) return;

    const itemElement = container.querySelector(`[data-left-item-id="${itemId}"]`) as HTMLElement;
    if (!itemElement) return;

    const rect = itemElement.getBoundingClientRect();

    setLeftPanelDragState({
      isDragging: true,
      draggedItemId: itemId,
      startMouseX: clientX,
      startMouseY: clientY,
      currentMouseX: clientX,
      currentMouseY: clientY,
      fixedElementX: rect.left,
      fixedElementY: rect.top,
      draggedElement: itemElement,
    });

    document.body.style.cursor = 'grabbing';
    document.body.style.userSelect = 'none';
  }, []);

  const handleLeftPanelDragMove = useCallback((e: MouseEvent | TouchEvent) => {
    if (!leftPanelDragState.isDragging || !leftPanelDragState.draggedItemId) return;

    e.preventDefault();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const container = characterListRef.current;
    if (!container) return;

    setLeftPanelDragState(prev => ({
      ...prev,
      currentMouseX: clientX,
      currentMouseY: clientY
    }));

    // 计算拖拽元素应该与哪个元素交换
    const items = Array.from(container.querySelectorAll('[data-left-item-id]')).filter(
      item => (item as HTMLElement).getAttribute('data-left-item-id') !== leftPanelDragState.draggedItemId
    );

    const draggedIndex = comparisonItems.findIndex(item => item.id === leftPanelDragState.draggedItemId);
    if (draggedIndex === -1) return;

    const dragOffsetY = clientY - leftPanelDragState.startMouseY;
    const fixedElementHeight = leftPanelDragState.draggedElement?.offsetHeight || 0;
    const fixedTopEdge = leftPanelDragState.fixedElementY + dragOffsetY;
    const fixedBottomEdge = fixedTopEdge + fixedElementHeight;

    let targetIndex = draggedIndex;
    let closestDistance = Infinity;

    items.forEach((element) => {
      const itemId = (element as HTMLElement).getAttribute('data-left-item-id');
      const actualIndex = comparisonItems.findIndex(item => item.id === itemId);
      if (actualIndex === -1) return;

      const rect = (element as HTMLElement).getBoundingClientRect();
      const elementCenterY = rect.top + rect.height / 2;

      const distance = Math.abs((fixedTopEdge + fixedBottomEdge) / 2 - elementCenterY);

      if (actualIndex !== draggedIndex && distance < closestDistance) {
        if ((actualIndex > draggedIndex && fixedBottomEdge > elementCenterY) ||
          (actualIndex < draggedIndex && fixedTopEdge < elementCenterY)) {
          targetIndex = actualIndex;
          closestDistance = distance;
        }
      }
    });

    if (targetIndex !== draggedIndex) {
      const newItems = [...comparisonItems];
      const [draggedItem] = newItems.splice(draggedIndex, 1);
      newItems.splice(targetIndex, 0, draggedItem);

      const updatedItems = newItems.map((item, index) => ({
        ...item,
        order: index
      }));

      setComparisonItems(updatedItems);
    }
  }, [leftPanelDragState, comparisonItems]);

  const handleLeftPanelDragEnd = useCallback((e: any) => {
    e.preventDefault();
    e.stopPropagation();

    setLeftPanelDragState({
      isDragging: false,
      draggedItemId: null,
      startMouseX: 0,
      startMouseY: 0,
      currentMouseX: 0,
      currentMouseY: 0,
      fixedElementX: 0,
      fixedElementY: 0,
      draggedElement: null,
      preventNextClick: true
    });

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

  // 添加左侧角色列表拖拽的全局事件监听
  useEffect(() => {
    if (leftPanelDragState.isDragging) {
      const handleMouseMove = (e: MouseEvent) => handleLeftPanelDragMove(e);
      const handleMouseUp = (e) => handleLeftPanelDragEnd(e);
      const handleTouchMove = (e: TouchEvent) => handleLeftPanelDragMove(e);
      const handleTouchEnd = (e: TouchEvent) => handleLeftPanelDragEnd(e);

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
  }, [leftPanelDragState.isDragging, handleLeftPanelDragMove, handleLeftPanelDragEnd]);

  // 计算占位元素样式（拖拽时显示为透明占位符）
  const getItemStyle = useCallback((itemId: string, index: number): React.CSSProperties => {
    if (!dragState.isDragging || itemId !== dragState.draggedItemId) {
      return {};
    }

    // 被拖拽的元素在原位置显示为透明占位符
    return {
      opacity: 0,
      visibility: 'hidden'
    };
  }, [dragState]);

  // 计算左侧面板角色列表项样式
  const getLeftPanelItemStyle = useCallback((itemId: string): React.CSSProperties => {
    if (!leftPanelDragState.isDragging || itemId !== leftPanelDragState.draggedItemId) {
      return {};
    }

    // 被拖拽的元素在原位置显示为透明占位符
    return {
      opacity: 0.3,
      pointerEvents: 'none'
    };
  }, [leftPanelDragState]);

  const addToComparison = (character: Character) => {
    const name = shouldGenerateRandomName(character.id) ? generateRandomName(character.id, character.name) : character.name
    // 计算相同原始角色的数量以生成序号
    let maxSimilarNameIndex: number = -1;
    for (let i = 0; i < comparisonItems.length; i++) {
      if (comparisonItems[i].character.name.length >= name.length &&
        comparisonItems[i].character.name.startsWith(name)) {
        const indexStr = comparisonItems[i].character.name.slice(name.length);
        if (indexStr == null || indexStr == '') {
          maxSimilarNameIndex = 0;
        } else {
          try {
            const index = parseInt(indexStr);
            if (index > maxSimilarNameIndex) {
              maxSimilarNameIndex = index;
            }
          } catch (e) {
            console.warn(' addToComparison, parse name index failed: ', e);
          }
        }
      }
    }

    // 创建角色的深拷贝以避免引用同一对象
    const newCharacter: Character = {
      ...character,
      id: `custom-${character.id}-${Date.now()}-${Math.random()}`, // 确保具有自定义前缀的唯一ID
      name: maxSimilarNameIndex == -1 ? name : `${name}${maxSimilarNameIndex + 1}`
    };

    const newItem: ComparisonItem = {
      id: `comparison-${Date.now()}-${Math.random()}`,
      character: newCharacter,
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
    setSelectedComparisonItemId(null);
    setShowRightPanel(false);
  };

  const selectComparisonItem = (item: ComparisonItem) => {
    setSelectedCharacter(item.character);
    setSelectedComparisonItemId(item.id);
    setShowRightPanel(true);
    setComparisonItems(comparisonItems.map(i => ({
      ...i,
      selected: i.id === item.id
    })));
  };

  const updateCharacter = (key: string, value: any) => {
    if (!selectedCharacter || !selectedComparisonItemId) return;

    // 在比较列表中更新角色
    setComparisonItems(comparisonItems.map(item =>
      item.id === selectedComparisonItemId
        ? { ...item, character: { ...item.character, [key]: value } }
        : item
    ));

    // 更新选中的角色
    setSelectedCharacter({ ...selectedCharacter, [key]: value });
  };

  // 处理图片上传并创建角色
  const handleImageUpload = (imageData: {
    imageUrl: string;
    heightInM: number;
    widthInM?: number;
    aspectRatio: number;
  }) => {
    const { imageUrl, heightInM, widthInM, aspectRatio } = imageData;

    // 创建新角色
    const newCharacter: Character = {
      id: `upload-${Date.now()}-${Math.random()}`,
      name: 'Uploaded Character',
      height: heightInM,
      // width: calculatedWidthInM,
      type: CharacterType.UPLOAD,
      // 媒体相关字段 - 扁平化
      mediaType: 'image',
      mediaUrl: imageUrl,
      thumbnailUrl: imageUrl,
      // 外观相关字段 - 扁平化
      color: '#10B981',
      colorCustomizable: false
    };

    // 添加到比較列表
    addToComparison(newCharacter);

    // 关闭上传模态框
    setShowImageUploadModal(false);
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
    // 确保分隔线始终可见，限制在25%-75%之间
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

  // 添加横向滚动事件监听器
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
      setScrollbarState(prev => {
        return {
          ...prev,
          ...newState
        }
      });
      zoomStateRef.current.isZooming = false;
    } else {
      newState = {
        scrollLeft: container.scrollLeft,
        scrollWidth: container.scrollWidth,
        clientWidth: container.clientWidth
      };
      setScrollbarState(prev => ({
        ...prev,
        ...newState
      }));
    }
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

  // 计算滚动条滑块位置和大小
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

  // 组件卸载时清理定时器
  useEffect(() => {
    return () => {
      if (zoomIndicatorTimerRef.current) {
        clearTimeout(zoomIndicatorTimerRef.current);
      }
    };
  }, []);

  return (
    <>
      {/* Global thin scrollbar styles */}
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

          /* Completely hide scrollbar but maintain scroll function - for character display container */
          .custom-scrollbar {
            /* Hide scrollbar but maintain scroll function */
            -ms-overflow-style: none;  /* IE and Edge */
            scrollbar-width: none;  /* Firefox */
          }
          
          .custom-scrollbar::-webkit-scrollbar {
            display: none;  /* Chrome, Safari, Opera */
          }

          /* 拖拽时的样式 */
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

      <div className="w-full relative flex bg-gray-50 h-[85vh] overflow-hidden">
        {/* 左侧面板 */}
        <div className="min-w-80 w-1/5 h-full bg-white border-r border-gray-200 flex flex-col left-panel">
          {/* 当前角色列表 */}
          <div className="border-b border-gray-200 flex flex-col" style={{ height: `${leftPanelSplit}%` }}>
            <div className="px-2 py-2 border-b border-gray-200 bg-gray-100">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-semibold">Current Characters</h2>
                <div className="flex gap-1">
                  <button
                    onClick={() => setUnit(unit === Unit.CM ? Unit.FT_IN : Unit.CM)}
                    className="flex items-center gap-1.5 px-2 py-1 bg-gray-100 rounded hover:bg-gray-200 text-sm font-medium"
                    title={`Switch to ${unit === Unit.CM ? 'feet' : 'centimeters'}`}
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
                  <p className="text-gray-500 text-sm">No characters to compare</p>
                ) : (
                  comparisonItems
                    .sort((a, b) => a.order - b.order)
                    .map(item => (
                      <div
                        key={item.id}
                        data-character-item="true"
                        data-item-id={item.id}
                        data-left-item-id={item.id}
                        className={`flex items-center justify-between p-2 text-sm border-l-4 cursor-pointer transition-all ${item.selected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:bg-gray-50'
                          } ${leftPanelDragState.isDragging && leftPanelDragState.draggedItemId === item.id ? 'dragging-item' : ''}`}
                        style={getLeftPanelItemStyle(item.id)}
                        onClick={() => !leftPanelDragState.isDragging && selectComparisonItem(item)}
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{item.character.name}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-gray-600">
                            {unit === Unit.CM ?
                              convertHeightSmart(item.character.height, true) :
                              convertHeightSmartImperial(item.character.height)
                            }
                          </span>
                          <button
                            title="Drag to reorder"
                            onMouseDown={(e) => {
                              e.stopPropagation();
                              handleLeftPanelDragStart(item.id, e);
                            }}
                            onTouchStart={(e) => {
                              e.stopPropagation();
                              handleLeftPanelDragStart(item.id, e);
                            }}
                            className="text-gray-400 hover:text-gray-600 p-1 cursor-grab hover:bg-gray-100 rounded"
                          >
                            <GripVertical className="w-3 h-3" />
                          </button>
                          <button
                            title="Remove character"
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
            <div className="px-2 py-2 border-b border-gray-200 bg-gray-100">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-semibold">Character Library</h2>
                <div className="relative">
                  <Search className="absolute left-2 top-2 w-3 h-3 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search..."
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
                onClick={() => setSelectedCategory(CharacterType.GENERIC)}
                className={`flex-1 px-1 py-2 text-xs text-center border-r border-gray-200 ${selectedCategory === CharacterType.GENERIC
                  ? 'text-blue-600 border-b-2 border-b-blue-600 -mb-px bg-blue-50'
                  : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50'
                  }`}
              >
                Generic
              </button>
              <button
                onClick={() => setSelectedCategory(CharacterType.CELEBRITY)}
                className={`flex-1 px-1 py-2 text-xs text-center border-r border-gray-200 ${selectedCategory === CharacterType.CELEBRITY
                  ? 'text-blue-600 border-b-2 border-b-blue-600 -mb-px bg-blue-50'
                  : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50'
                  }`}
              >
                Celebrity
              </button>
              <button
                onClick={() => setSelectedCategory(CharacterType.OBJECT)}
                className={`flex-1 px-1 py-2 text-xs text-center border-r border-gray-200 ${selectedCategory === CharacterType.OBJECT
                  ? 'text-blue-600 border-b-2 border-b-blue-600 -mb-px bg-blue-50'
                  : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50'
                  }`}
              >
                Object
              </button>
              <button
                onClick={() => setSelectedCategory(CharacterType.BIOLOGY)}
                className={`flex-1 px-1 py-2 text-xs text-center border-r border-gray-200 ${selectedCategory === CharacterType.BIOLOGY
                  ? 'text-blue-600 border-b-2 border-b-blue-600 -mb-px bg-blue-50'
                  : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50'
                  }`}
              >
                Biology
              </button>
              <button
                onClick={() => setSelectedCategory(CharacterType.UPLOAD)}
                className={`flex-1 px-1 py-2 text-xs text-center ${selectedCategory === CharacterType.UPLOAD
                  ? 'text-blue-600 border-b-2 border-b-blue-600 -mb-px bg-blue-50'
                  : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50'
                  }`}
              >
                Upload
              </button>
            </div>

            {/* 角色网格 */}
            <div className="flex-1 overflow-y-auto p-4 thin-scrollbar relative">
              <div className="absolute inset-4">
                {selectedCategory === CharacterType.UPLOAD ? (
                  < div className="flex flex-col items-center justify-center h-full">
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center w-full max-w-sm">
                      <div className="text-4xl mb-4">📷</div>
                      <h3 className="text-lg font-medium text-gray-900 mb-2">Upload Image</h3>
                      <p className="text-sm text-gray-500 mb-4">
                        Supports JPG, PNG, GIF formats<br />
                        Crop after upload
                      </p>
                      <button
                        className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-colors"
                        onClick={() => setShowImageUploadModal(true)}
                      >
                        Select Image
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* 加载状态 */}
                    {isLoadingCharacters && (
                      <div className="flex flex-col items-center justify-center h-full">
                        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                        <p className="text-gray-500 text-sm">Loading characters...</p>
                      </div>
                    )}

                    {/* 错误状态 */}
                    {charactersError && !isLoadingCharacters && (
                      <div className="flex flex-col items-center justify-center h-full">
                        <div className="text-red-500 text-4xl mb-4">⚠️</div>
                        <p className="text-red-600 text-sm text-center mb-4">{charactersError}</p>
                        <button
                          onClick={loadCharacters}
                          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors text-sm"
                        >
                          Retry
                        </button>
                      </div>
                    )}

                    {/* 角色网格 */}
                    {!isLoadingCharacters && !charactersError && (
                      <div className="grid grid-cols-3 gap-2">
                        {characters.length === 0 ? (
                          <div className="col-span-3 flex flex-col items-center justify-center py-8">
                            <div className="text-gray-400 text-4xl mb-4">🔍</div>
                            <p className="text-gray-500 text-sm text-center">
                              {searchTerm ? `No characters found for "${searchTerm}"` : 'No characters available'}
                            </p>
                          </div>
                        ) : (
                          characters.map(character => (
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
                                {character.thumbnailUrl ? (
                                  <img
                                    src={character.thumbnailUrl}
                                    alt={character.name}
                                    className="w-full h-full object-contain hover:scale-105 transition-transform duration-200"
                                  />
                                ) : (
                                  // fallback 到表情符号图标
                                  <div
                                    className={`w-12 h-16 rounded flex items-center justify-center text-white text-sm font-bold hover:ring-2 hover:ring-gray-300 hover:ring-offset-1`}
                                    style={{
                                      backgroundColor: character.color || 'transparent'
                                    }}
                                  >
                                    {character.type === CharacterType.GENERIC ? '👤' :
                                      character.type === CharacterType.CELEBRITY ? '⭐' :
                                        character.type === CharacterType.OBJECT ? '🏢' :
                                          character.type === CharacterType.BIOLOGY ? '🐾' :
                                            character.type === CharacterType.UPLOAD ? '📷' : '○'}
                                  </div>
                                )}
                              </div>

                              {/* 悬浮提示 */}
                              <div className={`absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 
                        w-full max-h-full break-words overflow-hidden whitespace-normal flex flex-col justify-center items-center bg-white/80 text-gray-800 
                        opacity-0 text-xs rounded-lg group-hover:opacity-100 z-10 backdrop-blur-sm border 
                        border-gray-200/50 shadow-lg transition-all duration-200 ease-out group-hover:scale-105 
                        `}>
                                <div className="font-medium text-gray-900 text-center">{character.name}</div>
                                <div className="text-gray-600 text-[11px] text-center">
                                  {convertHeightSmart(character.height, true)} / {convertHeightSmartImperial(character.height)}
                                </div>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </>)}
              </div>
            </div>
          </div>
        </div >

        {/* 中间图表区域 */}
        < div className={`flex flex-col h-full transition-all duration-300 w-4/5`
        }>
          <div id="top-ads" className="w-full h-[120px] m-0 py-[10px]"></div>
          <div className='flex-1 flex w-full'>
            <div className={`flex-1 flex flex-col ${showRightPanel && selectedCharacter ? 'w-[calc(100%-300px)]' : 'w-full'} relative`}>
              {/* 工具栏 */}
              <div className="px-4 pt-4 pb-6 bg-white border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <h1 className="text-lg font-bold">Height Comparison</h1>
                    <div className="text-sm text-gray-600">
                      {comparisonItems.length} {comparisonItems.length === 1 ? 'object' : 'objects'}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1">
                      <button
                        onClick={() => setUnit(unit === Unit.CM ? Unit.FT_IN : Unit.CM)}
                        className="flex items-center gap-1.5 px-2 py-1 bg-gray-100 rounded hover:bg-gray-200 text-sm font-medium"
                        title={`Switch to ${unit === Unit.CM ? 'feet' : 'centimeters'}`}
                      >
                        <span className={unit === Unit.CM ? 'text-blue-600' : 'text-gray-500'}>cm</span>
                        <ArrowLeftRight className="w-3.5 h-3.5 text-gray-400" />
                        <span className={unit === Unit.FT_IN ? 'text-blue-600' : 'text-gray-500'}>ft</span>
                      </button>
                    </div>
                    <button
                      onClick={resetZoom}
                      className={`p-2 rounded transition-colors ${pixelsPerMState === 1
                        ? 'bg-gray-50 text-gray-400 cursor-not-allowed'
                        : 'bg-gray-100 text-gray-600 hover:bg-blue-100 hover:text-blue-600'
                        }`}
                      title="Reset zoom"
                      disabled={pixelsPerMState === 1}
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        console.log('Clear button clicked, current character count:', comparisonItems.length);
                        clearAllCharacters();
                      }}
                      className={`p-2 rounded transition-colors ${comparisonItems.length === 0
                        ? 'bg-gray-50 text-gray-400 cursor-not-allowed'
                        : 'bg-gray-100 text-gray-600 hover:bg-blue-100 hover:text-blue-600'
                        }`}
                      title="Clear all characters"
                      disabled={comparisonItems.length === 0}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <div className="w-px h-6 bg-gray-300"></div>
                    <button
                      onClick={() => setStyleSettings({ ...styleSettings, gridLines: !styleSettings.gridLines })}
                      className={`p-2 rounded ${styleSettings.gridLines ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'}`}
                      title="Grid lines"
                    >
                      <Grid className="w-4 h-4" />
                    </button>

                    {/* 导出按钮 - 带下拉菜单 */}
                    <div className="relative" ref={exportButtonRef}>
                      <button
                        onClick={handleExportClick}
                        className={`p-2 rounded transition-colors ${comparisonItems.length === 0
                          ? 'bg-gray-50 text-gray-400 cursor-not-allowed'
                          : showExportDropdown
                            ? 'bg-blue-100 text-blue-600'
                            : 'bg-gray-100 text-gray-600 hover:bg-blue-100 hover:text-blue-600'
                          }`}
                        title={comparisonItems.length === 0 ? 'Please add characters first' : 'Export image'}
                        disabled={comparisonItems.length === 0 || isExporting}
                      >
                        {isExporting ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                        ) : (
                          <Download className="w-4 h-4" />
                        )}
                      </button>

                      {/* 导出格式下拉菜单 */}
                      {showExportDropdown && (
                        <div className="absolute top-full right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-[1003]">
                          <div className="py-1">
                            <button
                              onClick={() => exportChart('png')}
                              disabled={isExporting}
                              className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                              title='High quality, transparent background'
                            >
                              <span className="mr-3">🖼️</span>
                              <div className="font-medium">PNG</div>
                            </button>
                            <button
                              onClick={() => exportChart('jpg')}
                              disabled={isExporting}
                              className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                              title='Smaller file size, easy to share'
                            >
                              <span className="mr-3">📷</span>
                              <div className="font-medium">JPG</div>
                            </button>
                            <button
                              onClick={() => exportChart('webp')}
                              disabled={isExporting}
                              className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                              title='Modern format, high compression'
                            >
                              <span className="mr-3">🌐</span>
                              <div className="font-medium">WebP</div>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                    {/* 分享按钮和下拉菜单 */}
                    <div className="relative" ref={shareButtonRef}>
                      <button
                        onClick={handleShareClick}
                        disabled={comparisonItems.length === 0 || isSharing}
                        className="p-2 rounded bg-gray-100 text-gray-600 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Share comparison"
                        onMouseEnter={() => setShowShareDropdown(true)}
                      >
                        {isSharing ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                        ) : (
                          <Share2 className="w-4 h-4" />
                        )}
                      </button>

                      {/* 分享下拉菜单 */}
                      {showShareDropdown && (
                        <div className="absolute top-full right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-[9999] min-w-[200px]">
                          <div className="py-2">
                            {/* 社交媒体平台 */}
                            <div className="px-3 py-1 text-xs font-medium text-gray-500 uppercase tracking-wide">Social Media</div>
                            {socialPlatforms.map((platform) => (
                              <button
                                key={platform.name}
                                onClick={() => handleSocialShare(platform)}
                                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 flex items-center"
                                title={`Share on ${platform.name}`}
                              >
                                <span className="mr-3 text-base" style={{ color: platform.color }}>{platform.icon}</span>
                                <div className="font-medium">{platform.name}</div>
                              </button>
                            ))}

                            <div className="border-t border-gray-100 my-2"></div>

                            {/* 其他分享选项 */}
                            <div className="px-3 py-1 text-xs font-medium text-gray-500 uppercase tracking-wide">Other Options</div>

                            {/* 原生分享 API (如果支持) */}
                            {navigator.share && (
                              <button
                                onClick={() => handleSocialShare({ name: 'Native', icon: '📱', color: '#666', shareUrl: () => '' })}
                                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 flex items-center"
                                title="Use native sharing"
                              >
                                <span className="mr-3">📱</span>
                                <div className="font-medium">Share...</div>
                              </button>
                            )}

                            <button
                              onClick={handleCopyLink}
                              className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 flex items-center"
                              title="Copy share text to clipboard"
                            >
                              <span className="mr-3">📎</span>
                              <div className="font-medium">Copy Link</div>
                            </button>

                            <button
                              onClick={handleDownloadShareImage}
                              className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 flex items-center"
                              title="Download comparison image"
                            >
                              <span className="mr-3">🖼️</span>
                              <div className="font-medium">Download Image</div>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* 中间角色对比展示图表区 */}
              <div className="w-full flex-1 p-4 thin-scrollbar relative" style={{ backgroundColor: styleSettings.backgroundColor, height: `calc(100% - 16px)` }}>
                <div ref={chartAreaRef} className="relative px-20 w-full h-full flex items-end justify-center">
                  {/* 图表标题 - 可编辑 */}
                  <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 z-[1001] cursor-text">
                    {isEditingTitle ? (
                      <input
                        ref={titleInputRef}
                        type="text"
                        value={chartTitle}
                        onChange={(e) => setChartTitle(e.target.value)}
                        onBlur={() => setIsEditingTitle(false)}
                        onKeyDown={handleTitleKeyDown}
                        className="text-lg font-medium text-gray-800 bg-white/90 border border-gray-300 rounded px-3 py-1 text-center min-w-[300px] max-w-[50vw] focus:outline-none focus:ring-1 focus:ring-gray-300 focus:border-transparent shadow-sm"
                        placeholder="Enter chart title"
                      />
                    ) : (
                      <h2
                        onClick={() => setIsEditingTitle(true)}
                        className="text-lg font-medium text-gray-800 bg-white/80 backdrop-blur-sm rounded px-3 py-1 hover:bg-white/90 transition-colors shadow-sm border border-transparent hover:border-gray-200 max-w-[50vw] break-words text-center"
                        title="Click to edit title"
                      >
                        {chartTitle}
                      </h2>
                    )}
                  </div>

                  {/* 缩放控件 */}
                  <div id="zoom-controlls" className="absolute -top-2 right-[5rem] z-[1002] flex flex-col gap-1">
                    <div className="relative group">
                      <button
                        onClick={() => handleZoom(0.2)}
                        className="p-2 rounded bg-white/80 hover:bg-white text-gray-600 hover:text-blue-600 shadow-sm hover:shadow-md transition-all"
                      >
                        <ZoomIn className="w-4 h-4" />
                      </button>
                      {/* 自定义tooltip */}
                      <div className="absolute left-1/2 transform -translate-x-1/2 -translate-y-full top-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-[1003]">
                        <div className="bg-white text-gray-700 text-xs rounded py-1 px-2 whitespace-nowrap">
                          Zoom in (hold Ctrl + scroll for quick zoom)
                        </div>
                      </div>
                    </div>
                    <div className="relative group">
                      <button
                        onClick={() => handleZoom(-0.2)}
                        className="p-2 rounded bg-white/80 hover:bg-white text-gray-600 hover:text-blue-600 shadow-sm hover:shadow-md transition-all"
                      >
                        <ZoomOut className="w-4 h-4" />
                      </button>
                      {/* 自定义tooltip */}
                      <div className="absolute left-1/2 transform -translate-x-1/2 translate-y-full bottom-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-[1003]">
                        <div className="bg-white text-gray-700 text-xs rounded py-1 px-2 whitespace-nowrap">
                          Zoom out (hold Ctrl + scroll for quick zoom)
                          <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-2 border-r-2 border-t-4 border-transparent border-t-gray-800"></div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 缩放指示器 - 显示在图表中心 */}
                  {zoomIndicator.show && (
                    <div className={`absolute inset-0 flex items-center justify-center pointer-events-none z-[1004] transition-opacity duration-200 ${zoomIndicator.exiting ? 'opacity-0' : 'opacity-100'
                      }`}>
                      <div className="bg-white/80 text-gray-700 rounded-full p-2 shadow-lg border border-gray-200">
                        {zoomIndicator.type === 'in' ? (
                          <ZoomIn className="w-6 h-6" />
                        ) : (
                          <ZoomOut className="w-6 h-6" />
                        )}
                      </div>
                    </div>
                  )}

                  {/* 网格线 */}
                  {styleSettings.gridLines && (() => {
                    // 计算最大高度用于确定统一的单位制
                    const maxHeightInComparison = getMaxHeightInComparison(comparisonItems);
                    const unifiedMetricUnit = getBestUnit(maxHeightInComparison, true);

                    return (
                      <div className="absolute inset-0 pointer-events-none">
                        {/* 动态单位标签 */}
                        <div className="absolute top-0 left-0 w-full">
                          <span className="absolute left-2 -top-9 text-sm font-bold text-gray-700">
                            Metric ({unifiedMetricUnit})
                          </span>
                          <span className="absolute right-2 -top-9 text-sm font-bold text-gray-700">
                            Imperial ({getImperialGridUnitLabel(maxHeightInComparison)})
                          </span>
                        </div>

                        {Array.from({ length: 21 }, (_, i) => {
                          const heightPercentage = i / 20;
                          const pixHeight = chartAreaHeightPix * heightPercentage;

                          // 使用高精度计算
                          const pixHeightPrecision = Precision.from(pixHeight);
                          const pixelsPerMPrecision = Precision.from(pixelsPerM);
                          const mHeight = pixHeightPrecision.divide(pixelsPerMPrecision).toNumber();

                          // 使用统一的单位制进行转换
                          const metricResult = convertHeightPrecision(mHeight, unifiedMetricUnit);
                          const imperialDisplay = convertHeightForGridImperial(mHeight, maxHeightInComparison);

                          return (
                            <div
                              key={i}
                              className="absolute left-0 w-full border-t border-gray-300"
                              style={{ bottom: `${heightPercentage * 100}%` }}
                            >
                              {styleSettings.labels && (
                                <>
                                  <span className="absolute left-2 top-0 -translate-y-1/2 text-xs text-gray-600">
                                    {metricResult.formatted}
                                  </span>
                                  <span className="absolute right-2 top-0 -translate-y-1/2 text-xs text-gray-600">
                                    {imperialDisplay}
                                  </span>
                                </>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    );
                  })()}

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
                          <p className="text-lg">Add characters from the left panel to compare</p>
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
                                  pixelsPerM={pixelsPerM}
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
                      <div id='characters-container-scrollbar' className="absolute bottom-[-7px] left-0 h-[6px] bg-gray-100 rounded-full mx-2 mt-2">
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
            {/* 右侧编辑面板 - 固定在最右侧 */}
            {showRightPanel && selectedCharacter && (
              <div ref={rightPanelRef} className={`w-[300px] bg-white shadow-xl z-[1003] overflow-y-auto border-l border-gray-200 thin-scrollbar transition-transform duration-300`}>
                <div className="px-4 py-2 border-b border-gray-200 bg-gray-50">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">Character Details</h3>
                    <button
                      onClick={() => {
                        setShowRightPanel(false)
                        setSelectedCharacter(null)
                        setSelectedComparisonItemId(null)
                        setComparisonItems(prev => prev.map(item => ({ ...item, selected: false })))
                      }}
                      className="text-gray-500 hover:text-gray-700 w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100"
                    >
                      <span className="text-xl">×</span>
                    </button>
                  </div>
                </div>

                <div className="p-4 space-y-4">
                  <div>
                    <label htmlFor="character-name" className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                    <input
                      id="character-name"
                      type="text"
                      value={selectedCharacter.name}
                      onChange={(e) => updateCharacter('name', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter character name"
                    />
                  </div>

                  <div>
                    <label htmlFor="character-height" className="block text-sm font-medium text-gray-700 mb-1">Height</label>
                    <div className="flex gap-2">
                      <input
                        id="character-height"
                        type="number"
                        value={selectedCharacter.height}
                        onChange={(e) => updateCharacter('height', Number(e.target.value))}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        min="0.3"
                        max="3"
                        step="0.01"
                        placeholder="Enter height"
                      />
                      <span className="px-3 py-2 bg-gray-100 rounded-md text-sm">m</span>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {unit === Unit.CM ? convertHeightSmart(selectedCharacter.height, true) : convertHeightSmartImperial(selectedCharacter.height)}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Color</label>
                    <div className="flex gap-2 flex-wrap">
                      {['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#6B7280'].map(color => (
                        <button
                          key={color}
                          onClick={() => updateCharacter('color', color)}
                          className={`w-8 h-8 rounded-full border-2 ${selectedCharacter.color === color ? 'border-gray-800' : 'border-gray-300'}`}
                          style={{ backgroundColor: color }}
                          title={`Select color: ${color}`}
                        />
                      ))}
                    </div>
                  </div>

                </div>
              </div>
            )}
          </div>

        </div >

        {/* Fixed拖拽元素 */}
        {
          dragState.isDragging && dragState.draggedItemId && dragState.draggedElement && (
            <div
              style={{
                position: 'fixed',
                left: dragState.fixedElementX + (dragState.currentMouseX - dragState.startMouseX),
                top: dragState.fixedElementY + (dragState.currentMouseY - dragState.startMouseY),
                zIndex: 1000,
                pointerEvents: 'none',
                opacity: 0.8,
                filter: 'brightness(0.9)',
                boxShadow: '0 8px 25px rgba(0,0,0,0.15)',
                transform: 'scale(1.02)',
              }}
            >
              {(() => {
                const draggedItem = comparisonItems.find(item => item.id === dragState.draggedItemId);
                if (!draggedItem) return null;

                return (
                  <div className="flex flex-col items-center px-3">
                    <CharacterDisplay
                      character={draggedItem.character}
                      pixelsPerM={pixelsPerM}
                      isSelected={false}
                      unit={unit}
                      isDragging={true}
                      onEdit={() => { }}
                      onMove={() => { }}
                      onDelete={() => { }}
                    />
                  </div>
                );
              })()}
            </div>
          )
        }

        {/* 左侧角色列表Fixed拖拽元素 */}
        {
          leftPanelDragState.isDragging && leftPanelDragState.draggedItemId && leftPanelDragState.draggedElement && (
            <div
              style={{
                position: 'fixed',
                left: leftPanelDragState.fixedElementX + (leftPanelDragState.currentMouseX - leftPanelDragState.startMouseX),
                top: leftPanelDragState.fixedElementY + (leftPanelDragState.currentMouseY - leftPanelDragState.startMouseY),
                zIndex: 1001,
                pointerEvents: 'none',
                opacity: 0.9,
                filter: 'brightness(0.95)',
                boxShadow: '0 8px 25px rgba(0,0,0,0.15)',
                transform: 'scale(1.02)',
                width: leftPanelDragState.draggedElement.offsetWidth,
              }}
            >
              {(() => {
                const draggedItem = comparisonItems.find(item => item.id === leftPanelDragState.draggedItemId);
                if (!draggedItem) return null;

                return (
                  <div className="flex items-center justify-between p-2 text-sm border-l-4 border-blue-500 bg-blue-50 rounded">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{draggedItem.character.name}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-gray-600">
                        {convertHeight(draggedItem.character.height, unit)}
                      </span>
                      <button className="text-gray-400 p-1 cursor-grab">
                        <GripVertical className="w-3 h-3" />
                      </button>
                      <button className="text-red-500 p-1">
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                );
              })()}
            </div>
          )
        }

        {/* 导出格式选择弹窗已移除，改为下拉菜单 */}

        {/* 图片上传弹窗 */}
        <ImageUploadModal
          isOpen={showImageUploadModal}
          onClose={() => setShowImageUploadModal(false)}
          onSave={handleImageUpload}
        />
      </div >
    </>
  );
};

export { HeightCompareTool };

