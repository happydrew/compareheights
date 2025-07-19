export { 
  CharacterType, 
  type Character, 
  type CharacterMedia,
  type CharacterAppearance,
  Unit, 
  convertHeight, 
  convertHeightSmart, 
  convertHeightSmartImperial, 
  getBestUnit, 
  UnitSystem, 
  UNIT_CONVERSIONS,
  CharacterImageRenderer,
  InlineSVGRenderer,
  imageCache,
  useCharacterDimensions
};

import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import {
  Trash2, Search, Users, Share2, Download,
  Grid, Eye, EyeOff, ArrowLeftRight, RotateCcw, ZoomIn, ZoomOut, GripVertical
} from 'lucide-react';
import { CharacterDisplay } from './CharacterDisplay';
import { ImageUploadModal } from './ImageUploadModal';
import 'simplebar-react/dist/simplebar.min.css';

// 高精度数值处理类
// 注意：当前实现使用JavaScript的number类型，在极端尺寸跨度下可能有精度限制
// 测试范围：夸克(10^-13 cm) 到 宇宙(10^28 cm)，跨度约10^41
// JavaScript Number 精度：约15-17位有效数字，最大安全整数2^53-1
// 对于超过精度范围的极端计算，可能需要考虑使用decimal.js或big.js库
class Precision {
  private value: number;
  private precision: number;

  constructor(value: number | string, precision: number = 15) {
    this.value = typeof value === 'string' ? parseFloat(value) : value;
    this.precision = precision;
  }

  static from(value: number | string, precision?: number): Precision {
    return new Precision(value, precision);
  }

  multiply(other: number | Precision): Precision {
    const otherValue = other instanceof Precision ? other.value : other;
    return new Precision(this.value * otherValue, this.precision);
  }

  divide(other: number | Precision): Precision {
    const otherValue = other instanceof Precision ? other.value : other;
    return new Precision(this.value / otherValue, this.precision);
  }

  add(other: number | Precision): Precision {
    const otherValue = other instanceof Precision ? other.value : other;
    return new Precision(this.value + otherValue, this.precision);
  }

  subtract(other: number | Precision): Precision {
    const otherValue = other instanceof Precision ? other.value : other;
    return new Precision(this.value - otherValue, this.precision);
  }

  toNumber(): number {
    return this.value;
  }

  toString(decimals?: number): string {
    if (decimals !== undefined) {
      return this.value.toFixed(decimals);
    }
    return this.value.toString();
  }

  toExponential(decimals?: number): string {
    return this.value.toExponential(decimals);
  }
}

// 单位制枚举
enum UnitSystem {
  // 公制单位
  NANOMETER = 'nm',
  MICROMETER = 'μm',
  MILLIMETER = 'mm',
  CENTIMETER = 'cm',
  METER = 'm',
  KILOMETER = 'km',
  // 英制单位
  INCH = 'in',
  FOOT = 'ft',
  MILE = 'mi'
}

// 单位转换系数（基于米）
const UNIT_CONVERSIONS = {
  [UnitSystem.NANOMETER]: 1000000000,  // 1m = 10^9 nm
  [UnitSystem.MICROMETER]: 1000000,    // 1m = 10^6 μm
  [UnitSystem.MILLIMETER]: 1000,       // 1m = 1000 mm
  [UnitSystem.CENTIMETER]: 100,        // 1m = 100 cm
  [UnitSystem.METER]: 1,               // 1m = 1 m
  [UnitSystem.KILOMETER]: 0.001,       // 1m = 0.001 km
  [UnitSystem.INCH]: 39.3701,          // 1m = 39.3701 in
  [UnitSystem.FOOT]: 3.28084,          // 1m = 3.28084 ft
  [UnitSystem.MILE]: 0.000621371       // 1m = 0.000621371 mi
};

// 动态选择最适合的单位制 - 优化版，避免科学计数法
function getBestUnit(heightInM: number, preferMetric: boolean = true): UnitSystem {
  const absHeight = Math.abs(heightInM);

  if (preferMetric) {
    // 先尝试转换到各个单位，检查是否会产生科学计数法
    const nmValue = absHeight * UNIT_CONVERSIONS[UnitSystem.NANOMETER];
    const umValue = absHeight * UNIT_CONVERSIONS[UnitSystem.MICROMETER];
    const mmValue = absHeight * UNIT_CONVERSIONS[UnitSystem.MILLIMETER];
    const cmValue = absHeight * UNIT_CONVERSIONS[UnitSystem.CENTIMETER];
    const mValue = absHeight * UNIT_CONVERSIONS[UnitSystem.METER];
    const kmValue = absHeight * UNIT_CONVERSIONS[UnitSystem.KILOMETER];

    // 从小到大检查，优先选择不需要科学计数法的最合适单位
    if (absHeight < 0.00001) {
      // 纳米级别
      if (nmValue >= 1 && nmValue < 1000) return UnitSystem.NANOMETER;
      if (umValue >= 0.001 && umValue < 1000) return UnitSystem.MICROMETER;
      if (mmValue >= 0.001 && mmValue < 1000) return UnitSystem.MILLIMETER;
      return UnitSystem.NANOMETER; // 回退到纳米
    }

    if (absHeight < 0.01) {
      // 微米级别  
      if (umValue >= 1 && umValue < 1000) return UnitSystem.MICROMETER;
      if (mmValue >= 0.001 && mmValue < 1000) return UnitSystem.MILLIMETER;
      if (cmValue >= 0.001 && cmValue < 1000) return UnitSystem.CENTIMETER;
      return UnitSystem.MICROMETER; // 回退到微米
    }

    if (absHeight < 0.1) {
      // 毫米级别
      if (mmValue >= 1 && mmValue < 1000) return UnitSystem.MILLIMETER;
      if (cmValue >= 0.001 && cmValue < 1000) return UnitSystem.CENTIMETER;
      if (mValue >= 0.001 && mValue < 1000) return UnitSystem.METER;
      return UnitSystem.MILLIMETER; // 回退到毫米
    }

    if (absHeight < 10) {
      // 厘米级别
      if (cmValue >= 1 && cmValue < 1000) return UnitSystem.CENTIMETER;
      if (mValue >= 0.001 && mValue < 1000) return UnitSystem.METER;
      if (kmValue >= 0.001 && kmValue < 1000) return UnitSystem.KILOMETER;
      return UnitSystem.CENTIMETER; // 回退到厘米
    }

    if (absHeight < 1000) {
      // 米级别
      if (mValue >= 1 && mValue < 1000) return UnitSystem.METER;
      if (kmValue >= 0.001 && kmValue < 1000) return UnitSystem.KILOMETER;
      return UnitSystem.METER; // 回退到米
    }

    // 千米级别
    return UnitSystem.KILOMETER;

  } else {
    // 英制单位逻辑（原来基于厘米，现在基于米）
    if (absHeight < 0.0254) return UnitSystem.INCH;
    if (absHeight < 304.8) return UnitSystem.FOOT;
    return UnitSystem.MILE;
  }
}

// 格式化科学计数法为上标形式
function formatScientificNotation(value: number, decimals: number = 2): string {
  const exp = value.toExponential(decimals);
  const parts = exp.split('e');
  if (parts.length !== 2) return exp;

  const mantissa = parts[0];
  let exponent = parseInt(parts[1]);

  // 上标数字映射
  const superscriptMap: { [key: string]: string } = {
    '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴',
    '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹',
    '-': '⁻', '+': '⁺'
  };

  // 转换指数为上标
  const expStr = exponent.toString();
  const superscriptExp = expStr.split('').map(char => superscriptMap[char] || char).join('');

  return `${mantissa}×10${superscriptExp}`;
}

// 格式化数值显示 - 新的全局规则
function formatNumber(value: number, maxLength: number = 8): string {
  // 科学计数法规则：整数部分超过3位(≥1000)或小于0.001时使用科学计数法，4位有效数字
  if (Math.abs(value) >= 1000 || (Math.abs(value) < 0.001 && value !== 0)) {
    return formatScientificNotation(value, 3); // 3位小数确保4位有效数字
  }

  // 常规显示：保持最多4位有效数字
  const str = value.toString();
  if (str.length > maxLength) {
    // 计算需要的小数位数以保持4位有效数字
    const integerDigits = Math.floor(Math.log10(Math.abs(value))) + 1;
    const decimals = Math.max(0, 4 - integerDigits);
    return value.toFixed(decimals);
  }

  return str;
}

// 高精度转换高度
function convertHeightPrecision(heightInM: number, targetUnit: UnitSystem): { value: number, formatted: string } {
  const conversion = UNIT_CONVERSIONS[targetUnit];
  const precision = Precision.from(heightInM);
  const converted = precision.multiply(conversion);
  const value = converted.toNumber();

  return {
    value,
    formatted: formatNumber(value)
  };
}


// 单位制枚举
enum Unit {
  CM = 'cm',
  FT_IN = 'ft-in'
}

// 角色类型枚举
enum CharacterType {
  GENERIC = 'generic',    // 通用角色（通用的男女、无性别者）
  CELEBRITY = 'celebrity', // 名人（现实人物、动漫角色、书中虚构人物、神话虚构人物等）
  OBJECT = 'object',      // 物体（建筑物、山、地球、太阳等自然物体）
  BIOLOGY = 'biology',    // 生物（动物、植物、微生物、病毒等）
  UPLOAD = 'upload'       // 上传图片
}

// 角色媒体信息接口
interface CharacterMedia {
  type: 'svg' | 'image'; // 媒体类型
  url: string; // 主要图片/SVG的URL
  thumbnailUrl: string; // 缩略图URL（用于角色库展示）
  svgContent?: string; // SVG内容（仅当type为svg时）
  originalWidth?: number; // 原始图片宽度
  originalHeight?: number; // 原始图片高度
}

// 角色外观信息接口
interface CharacterAppearance {
  color: string; // 默认颜色
  colorCustomizable: boolean; // 是否支持自定义颜色
  colorProperty?: string; // SVG中需要修改颜色的属性名（如'fill', 'stroke'）
}

// 角色接口
interface Character {
  id: string;
  name: string;
  height: number; // 以m为单位
  width: number; // 以m为单位
  type: CharacterType;
  
  // 媒体相关
  media: CharacterMedia;
  
  // 外观相关
  appearance: CharacterAppearance;
  
  isCustom: boolean;
  description?: string;
  isUploadedImage?: boolean; // 是否为用户上传的图片
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

// 图片缓存管理器
class ImageCacheManager {
  private cache = new Map<string, HTMLImageElement>();
  private loadingPromises = new Map<string, Promise<HTMLImageElement>>();

  async preloadImage(url: string): Promise<HTMLImageElement> {
    if (this.cache.has(url)) {
      return this.cache.get(url)!;
    }

    if (this.loadingPromises.has(url)) {
      return this.loadingPromises.get(url)!;
    }

    const promise = new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        this.cache.set(url, img);
        this.loadingPromises.delete(url);
        resolve(img);
      };
      img.onerror = () => {
        this.loadingPromises.delete(url);
        reject(new Error(`Failed to load image: ${url}`));
      };
      img.src = url;
    });

    this.loadingPromises.set(url, promise);
    return promise;
  }

  getCachedImage(url: string): HTMLImageElement | null {
    return this.cache.get(url) || null;
  }

  async preloadCharacterImages(characters: Character[]) {
    const promises = characters.map(char => {
      if (char.media.type === 'image') {
        return Promise.all([
          this.preloadImage(char.media.url),
          this.preloadImage(char.media.thumbnailUrl)
        ]);
      }
      return Promise.resolve();
    });
    
    await Promise.allSettled(promises);
  }

  clearCache() {
    this.cache.clear();
    this.loadingPromises.clear();
  }
}

// 全局图片缓存实例
const imageCache = new ImageCacheManager();

// SVG颜色处理函数
const processSVGColor = (svgContent: string, color?: string, colorProperty: string = 'fill'): string => {
  if (!color) return svgContent;
  
  // 根据颜色属性类型进行替换
  const regex = new RegExp(`${colorProperty}="[^"]*"`, 'g');
  return svgContent.replace(regex, `${colorProperty}="${color}"`);
};

// SVG内联渲染组件
const InlineSVGRenderer: React.FC<{
  svgContent: string;
  color?: string;
  colorProperty?: string;
  className?: string;
  style?: React.CSSProperties;
}> = ({ svgContent, color, colorProperty = 'fill', className = '', style }) => {
  const processedSVG = useMemo(() => {
    return processSVGColor(svgContent, color, colorProperty);
  }, [svgContent, color, colorProperty]);

  return (
    <div 
      className={className}
      style={style}
      dangerouslySetInnerHTML={{ __html: processedSVG }}
    />
  );
};

// 角色尺寸计算Hook
const useCharacterDimensions = (
  character: Character,
  containerWidth: number,
  containerHeight: number
) => {
  return useMemo(() => {
    const characterAspectRatio = character.width / character.height;
    const containerAspectRatio = containerWidth / containerHeight;
    
    let imageWidth: number;
    let imageHeight: number;
    let offsetX: number = 0;
    let offsetY: number = 0;
    
    if (characterAspectRatio > containerAspectRatio) {
      // 角色更宽，以容器宽度为准，垂直居中
      imageWidth = containerWidth;
      imageHeight = containerWidth / characterAspectRatio;
      offsetY = (containerHeight - imageHeight) / 2;
    } else {
      // 角色更高或等比，以容器高度为准，水平居中
      imageHeight = containerHeight;
      imageWidth = containerHeight * characterAspectRatio;
      offsetX = (containerWidth - imageWidth) / 2;
    }
    
    return {
      imageWidth,
      imageHeight,
      offsetX,
      offsetY,
      scale: imageHeight / containerHeight
    };
  }, [character.width, character.height, containerWidth, containerHeight]);
};

// 角色图片渲染组件
const CharacterImageRenderer: React.FC<{
  character: Character;
  containerWidth: number;
  containerHeight: number;
  customColor?: string;
  className?: string;
  onLoad?: () => void;
  onError?: () => void;
}> = ({ 
  character, 
  containerWidth, 
  containerHeight, 
  customColor, 
  className = '', 
  onLoad, 
  onError 
}) => {
  const dimensions = useCharacterDimensions(character, containerWidth, containerHeight);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  
  const finalColor = customColor || character.appearance.color;
  
  useEffect(() => {
    if (character.media.type === 'image') {
      setIsLoading(true);
      setHasError(false);
      
      imageCache.preloadImage(character.media.url)
        .then(() => {
          setIsLoading(false);
          onLoad?.();
        })
        .catch(() => {
          setIsLoading(false);
          setHasError(true);
          onError?.();
        });
    } else {
      setIsLoading(false);
      onLoad?.();
    }
  }, [character.media.url, character.media.type, onLoad, onError]);
  
  return (
    <div 
      className={`relative ${className}`}
      style={{
        width: `${containerWidth}px`,
        height: `${containerHeight}px`,
      }}
    >
      {/* 加载状态 */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded">
          <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}
      
      {/* 错误状态 */}
      {hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded">
          <div className="text-gray-500 text-xs text-center p-2">
            加载失败<br/>
            {character.name}
          </div>
        </div>
      )}
      
      {/* 图片内容 */}
      {!isLoading && !hasError && (
        <div
          style={{
            position: 'absolute',
            left: `${dimensions.offsetX}px`,
            top: `${dimensions.offsetY}px`,
            width: `${dimensions.imageWidth}px`,
            height: `${dimensions.imageHeight}px`,
          }}
        >
          {character.media.type === 'svg' ? (
            <InlineSVGRenderer 
              svgContent={character.media.svgContent || ''}
              color={character.appearance.colorCustomizable ? finalColor : undefined}
              colorProperty={character.appearance.colorProperty}
              className="w-full h-full"
            />
          ) : (
            <img
              src={character.media.url}
              alt={character.name}
              className="w-full h-full object-fill"
              style={{ objectPosition: 'center' }}
            />
          )}
        </div>
      )}
    </div>
  );
};

// 预设角色数据（基于米） - 使用新的数据结构
const PRESET_CHARACTERS: Character[] = [
  // 通用角色 - 男性 (SVG)
  {
    id: 'generic-male-1',
    name: '男性1',
    height: 1.75,
    width: 0.5,
    type: CharacterType.GENERIC,
    media: {
      type: 'svg',
      url: '/assets/svg/man1.svg',
      thumbnailUrl: '/assets/svg/man1.svg',
      svgContent: `<svg viewBox="0 0 48.452904 127.02859" version="1.1">
        <g transform="translate(-103.1875,-117.47499)">
          <path fill="#fda98b" d="m 132.854,113.071 c 0.138,11.329 3.891,19.73 -16.944,29.534 12.402,17.062 24.616,23.367 24.616,23.367 0,0 26.13,-11.762 35.109,-19.545 -4.672,-3.399 -9.549,-5.939 -13.858,-8.967 -8.512,-5.981 -3.49,-19.271 -5.152,-24.178 z"/>
          <path fill="#fda98b" d="m 137.914,124.95 c 4.695,2.9 10.065,2.016 15.468,0.292 5.962,-1.902 15.645,-19.227 12.01,-40.568 -3.665,-21.515 -27.598,-24.089 -37.094,-9.575 -8.567,13.095 -2.72,42.231 9.616,49.851 z"/>
          <path fill="#323d4d" d="m 99.297,263.919 c -0.248,4.973 -12.274,248.738 -7.49,249.202 2.569,0.249 19.738,1.532 20.306,-1.058 20.424,-93.05 29.946,-183.941 29.946,-183.941 5.752,36.51 5.76,73.746 11.277,110.3 2.066,13.692 15.453,72.697 17.592,73.153 3.625,0.773 19.88,2.425 19.866,-0.907 -0.089,-20.982 -1.993,-246.749 -1.993,-246.749 z"/>
        </g>
      </svg>`
    },
    appearance: {
      color: '#3B82F6',
      colorCustomizable: true,
      colorProperty: 'fill'
    },
    isCustom: false
  },

  // 通用角色 - 女性 (SVG)
  {
    id: 'generic-female-1',
    name: '女性1',
    height: 1.65,
    width: 0.45,
    type: CharacterType.GENERIC,
    media: {
      type: 'svg',
      url: '/assets/svg/woman1.svg',
      thumbnailUrl: '/assets/svg/woman1.svg',
      svgContent: `<svg viewBox="0 0 43.255074 124.109" version="1.1">
        <g transform="translate(-106.1815,-118.31049)">
          <path fill="#fda98b" d="m 130.123,115.234 c 0.125,10.329 3.54,17.99 -15.421,26.89 11.285,15.546 22.415,21.289 22.415,21.289 0,0 23.787,-10.717 31.954,-17.812 -4.254,-3.098 -8.696,-5.406 -12.612,-8.168 -7.746,-5.447 -3.178,-17.552 -4.689,-22.019 z"/>
          <path fill="#fda98b" d="m 134.736,125.89 c 4.278,2.641 9.163,1.835 14.081,0.266 5.425,-1.732 14.238,-17.507 10.931,-36.944 -3.335,-19.591 -25.124,-21.936 -33.777,-8.725 -7.801,11.924 -2.476,38.443 8.765,45.403 z"/>
          <path fill="#323d4d" d="m 95.547,254.234 c -0.226,4.531 -11.166,226.672 -6.816,227.103 2.337,0.227 17.955,1.395 18.472,-0.963 18.587,-84.727 27.227,-167.479 27.227,-167.479 5.233,33.227 5.24,67.178 10.264,100.453 1.88,12.467 14.057,66.193 16.009,66.612 3.297,0.704 18.081,2.207 18.069,-0.826 -0.081,-19.101 -1.812,-224.666 -1.812,-224.666 z"/>
        </g>
      </svg>`
    },
    appearance: {
      color: '#EC4899',
      colorCustomizable: true,
      colorProperty: 'fill'
    },
    isCustom: false
  },

  // 名人 - 马斯克 (图片)
  {
    id: 'celebrity-musk',
    name: '埃隆·马斯克',
    height: 1.88,
    width: 0.52,
    type: CharacterType.CELEBRITY,
    media: {
      type: 'image',
      url: 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400&h=600&fit=crop&crop=faces',
      thumbnailUrl: 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=200&h=300&fit=crop&crop=faces',
      originalWidth: 400,
      originalHeight: 600
    },
    appearance: {
      color: '#1F2937',
      colorCustomizable: false
    },
    isCustom: false,
    description: '特斯拉和SpaceX CEO'
  },

  // 名人 - 比尔·盖茨 (图片)
  {
    id: 'celebrity-gates',
    name: '比尔·盖茨',
    height: 1.77,
    width: 0.50,
    type: CharacterType.CELEBRITY,
    media: {
      type: 'image',
      url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=600&fit=crop&crop=faces',
      thumbnailUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=300&fit=crop&crop=faces',
      originalWidth: 400,
      originalHeight: 600
    },
    appearance: {
      color: '#374151',
      colorCustomizable: false
    },
    isCustom: false,
    description: '微软联合创始人'
  },

  // 名人 - C罗 (图片)
  {
    id: 'celebrity-ronaldo',
    name: 'C罗',
    height: 1.87,
    width: 0.54,
    type: CharacterType.CELEBRITY,
    media: {
      type: 'image',
      url: 'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=400&h=600&fit=crop&crop=faces',
      thumbnailUrl: 'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=200&h=300&fit=crop&crop=faces',
      originalWidth: 400,
      originalHeight: 600
    },
    appearance: {
      color: '#EF4444',
      colorCustomizable: false
    },
    isCustom: false,
    description: '葡萄牙足球运动员'
  },

  // 通用角色 - 儿童 (SVG)
  {
    id: 'generic-child-1',
    name: '儿童1',
    height: 1.2,
    width: 0.35,
    type: CharacterType.GENERIC,
    media: {
      type: 'svg',
      url: '/assets/svg/boy1.svg',
      thumbnailUrl: '/assets/svg/boy1.svg',
      svgContent: `<svg viewBox="0 0 35 90" version="1.1">
        <g>
          <circle fill="#fda98b" cx="17.5" cy="15" r="8"/>
          <rect fill="#3B82F6" x="12" y="25" width="11" height="20"/>
          <rect fill="#1E40AF" x="10" y="45" width="15" height="25"/>
          <rect fill="#fda98b" x="14" y="70" width="3" height="15"/>
          <rect fill="#fda98b" x="18" y="70" width="3" height="15"/>
          <rect fill="#000" x="13" y="85" width="5" height="5"/>
          <rect fill="#000" x="17" y="85" width="5" height="5"/>
        </g>
      </svg>`
    },
    appearance: {
      color: '#F59E0B',
      colorCustomizable: true,
      colorProperty: 'fill'
    },
    isCustom: false
  },

  // 名人 - 姚明
  {
    id: 'celebrity-yao',
    name: '姚明',
    height: 2.26,
    width: 0.6,
    type: CharacterType.CELEBRITY,
    media: {
      type: 'image',
      url: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=600&fit=crop&crop=faces',
      thumbnailUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&h=300&fit=crop&crop=faces',
      originalWidth: 400,
      originalHeight: 600
    },
    appearance: {
      color: '#8B5CF6',
      colorCustomizable: false
    },
    isCustom: false,
    description: '中国篮球运动员'
  },

  // 物体 - 埃菲尔铁塔
  {
    id: 'object-eiffel',
    name: '埃菲尔铁塔',
    height: 324,
    width: 124,
    type: CharacterType.OBJECT,
    media: {
      type: 'svg',
      url: '/assets/svg/eiffel-tower.svg',
      thumbnailUrl: '/assets/svg/eiffel-tower.svg',
      svgContent: `<svg viewBox="0 0 124 324" version="1.1">
        <g>
          <polygon fill="#6B7280" points="62,10 50,50 74,50"/>
          <polygon fill="#6B7280" points="50,50 30,150 94,150"/>
          <polygon fill="#6B7280" points="30,150 10,250 114,250"/>
          <polygon fill="#6B7280" points="10,250 0,324 124,324"/>
          <rect fill="#4B5563" x="58" y="0" width="8" height="324"/>
        </g>
      </svg>`
    },
    appearance: {
      color: '#6B7280',
      colorCustomizable: true,
      colorProperty: 'fill'
    },
    isCustom: false,
    description: '法国巴黎著名地标'
  },

  // 生物 - 长颈鹿
  {
    id: 'bio-giraffe',
    name: '长颈鹿',
    height: 5.5,
    width: 2,
    type: CharacterType.BIOLOGY,
    media: {
      type: 'svg',
      url: '/assets/svg/giraffe.svg',
      thumbnailUrl: '/assets/svg/giraffe.svg',
      svgContent: `<svg viewBox="0 0 100 275" version="1.1">
        <g>
          <ellipse fill="#D97706" cx="50" cy="20" rx="8" ry="6"/>
          <rect fill="#D97706" x="48" y="26" width="4" height="120"/>
          <ellipse fill="#D97706" cx="50" cy="150" rx="15" ry="25"/>
          <rect fill="#D97706" x="35" y="175" width="6" height="80"/>
          <rect fill="#D97706" x="45" y="175" width="6" height="80"/>
          <rect fill="#D97706" x="55" y="175" width="6" height="80"/>
          <rect fill="#D97706" x="65" y="175" width="6" height="80"/>
          <circle fill="#8B4513" cx="47" cy="18" r="1"/>
          <circle fill="#8B4513" cx="53" cy="18" r="1"/>
        </g>
      </svg>`
    },
    appearance: {
      color: '#D97706',
      colorCustomizable: true,
      colorProperty: 'fill'
    },
    isCustom: false,
    description: '世界上最高的陆地动物'
  }
  
  // 注意：其他旧格式角色数据已迁移，仅保留上述测试角色
];

// 单位转换函数（保持向后兼容）
const convertHeight = (m: number, unit: Unit): string => {
  switch (unit) {
    case Unit.CM:
      return `${(m * 100).toFixed(1)}cm`;
    case Unit.FT_IN:
      const totalInches = (m * 100) / 2.54;
      const feet = Math.floor(totalInches / 12);
      const inches = totalInches % 12;
      return `${feet}' ${inches.toFixed(1)}"`;
    default:
      return `${(m * 100).toFixed(1)}cm`;
  }
};

// 新的智能高度转换函数
const convertHeightSmart = (m: number, preferMetric: boolean = true): string => {
  const bestUnit = getBestUnit(m, preferMetric);
  const result = convertHeightPrecision(m, bestUnit);
  return `${result.formatted}${bestUnit}`;
};

// 智能英制单位显示函数 - 新的统一规则
const convertHeightSmartImperial = (m: number): string => {
  const totalInches = (m * 100) / 2.54;
  const totalFeet = totalInches / 12;

  // 小于等于1英尺：用英寸单位（必要时用科学计数法）
  if (totalFeet <= 1) {
    const inchesValue = totalInches;
    if (Math.abs(inchesValue) >= 1000 || (Math.abs(inchesValue) < 0.001 && inchesValue !== 0)) {
      return `${formatScientificNotation(inchesValue, 3)}in`;
    }
    return `${formatNumber(inchesValue)}in`;
  }

  // 1英尺到10000英尺：用英尺英寸格式
  if (totalFeet < 10000) {
    const feet = Math.floor(totalInches / 12);
    const inches = totalInches % 12;
    return `${feet}' ${inches.toFixed(1)}"`;
  }

  // 大于等于10000英尺：用英里单位（必要时用科学计数法）
  const miles = totalFeet / 5280;
  if (Math.abs(miles) >= 1000 || (Math.abs(miles) < 0.001 && miles !== 0)) {
    return `${formatScientificNotation(miles, 3)}mi`;
  }
  return `${formatNumber(miles)}mi`;
};

// 获取英制网格标题的单位显示
const getImperialGridUnitLabel = (maxHeightInComparison: number): string => {
  const maxTotalFeet = ((maxHeightInComparison * 100) / 2.54) / 12;

  if (maxTotalFeet <= 1) {
    return "in"; // 英寸
  } else if (maxTotalFeet < 10000) {
    return "ft/in"; // 英尺英寸
  } else {
    return "mi"; // 英里
  }
};

// 网格刻度线专用的英制显示函数 - 基于最大高度判断显示方式
const convertHeightForGridImperial = (m: number, maxHeightInComparison: number): string => {
  const maxTotalFeet = ((maxHeightInComparison * 100) / 2.54) / 12;
  const totalInches = (m * 100) / 2.54;
  const totalFeet = totalInches / 12;

  // 根据最大高度确定显示方式
  if (maxTotalFeet <= 1) {
    // 最大高度小于等于1英尺：统一用英寸
    const inchesValue = totalInches;
    if (Math.abs(inchesValue) >= 1000 || (Math.abs(inchesValue) < 0.001 && inchesValue !== 0)) {
      return formatScientificNotation(inchesValue, 3);
    }
    return formatNumber(inchesValue);
  } else if (maxTotalFeet < 10000) {
    // 最大高度在1-10000英尺：统一用英尺英寸格式
    const feet = Math.floor(totalInches / 12);
    const inches = totalInches % 12;
    return `${feet}' ${inches.toFixed(1)}"`;
  } else {
    // 最大高度大于等于10000英尺：统一用英里
    const miles = totalFeet / 5280;
    if (Math.abs(miles) >= 1000 || (Math.abs(miles) < 0.001 && miles !== 0)) {
      return formatScientificNotation(miles, 3);
    }
    return formatNumber(miles);
  }
};

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

  // 添加重置缩放函数
  const resetZoom = () => {
    setPixelsPerMState(1); // 重置为默认值1，这会触发自动计算
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

  /**当前m与px（px为屏幕像素）的转换比例，即1m等于多少px */
  const pixelsPerM = useMemo(() => {
    // 如果有手动调整的值，使用手动调整的值
    if (pixelsPerMState !== 1) {
      return pixelsPerMState;
    }
    // 否则使用自动计算的值，使用高精度计算
    const maxHeight = getMaxHeightInComparison(comparisonItems);
    const availableHeight = chartAreaHeightPix - 70;

    // 使用高精度计算避免极端情况下的精度损失
    const heightPrecision = Precision.from(availableHeight);
    const maxHeightPrecision = Precision.from(maxHeight);
    const ratio = heightPrecision.divide(maxHeightPrecision);

    return ratio.toNumber();
  }, [chartAreaHeightPix, comparisonItems, pixelsPerMState]);

  const handleZoom = useCallback((zoomDelta: number) => {
    if (comparisonItems.length == 0) {
      return;
    }
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
    const currentScale = pixelsPerM;
    const newScale = currentScale + (currentScale * zoomDelta); // 添加最小缩放限制

    setPixelsPerMState(newScale);
  }, [pixelsPerM, comparisonItems]);

  // 添加缩放事件处理
  useEffect(() => {
    const chartArea = chartAreaRef.current;
    if (!chartArea) return;

    const handleWheel = (e: WheelEvent) => {
      // 检查是否按住了 Ctrl 键
      if (e.ctrlKey) {
        e.preventDefault(); // 阻止默认的缩放行为
        const delta = e.deltaY > 0 ? -0.1 : 0.1;
        handleZoom(delta);
      }
    }

    // 添加事件监听
    chartArea.addEventListener('wheel', handleWheel, { passive: false });

    // 清理函数
    return () => {
      chartArea.removeEventListener('wheel', handleWheel);
    };
  }, [handleZoom]); // 移除 pixelsPerM 依赖，避免重复绑定事件

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
    startMouseX: 0,
    startMouseY: 0,
    currentMouseX: 0,
    currentMouseY: 0,
    fixedElementX: 0,
    fixedElementY: 0,
    draggedElement: null,
  });

  // 添加左侧角色列表拖拽状态
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

  // 计算占位元素的样式（被拖拽时显示为透明占位）
  const getItemStyle = useCallback((itemId: string, index: number): React.CSSProperties => {
    if (!dragState.isDragging || itemId !== dragState.draggedItemId) {
      return {};
    }

    // 被拖拽的元素在原位置显示为透明占位
    return {
      opacity: 0,
      visibility: 'hidden'
    };
  }, [dragState]);

  // 计算左侧角色列表项目的样式
  const getLeftPanelItemStyle = useCallback((itemId: string): React.CSSProperties => {
    if (!leftPanelDragState.isDragging || itemId !== leftPanelDragState.draggedItemId) {
      return {};
    }

    // 被拖拽的元素在原位置显示为透明占位
    return {
      opacity: 0.3,
      pointerEvents: 'none'
    };
  }, [leftPanelDragState]);


  // 筛选角色
  const filteredCharacters = PRESET_CHARACTERS.filter(char => {
    const matchesSearch = char.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || char.type === selectedCategory;
    return matchesSearch && matchesCategory;
  });


  const addToComparison = (character: Character) => {
    // 计算相同原始角色的数量，用于生成序号
    let maxSimilarNameIndex: number = -1;
    for (let i = 0; i < comparisonItems.length; i++) {
      if (comparisonItems[i].character.name.length >= character.name.length &&
        comparisonItems[i].character.name.startsWith(character.name)) {
        const indexStr = comparisonItems[i].character.name.slice(character.name.length);
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

    // 创建角色的深拷贝，避免引用同一个对象
    const newCharacter: Character = {
      ...character,
      id: `${character.id}-${Date.now()}-${Math.random()}`, // 确保ID唯一
      name: maxSimilarNameIndex == -1 ? character.name : `${character.name} ${maxSimilarNameIndex + 1}`,
      isCustom: true // 标记为自定义，允许编辑
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

    // 更新比较列表中的角色
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
    
    // 计算宽度：如果没有指定宽度，则根据高度和宽高比计算
    const calculatedWidthInM = widthInM || (heightInM * aspectRatio);
    
    // 创建新角色
    const newCharacter: Character = {
      id: `upload-${Date.now()}-${Math.random()}`,
      name: '上传角色',
      height: heightInM,
      width: calculatedWidthInM,
      type: CharacterType.UPLOAD,
      color: '#10B981',
      isCustom: true,
      imageUrl: imageUrl
    };

    // 添加到比较列表
    addToComparison(newCharacter);
    
    // 关闭上传弹窗
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
                <div className="flex gap-1">
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
                            title="拖拽调整位置"
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
                onClick={() => setSelectedCategory(CharacterType.GENERIC)}
                className={`flex-1 px-1 py-2 text-xs text-center border-r border-gray-200 ${selectedCategory === CharacterType.GENERIC
                  ? 'text-blue-600 border-b-2 border-b-blue-600 -mb-px bg-blue-50'
                  : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50'
                  }`}
              >
                通用
              </button>
              <button
                onClick={() => setSelectedCategory(CharacterType.CELEBRITY)}
                className={`flex-1 px-1 py-2 text-xs text-center border-r border-gray-200 ${selectedCategory === CharacterType.CELEBRITY
                  ? 'text-blue-600 border-b-2 border-b-blue-600 -mb-px bg-blue-50'
                  : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50'
                  }`}
              >
                名人
              </button>
              <button
                onClick={() => setSelectedCategory(CharacterType.OBJECT)}
                className={`flex-1 px-1 py-2 text-xs text-center border-r border-gray-200 ${selectedCategory === CharacterType.OBJECT
                  ? 'text-blue-600 border-b-2 border-b-blue-600 -mb-px bg-blue-50'
                  : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50'
                  }`}
              >
                物体
              </button>
              <button
                onClick={() => setSelectedCategory(CharacterType.BIOLOGY)}
                className={`flex-1 px-1 py-2 text-xs text-center border-r border-gray-200 ${selectedCategory === CharacterType.BIOLOGY
                  ? 'text-blue-600 border-b-2 border-b-blue-600 -mb-px bg-blue-50'
                  : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50'
                  }`}
              >
                生物
              </button>
              <button
                onClick={() => setSelectedCategory(CharacterType.UPLOAD)}
                className={`flex-1 px-1 py-2 text-xs text-center ${selectedCategory === CharacterType.UPLOAD
                  ? 'text-blue-600 border-b-2 border-b-blue-600 -mb-px bg-blue-50'
                  : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50'
                  }`}
              >
                上传
              </button>
            </div>

            {/* 角色网格 */}
            <div className="flex-1 overflow-y-auto p-4 thin-scrollbar relative">
              <div className="absolute inset-4">
                {selectedCategory === CharacterType.UPLOAD ? (
                  /* 上传图片界面 */
                  <div className="flex flex-col items-center justify-center h-full">
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center w-full max-w-sm">
                      <div className="text-4xl mb-4">📷</div>
                      <h3 className="text-lg font-medium text-gray-900 mb-2">上传图片</h3>
                      <p className="text-sm text-gray-500 mb-4">
                        支持 JPG、PNG、GIF 格式<br />
                        上传后可进行裁剪
                      </p>
                      <button
                        className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-colors"
                        onClick={() => setShowImageUploadModal(true)}
                      >
                        选择图片
                      </button>
                    </div>
                  </div>
                ) : (
                  /* 预设角色网格 */
                  <div className="grid grid-cols-3 gap-2">
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
                            {character.type === CharacterType.GENERIC ? (
                              character.svgIcon ? (
                                // 这里可以根据 svgIcon 显示不同的图标
                                character.name.includes('男性') ? '👨' :
                                  character.name.includes('女性') ? '👩' :
                                    character.name.includes('中性') ? '🧑' :
                                      character.name.includes('儿童') ? '🧒' : '👤'
                              ) : '👤'
                            ) :
                              character.type === CharacterType.CELEBRITY ? (
                                character.name.includes('动漫') || character.name.includes('柯南') || character.name.includes('路飞') ? '👥' :
                                  character.name.includes('神话') || character.name.includes('宙斯') ? '⚡' : '⭐'
                              ) :
                                character.type === CharacterType.OBJECT ? (
                                  character.name.includes('塔') || character.name.includes('建筑') ? '🏗️' :
                                    character.name.includes('山') || character.name.includes('峰') ? '🏔️' :
                                      character.name.includes('地球') ? '🌍' :
                                        character.name.includes('太阳') ? '☀️' : '🏢'
                                ) :
                                  character.type === CharacterType.BIOLOGY ? (
                                    character.name.includes('树') || character.name.includes('竹') ? '🌳' :
                                      character.name.includes('鲸') ? '🐋' :
                                        character.name.includes('长颈鹿') ? '🦒' :
                                          character.name.includes('大象') ? '🐘' :
                                            character.name.includes('蚂蚁') ? '🐜' :
                                              character.name.includes('细菌') || character.name.includes('病毒') ? '🦠' : '🐾'
                                  ) :
                                    character.type === CharacterType.UPLOAD ? '📷' : '○'}
                          </div>
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
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 中间图表区域 */}
        <div className={`flex flex-col h-full transition-all duration-300 w-4/5`}>
          <div id="top-ads" className="w-full h-[120px] m-0 py-[10px]"></div>
          <div className='flex-1 flex w-full'>
            <div className={`flex-1 flex flex-col ${showRightPanel && selectedCharacter ? 'w-[calc(100%-300px)]' : 'w-full'} relative`}>
              {/* 工具栏 */}
              <div className="px-4 pt-4 pb-6 bg-white border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <h1 className="text-xl font-bold">身高比较工具</h1>
                    <div className="text-sm text-gray-600">
                      {comparisonItems.length} 个对象
                    </div>
                    <div className="text-sm text-gray-600">
                      pixelsPerM: {formatNumber(pixelsPerM, 10)}
                    </div>
                    <div className="text-sm text-gray-600">
                      chartAreaHeightPix: {chartAreaHeightPix}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1">
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
                    <button
                      onClick={resetZoom}
                      className={`p-2 rounded transition-colors ${pixelsPerMState === 1
                        ? 'bg-gray-50 text-gray-400 cursor-not-allowed'
                        : 'bg-gray-100 text-gray-600 hover:bg-blue-100 hover:text-blue-600'
                        }`}
                      title="重置缩放"
                      disabled={pixelsPerMState === 1}
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
              <div className="w-full flex-1 p-4 thin-scrollbar relative" style={{ backgroundColor: styleSettings.backgroundColor, height: `calc(100% - 16px)` }}>
                <div ref={chartAreaRef} className="relative px-20 h-full flex items-end justify-center">
                  {/* 缩放控件 */}
                  <div className="absolute -top-2 right-[5rem] z-[1002] flex flex-col gap-1">
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
                          放大 (按住 Ctrl + 滚动鼠标快捷缩放)
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
                          缩小 (按住 Ctrl + 滚动鼠标快捷缩放)
                          <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-2 border-r-2 border-t-4 border-transparent border-t-gray-800"></div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 网格线 */}
                  {styleSettings.gridLines && (() => {
                    // 计算最大高度用于确定统一的单位制
                    const maxHeightInComparison = getMaxHeightInComparison(comparisonItems);
                    const unifiedMetricUnit = getBestUnit(maxHeightInComparison, true);
                    const unifiedImperialUnit = getBestUnit(maxHeightInComparison, false);

                    return (
                      <div className="absolute inset-0 pointer-events-none">
                        {/* 动态单位标签 */}
                        <div className="absolute top-0 left-0 w-full">
                          <span className="absolute left-4 -top-8 text-sm font-bold text-gray-700">
                            公制 ({unifiedMetricUnit})
                          </span>
                          <span className="absolute right-4 -top-8 text-sm font-bold text-gray-700">
                            英制 ({getImperialGridUnitLabel(maxHeightInComparison)})
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
                                  <span className="absolute left-2 -top-2 text-xs text-gray-600">
                                    {metricResult.formatted}
                                  </span>
                                  <span className="absolute right-2 -top-2 text-xs text-gray-600">
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
            {/* 右侧编辑面板 - 固定在最右侧 */}
            {showRightPanel && selectedCharacter && (
              <div ref={rightPanelRef} className={`w-[300px] bg-white shadow-xl z-[1003] overflow-y-auto border-l border-gray-200 thin-scrollbar transition-transform duration-300`}>
                <div className="px-4 py-2 border-b border-gray-200 bg-gray-50">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">角色详情</h3>
                    <button
                      onClick={() => {
                        setShowRightPanel(false)
                        setSelectedCharacter(null)
                        setSelectedComparisonItemId(null)
                      }}
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
                        min="0.3"
                        max="3"
                        step="0.01"
                        placeholder="输入身高"
                      />
                      <span className="px-3 py-2 bg-gray-100 rounded-md text-sm">m</span>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {unit === Unit.CM ? convertHeightSmart(selectedCharacter.height, true) : convertHeightSmartImperial(selectedCharacter.height)}
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

        </div>

        {/* Fixed拖拽元素 */}
        {dragState.isDragging && dragState.draggedItemId && dragState.draggedElement && (
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
        )}

        {/* 左侧角色列表Fixed拖拽元素 */}
        {leftPanelDragState.isDragging && leftPanelDragState.draggedItemId && leftPanelDragState.draggedElement && (
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
        )}

        {/* 图片上传弹窗 */}
        <ImageUploadModal
          isOpen={showImageUploadModal}
          onClose={() => setShowImageUploadModal(false)}
          onSave={handleImageUpload}
        />
      </div>
    </>
  );
};

export { HeightCompareTool };

