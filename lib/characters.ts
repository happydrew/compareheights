export {
  PRESET_CHARACTERS, type Character, CharacterType, type QueryCharactersParams,
  type QueryCharactersResponse, queryCharacters
};


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

  // 媒体相关字段
  mediaType: 'svg' | 'image'; // 媒体类型
  mediaUrl: string; // 主要图片/SVG的URL
  thumbnailUrl: string; // 缩略图URL（用于角色库展示）
  svgContent?: string | null; // SVG内容（仅当mediaType为svg时）

  // 外观相关字段
  color?: string | null; // 默认颜色
  colorCustomizable: boolean; // 是否支持自定义颜色
  colorProperty?: string; // SVG中需要修改颜色的属性名（如'fill', 'stroke'）
}

// 预设角色数据（基于米） - 使用新的数据结构
const PRESET_CHARACTERS: Character[] = [
  // 通用角色 - 男性 (SVG)
  {
    id: 'generic-male-1',
    name: 'Male 1',
    height: 1.75,
    type: CharacterType.GENERIC,
    // 媒体相关字段
    mediaType: 'svg',
    mediaUrl: '/assets/svg/man1.svg',
    thumbnailUrl: '/assets/svg/man1.svg',
    svgContent: null,
    // 外观相关字段
    color: '#3B82F6',
    colorCustomizable: false,
    colorProperty: 'fill'
  },

  // 通用角色 - 女性 (SVG)
  {
    id: 'generic-female-1',
    name: 'Female 1',
    height: 1.65,
    type: CharacterType.GENERIC,
    // 媒体相关字段
    mediaType: 'svg',
    mediaUrl: '/assets/svg/woman1.svg',
    thumbnailUrl: '/assets/svg/woman1.svg',
    svgContent: null,
    // 外观相关字段
    color: '#EC4899',
    colorCustomizable: false,
    colorProperty: 'fill'
  },

  // 名人 - 马斯克 (图片)
  {
    id: 'celebrity-musk',
    name: 'Elon Musk',
    height: 1.88,
    type: CharacterType.CELEBRITY,
    // 媒体相关字段
    mediaType: 'image',
    mediaUrl: '/assets/images/original-3.webp',
    thumbnailUrl: '/assets/images/original-3.webp',
    // 外观相关字段
    color: '#1F2937',
    colorCustomizable: false
  },

  // 名人 - 比尔·盖茨 (图片)
  {
    id: 'celebrity-gates',
    name: 'Bill Gates',
    height: 1.77,
    type: CharacterType.CELEBRITY,
    // 媒体相关字段
    mediaType: 'image',
    mediaUrl: '/assets/images/original-4.webp',
    thumbnailUrl: '/assets/images/original-4.webp',
    // 外观相关字段
    color: '#374151',
    colorCustomizable: false
  },

  // 名人 - 克里斯蒂亚诺·罗纳尔多 (图片)
  {
    id: 'celebrity-ronaldo',
    name: 'Cristiano Ronaldo',
    height: 1.87,
    type: CharacterType.CELEBRITY,
    // 媒体相关字段
    mediaType: 'image',
    mediaUrl: '/assets/images/original-1.webp',
    thumbnailUrl: '/assets/images/original-1.webp',
    // 外观相关字段
    color: '#EF4444',
    colorCustomizable: false
  },

  // 通用角色 - 儿童 (SVG)
  {
    id: 'generic-child-1',
    name: 'Child 1',
    height: 1.2,
    type: CharacterType.GENERIC,
    // 媒体相关字段
    mediaType: 'svg',
    mediaUrl: '/assets/svg/boy1.svg',
    thumbnailUrl: '/assets/svg/boy1.svg',
    svgContent: null,
    // 外观相关字段
    color: '#F59E0B',
    colorCustomizable: false,
    colorProperty: 'fill'
  },

  // 名人 - 姚明
  {
    id: 'celebrity-yaoming',
    name: 'Yao Ming',
    height: 2.26,
    type: CharacterType.CELEBRITY,
    // 媒体相关字段
    mediaType: 'image',
    mediaUrl: '/assets/images/original-2.webp',
    thumbnailUrl: '/assets/images/original-2.webp',
    // 外观相关字段
    color: '#8B5CF6',
    colorCustomizable: false
  },

  // 物体 - 埃菲尔铁塔
  {
    id: 'object-eiffel',
    name: 'Eiffel Tower',
    height: 324,
    type: CharacterType.OBJECT,
    // 媒体相关字段
    mediaType: 'svg',
    mediaUrl: '/assets/svg/eiffel-tower.svg',
    thumbnailUrl: '/assets/svg/eiffel-tower.svg',
    svgContent: null,
    // 外观相关字段
    color: '#6B7280',
    colorCustomizable: true,
    colorProperty: 'fill'
  },

  // 生物 - 长颈鹿
  {
    id: 'bio-giraffe',
    name: 'Giraffe',
    height: 5.5,
    type: CharacterType.BIOLOGY,
    // 媒体相关字段
    mediaType: 'svg',
    mediaUrl: '/assets/svg/giraffe.svg',
    thumbnailUrl: '/assets/svg/giraffe.svg',
    svgContent: null,
    // 外观相关字段
    color: '#D97706',
    colorCustomizable: true,
    colorProperty: 'fill'
  }
];

// API接口参数类型
interface QueryCharactersParams {
  type?: CharacterType | 'all';
  limit?: number;
  offset?: number;
  search?: string;
}

// API响应类型
interface QueryCharactersResponse {
  success: boolean;
  data?: Character[];
  total?: number;
  message?: string;
}

// API基础URL - 使用相对路径调用本地API
const QUERY_CHARACTERS_URL = 'http://localhost/api/queryCharacters';

// 内存缓存 - 按角色类型缓存数据
interface CacheEntry {
  data: Character[];
  timestamp: number;
  total: number;
}

// 缓存存储 - 页面级别临时缓存
const charactersCache = new Map<string, CacheEntry>();
const CACHE_DURATION = 5 * 60 * 1000; // 5分钟缓存有效期

// 检查缓存是否有效
function isCacheValid(cacheEntry: CacheEntry): boolean {
  return Date.now() - cacheEntry.timestamp < CACHE_DURATION;
}

// 获取缓存数据
function getFromCache(type: CharacterType | 'all'): CacheEntry | null {
  const cached = charactersCache.get(type);

  if (cached && isCacheValid(cached)) {
    return cached;
  }

  if (cached) {
    charactersCache.delete(type);
  }

  return null;
}

// 设置缓存数据
function setToCache(type: CharacterType | 'all', data: Character[], total: number, search?: string): void {
  const cacheEntry: CacheEntry = {
    data,
    total,
    timestamp: Date.now()
  };

  charactersCache.set(type, cacheEntry);
  //console.log(`💾 已缓存 ${data.length} 个角色，类型：${type}`);
}

// 模拟API延迟
const simulateApiDelay = (ms: number = 800) => new Promise(resolve => setTimeout(resolve, ms));

// 使用模拟数据实现queryCharacters
const queryCharactersMock = async (params: QueryCharactersParams = {}): Promise<QueryCharactersResponse> => {
  await simulateApiDelay();

  if (Math.random() < 0.33) {
    return {
      success: false,
      message: '模拟API错误'
    }
  }
  const {
    type = 'all',
    limit = 50,
    offset = 0,
    search = ''
  } = params;

  let filteredCharacters = [...MOCK_CHARACTERS];

  // 按类型过滤
  if (type !== 'all') {
    filteredCharacters = filteredCharacters.filter(char => char.type === type);
  }

  // 按搜索词过滤
  if (search) {
    const searchLower = search.toLowerCase();
    filteredCharacters = filteredCharacters.filter(char =>
      char.name.toLowerCase().includes(searchLower)
    );
  }

  // 分页
  const total = filteredCharacters.length;
  const paginatedCharacters = filteredCharacters.slice(offset, offset + limit);

  return {
    success: true,
    data: paginatedCharacters,
    total,
    message: '角色检索成功'
  };
};

// 实际API调用函数（当API可用时使用）
const queryCharactersApi = async (params: QueryCharactersParams = {}): Promise<QueryCharactersResponse> => {
  const queryParams = new URLSearchParams();

  if (params.type && params.type !== 'all') {
    queryParams.append('type', params.type);
  }
  if (params.limit) {
    queryParams.append('limit', params.limit.toString());
  }
  if (params.offset) {
    queryParams.append('offset', params.offset.toString());
  }
  if (params.search) {
    queryParams.append('search', params.search);
  }

  const url = `${QUERY_CHARACTERS_URL}?${queryParams.toString()}`;

  console.log('query characters url is: ' + url)

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: QueryCharactersResponse = await response.json();
    return data;
  } catch (error) {
    console.error('API call failed:', error);
    throw new Error('从API获取角色失败');
  }
};

// 主要导出函数 - 带缓存的API调用
const queryCharacters = async (params: QueryCharactersParams = {}): Promise<QueryCharactersResponse> => {
  const { type = 'all', search = '', limit = 50, offset = 0 } = params;

  // 只对基础查询（无分页、无搜索）进行缓存
  const shouldCache = offset === 0 && limit >= 50 && !search;

  if (shouldCache) {
    // 尝试从缓存获取数据（无搜索词）
    const cached = getFromCache(type as CharacterType | 'all');
    if (cached) {
      return {
        success: true,
        data: cached.data.slice(0, limit), // 应用limit限制
        total: cached.total,
        message: '数据从缓存中检索'
      };
    }
  }

  try {
    // 调用真实API
    const response = await queryCharactersApi(params);

    // 如果成功且应该缓存，则缓存数据（无搜索词）
    if (response.success && response.data && shouldCache) {
      setToCache(type as CharacterType | 'all', response.data, response.total || 0);
    }

    return response;
  } catch (error) {
    console.error('API call failed:', error);
    throw error;
  }
};

// 模拟API响应数据 - 匹配数据库schema结构
const MOCK_CHARACTERS: Character[] = [
  {
    id: 'generic-male-1',
    name: 'Male 1',
    height: 1.75,
    type: CharacterType.GENERIC,
    mediaType: 'svg',
    mediaUrl: '/assets/svg/man1.svg',
    thumbnailUrl: '/assets/svg/man1.svg',
    svgContent: null,
    color: '#3B82F6',
    colorCustomizable: false,
    colorProperty: 'fill'
  },
  {
    id: 'generic-female-1',
    name: 'Female 1',
    height: 1.65,
    type: CharacterType.GENERIC,
    mediaType: 'svg',
    mediaUrl: '/assets/svg/woman1.svg',
    thumbnailUrl: '/assets/svg/woman1.svg',
    svgContent: null,
    color: '#EC4899',
    colorCustomizable: false,
    colorProperty: 'fill'
  },
  {
    id: 'celebrity-musk',
    name: 'Elon Musk',
    height: 1.88,
    type: CharacterType.CELEBRITY,
    mediaType: 'image',
    mediaUrl: '/assets/images/original-3.webp',
    thumbnailUrl: '/assets/images/original-3.webp',
    color: '#1F2937',
    colorCustomizable: false
  },
  {
    id: 'celebrity-gates',
    name: 'Bill Gates',
    height: 1.77,
    type: CharacterType.CELEBRITY,
    mediaType: 'image',
    mediaUrl: '/assets/images/original-4.webp',
    thumbnailUrl: '/assets/images/original-4.webp',
    color: '#374151',
    colorCustomizable: false
  },
  {
    id: 'celebrity-ronaldo',
    name: 'Cristiano Ronaldo',
    height: 1.87,
    type: CharacterType.CELEBRITY,
    mediaType: 'image',
    mediaUrl: '/assets/images/original-1.webp',
    thumbnailUrl: '/assets/images/original-1.webp',
    color: '#EF4444',
    colorCustomizable: false
  },
  {
    id: 'generic-child-1',
    name: 'Child 1',
    height: 1.2,
    type: CharacterType.GENERIC,
    mediaType: 'svg',
    mediaUrl: '/assets/svg/boy1.svg',
    thumbnailUrl: '/assets/svg/boy1.svg',
    svgContent: null,
    color: '#F59E0B',
    colorCustomizable: false,
    colorProperty: 'fill'
  },
  {
    id: 'celebrity-yaoming',
    name: 'Yao Ming',
    height: 2.26,
    type: CharacterType.CELEBRITY,
    mediaType: 'image',
    mediaUrl: '/assets/images/original-2.webp',
    thumbnailUrl: '/assets/images/original-2.webp',
    color: '#8B5CF6',
    colorCustomizable: false
  },
  {
    id: 'object-eiffel',
    name: 'Eiffel Tower',
    height: 324,
    type: CharacterType.OBJECT,
    mediaType: 'svg',
    mediaUrl: '/assets/svg/eiffel-tower.svg',
    thumbnailUrl: '/assets/svg/eiffel-tower.svg',
    svgContent: null,
    color: '#6B7280',
    colorCustomizable: true,
    colorProperty: 'fill'
  },
  {
    id: 'bio-giraffe',
    name: 'Giraffe',
    height: 5.5,
    type: CharacterType.BIOLOGY,
    mediaType: 'svg',
    mediaUrl: '/assets/svg/giraffe.svg',
    thumbnailUrl: '/assets/svg/giraffe.svg',
    svgContent: null,
    color: '#D97706',
    colorCustomizable: true,
    colorProperty: 'fill'
  }
];