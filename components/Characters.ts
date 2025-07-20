export { PRESET_CHARACTERS, type Character, CharacterType };

// 角色类型枚举
enum CharacterType {
  GENERIC = 'generic',    // 通用角色（通用的男女、无性别者）
  CELEBRITY = 'celebrity', // 名人（现实人物、动漫角色、书中虚构人物、神话虚构人物等）
  OBJECT = 'object',      // 物体（建筑物、山、地球、太阳等自然物体）
  BIOLOGY = 'biology',    // 生物（动物、植物、微生物、病毒等）
  UPLOAD = 'upload'       // 上传图片
}

// 角色接口 - 扁平化结构，对应数据库表字段
interface Character {
  id: string;
  name: string;
  height: number; // 以m为单位
  // 不定义角色的宽度了，以角色的图片的实际宽高比为角色的宽高比，这样收集整理角色数据时，就不用再额外收集或者计算角色的宽度
  // width: number; // 以m为单位
  type: CharacterType;

  // 媒体相关字段
  mediaType: 'svg' | 'image'; // 媒体类型
  mediaUrl: string; // 主要图片/SVG的URL
  thumbnailUrl: string; // 缩略图URL（用于角色库展示）
  svgContent?: string | null; // SVG内容（仅当mediaType为svg时）

  // 外观相关字段
  color?: string | null; // 默认颜色
  colorCustomizable: boolean; // 是否支持自定义颜色
  colorProperty?: string; // SVG中需要修改颜色的属性名（如'fill', 'stroke'）

  isCustom: boolean;
  description?: string;
  isUploadedImage?: boolean; // 是否为用户上传的图片
}

// 预设角色数据（基于米） - 使用新的数据结构
const PRESET_CHARACTERS: Character[] = [
  // 通用角色 - 男性 (SVG)
  {
    id: 'generic-male-1',
    name: '男性1',
    height: 1.75,
    //width: 0.5,
    type: CharacterType.GENERIC,
    // 媒体相关字段 - 扁平化
    mediaType: 'svg',
    mediaUrl: '/assets/svg/man1.svg',
    thumbnailUrl: '/assets/svg/man1.svg',
    svgContent: null,
    // 外观相关字段 - 扁平化
    //color: '#3B82F6',
    colorCustomizable: false,
    colorProperty: 'fill', // 可设置多个属性用逗号分隔，如 'fill,stroke'
    isCustom: false
  },

  // 通用角色 - 女性 (SVG)
  {
    id: 'generic-female-1',
    name: '女性1',
    height: 1.65,
    //width: 0.45,
    type: CharacterType.GENERIC,
    // 媒体相关字段 - 扁平化
    mediaType: 'svg',
    mediaUrl: '/assets/svg/woman1.svg',
    thumbnailUrl: '/assets/svg/woman1.svg',
    svgContent: null,
    // 外观相关字段 - 扁平化
    //color: '#EC4899',
    colorCustomizable: true,
    colorProperty: 'fill',
    isCustom: false
  },

  // 名人 - 马斯克 (图片)
  {
    id: 'celebrity-musk',
    name: '埃隆·马斯克',
    height: 1.88,
    //width: 0.52,
    type: CharacterType.CELEBRITY,
    // 媒体相关字段 - 扁平化
    mediaType: 'image',
    mediaUrl: '/assets/images/original-3.webp',
    thumbnailUrl: '/assets/images/original-3.webp',
    // 外观相关字段 - 扁平化
    color: '#1F2937',
    colorCustomizable: false,
    isCustom: false,
    description: '特斯拉和SpaceX CEO'
  },

  // 名人 - 比尔·盖茨 (图片)
  {
    id: 'celebrity-gates',
    name: '比尔·盖茨',
    height: 1.77,
    //width: 0.50,
    type: CharacterType.CELEBRITY,
    // 媒体相关字段 - 扁平化
    mediaType: 'image',
    mediaUrl: '/assets/images/original-4.webp',
    thumbnailUrl: '/assets/images/original-4.webp',
    // 外观相关字段 - 扁平化
    color: '#374151',
    colorCustomizable: false,
    isCustom: false,
    description: '微软联合创始人'
  },

  // 名人 - C罗 (图片)
  {
    id: 'celebrity-ronaldo',
    name: 'C罗',
    height: 1.87,
    //width: 0.54,
    type: CharacterType.CELEBRITY,
    // 媒体相关字段 - 扁平化
    mediaType: 'image',
    mediaUrl: '/assets/images/original-1.webp',
    thumbnailUrl: '/assets/images/original-1.webp',
    // 外观相关字段 - 扁平化
    color: '#EF4444',
    colorCustomizable: false,
    isCustom: false,
    description: '葡萄牙足球运动员'
  },

  // 通用角色 - 儿童 (SVG)
  {
    id: 'generic-child-1',
    name: '儿童1',
    height: 1.2,
    //width: 0.35,
    type: CharacterType.GENERIC,
    // 媒体相关字段 - 扁平化
    mediaType: 'svg',
    mediaUrl: '/assets/svg/boy1.svg',
    thumbnailUrl: '/assets/svg/boy1.svg',
    svgContent: null,
    // 外观相关字段 - 扁平化
    //color: '#F59E0B',
    colorCustomizable: true,
    colorProperty: 'fill',
    isCustom: false
  },

  // 名人 - 姚明
  {
    id: 'celebrity-yaoming',
    name: '姚明',
    height: 2.26,
    //width: 0.6,
    type: CharacterType.CELEBRITY,
    // 媒体相关字段 - 扁平化
    mediaType: 'image',
    mediaUrl: '/assets/images/original-2.webp',
    thumbnailUrl: '/assets/images/original-2.webp',
    // 外观相关字段 - 扁平化
    color: '#8B5CF6',
    colorCustomizable: false,
    isCustom: false,
    description: '中国篮球运动员'
  },

  // 物体 - 埃菲尔铁塔
  {
    id: 'object-eiffel',
    name: '埃菲尔铁塔',
    height: 324,
    //width: 124,
    type: CharacterType.OBJECT,
    // 媒体相关字段 - 扁平化
    mediaType: 'svg',
    mediaUrl: '/assets/svg/eiffel-tower.svg',
    thumbnailUrl: '/assets/svg/eiffel-tower.svg',
    svgContent: null,
    // 外观相关字段 - 扁平化
    color: '#6B7280',
    colorCustomizable: true,
    colorProperty: 'fill',
    isCustom: false,
    description: '法国巴黎著名地标'
  },

  // 生物 - 长颈鹿
  {
    id: 'bio-giraffe',
    name: '长颈鹿',
    height: 5.5,
    //width: 2,
    type: CharacterType.BIOLOGY,
    // 媒体相关字段 - 扁平化
    mediaType: 'svg',
    mediaUrl: '/assets/svg/giraffe.svg',
    thumbnailUrl: '/assets/svg/giraffe.svg',
    svgContent: null,
    // 外观相关字段 - 扁平化
    color: '#D97706',
    colorCustomizable: true,
    colorProperty: 'fill',
    isCustom: false,
    description: '世界上最高的陆地动物'
  }

  // 注意：其他旧格式角色数据已迁移，仅保留上述测试角色
];