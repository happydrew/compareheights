export { PRESET_CHARACTERS, type Character, CharacterType };

// 角色类型枚举
enum CharacterType {
  GENERIC = 'generic',    // 通用角色（通用的男女、无性别者）
  CELEBRITY = 'celebrity', // 名人（现实人物、动漫角色、书中虚构人物、神话虚构人物等）
  OBJECT = 'object',      // 物体（建筑物、山、地球、太阳等自然物体）
  BIOLOGY = 'biology',    // 生物（动物、植物、微生物、病毒等）
  UPLOAD = 'upload'       // 上传图片
}

// 角色接口 - 完全匹配数据库表字段结构
interface Character {
  id: string;
  name: string;
  height: number; // 以m为单位
  type: CharacterType;
  description?: string;

  // 媒体相关字段
  mediaType: 'svg' | 'image'; // 媒体类型
  mediaUrl: string; // 主要图片/SVG的URL
  thumbnailUrl: string; // 缩略图URL（用于角色库展示）
  svgContent?: string | null; // SVG内容（仅当mediaType为svg时）

  // 外观相关字段
  color?: string | null; // 默认颜色
  colorCustomizable: boolean; // 是否支持自定义颜色
  colorProperty?: string; // SVG中需要修改颜色的属性名（如'fill', 'stroke'）

  // 状态字段
  isCustom: boolean; // 是否为自定义角色
  isActive: boolean; // 是否激活状态
  isUploadedImage?: boolean; // 是否为用户上传的图片

  // 时间戳字段
  createdAt?: string; // 创建时间
  updatedAt?: string; // 更新时间
}

// 预设角色数据（基于米） - 使用新的数据结构
const PRESET_CHARACTERS: Character[] = [
  // Generic character - Male (SVG)
  {
    id: 'generic-male-1',
    name: 'Male 1',
    height: 1.75,
    type: CharacterType.GENERIC,
    description: 'Generic male character',
    // 媒体相关字段
    mediaType: 'svg',
    mediaUrl: '/assets/svg/man1.svg',
    thumbnailUrl: '/assets/svg/man1.svg',
    svgContent: null,
    // 外观相关字段
    color: '#3B82F6',
    colorCustomizable: false,
    colorProperty: 'fill',
    // 状态字段
    isCustom: false,
    isActive: true
  },

  // Generic character - Female (SVG)
  {
    id: 'generic-female-1',
    name: 'Female 1',
    height: 1.65,
    type: CharacterType.GENERIC,
    description: 'Generic female character',
    // 媒体相关字段
    mediaType: 'svg',
    mediaUrl: '/assets/svg/woman1.svg',
    thumbnailUrl: '/assets/svg/woman1.svg',
    svgContent: null,
    // 外观相关字段
    color: '#EC4899',
    colorCustomizable: false,
    colorProperty: 'fill',
    // 状态字段
    isCustom: false,
    isActive: true
  },

  // Celebrity - Musk (Image)
  {
    id: 'celebrity-musk',
    name: 'Elon Musk',
    height: 1.88,
    type: CharacterType.CELEBRITY,
    description: 'CEO of Tesla and SpaceX',
    // 媒体相关字段
    mediaType: 'image',
    mediaUrl: '/assets/images/original-3.webp',
    thumbnailUrl: '/assets/images/original-3.webp',
    // 外观相关字段
    color: '#1F2937',
    colorCustomizable: false,
    // 状态字段
    isCustom: false,
    isActive: true
  },

  // Celebrity - Bill Gates (Image)
  {
    id: 'celebrity-gates',
    name: 'Bill Gates',
    height: 1.77,
    type: CharacterType.CELEBRITY,
    description: 'Co-founder of Microsoft',
    // 媒体相关字段
    mediaType: 'image',
    mediaUrl: '/assets/images/original-4.webp',
    thumbnailUrl: '/assets/images/original-4.webp',
    // 外观相关字段
    color: '#374151',
    colorCustomizable: false,
    // 状态字段
    isCustom: false,
    isActive: true
  },

  // Celebrity - Cristiano Ronaldo (Image)
  {
    id: 'celebrity-ronaldo',
    name: 'Cristiano Ronaldo',
    height: 1.87,
    type: CharacterType.CELEBRITY,
    description: 'Portuguese football player',
    // 媒体相关字段
    mediaType: 'image',
    mediaUrl: '/assets/images/original-1.webp',
    thumbnailUrl: '/assets/images/original-1.webp',
    // 外观相关字段
    color: '#EF4444',
    colorCustomizable: false,
    // 状态字段
    isCustom: false,
    isActive: true
  },

  // Generic character - Child (SVG)
  {
    id: 'generic-child-1',
    name: 'Child 1',
    height: 1.2,
    type: CharacterType.GENERIC,
    description: 'Generic child character',
    // 媒体相关字段
    mediaType: 'svg',
    mediaUrl: '/assets/svg/boy1.svg',
    thumbnailUrl: '/assets/svg/boy1.svg',
    svgContent: null,
    // 外观相关字段
    color: '#F59E0B',
    colorCustomizable: false,
    colorProperty: 'fill',
    // 状态字段
    isCustom: false,
    isActive: true
  },

  // Celebrity - Yao Ming
  {
    id: 'celebrity-yaoming',
    name: 'Yao Ming',
    height: 2.26,
    type: CharacterType.CELEBRITY,
    description: 'Chinese basketball player',
    // 媒体相关字段
    mediaType: 'image',
    mediaUrl: '/assets/images/original-2.webp',
    thumbnailUrl: '/assets/images/original-2.webp',
    // 外观相关字段
    color: '#8B5CF6',
    colorCustomizable: false,
    // 状态字段
    isCustom: false,
    isActive: true
  },

  // Object - Eiffel Tower
  {
    id: 'object-eiffel',
    name: 'Eiffel Tower',
    height: 324,
    type: CharacterType.OBJECT,
    description: 'Famous landmark in Paris, France',
    // 媒体相关字段
    mediaType: 'svg',
    mediaUrl: '/assets/svg/eiffel-tower.svg',
    thumbnailUrl: '/assets/svg/eiffel-tower.svg',
    svgContent: null,
    // 外观相关字段
    color: '#6B7280',
    colorCustomizable: true,
    colorProperty: 'fill',
    // 状态字段
    isCustom: false,
    isActive: true
  },

  // Biology - Giraffe
  {
    id: 'bio-giraffe',
    name: 'Giraffe',
    height: 5.5,
    type: CharacterType.BIOLOGY,
    description: 'World\'s tallest land animal',
    // 媒体相关字段
    mediaType: 'svg',
    mediaUrl: '/assets/svg/giraffe.svg',
    thumbnailUrl: '/assets/svg/giraffe.svg',
    svgContent: null,
    // 外观相关字段
    color: '#D97706',
    colorCustomizable: true,
    colorProperty: 'fill',
    // 状态字段
    isCustom: false,
    isActive: true
  }

  // Note: Other old format character data has been migrated, only the above test characters are retained
];