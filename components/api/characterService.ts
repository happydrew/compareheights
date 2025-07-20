import { Character, CharacterType } from '../Characters';

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
const API_BASE_URL = '/api';

// 模拟API响应数据 - 匹配数据库schema结构
const MOCK_CHARACTERS: Character[] = [
  {
    id: 'generic-male-1',
    name: 'Male 1',
    height: 1.75,
    type: CharacterType.GENERIC,
    description: 'Generic male character',
    mediaType: 'svg',
    mediaUrl: '/assets/svg/man1.svg',
    thumbnailUrl: '/assets/svg/man1.svg',
    svgContent: null,
    color: '#3B82F6',
    colorCustomizable: false,
    colorProperty: 'fill',
    isCustom: false,
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  },
  {
    id: 'generic-female-1',
    name: 'Female 1',
    height: 1.65,
    type: CharacterType.GENERIC,
    description: 'Generic female character',
    mediaType: 'svg',
    mediaUrl: '/assets/svg/woman1.svg',
    thumbnailUrl: '/assets/svg/woman1.svg',
    svgContent: null,
    color: '#EC4899',
    colorCustomizable: false,
    colorProperty: 'fill',
    isCustom: false,
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  },
  {
    id: 'celebrity-musk',
    name: 'Elon Musk',
    height: 1.88,
    type: CharacterType.CELEBRITY,
    description: 'CEO of Tesla and SpaceX',
    mediaType: 'image',
    mediaUrl: '/assets/images/original-3.webp',
    thumbnailUrl: '/assets/images/original-3.webp',
    color: '#1F2937',
    colorCustomizable: false,
    isCustom: false,
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  },
  {
    id: 'celebrity-gates',
    name: 'Bill Gates',
    height: 1.77,
    type: CharacterType.CELEBRITY,
    description: 'Co-founder of Microsoft',
    mediaType: 'image',
    mediaUrl: '/assets/images/original-4.webp',
    thumbnailUrl: '/assets/images/original-4.webp',
    color: '#374151',
    colorCustomizable: false,
    isCustom: false,
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  },
  {
    id: 'celebrity-ronaldo',
    name: 'Cristiano Ronaldo',
    height: 1.87,
    type: CharacterType.CELEBRITY,
    description: 'Portuguese football player',
    mediaType: 'image',
    mediaUrl: '/assets/images/original-1.webp',
    thumbnailUrl: '/assets/images/original-1.webp',
    color: '#EF4444',
    colorCustomizable: false,
    isCustom: false,
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  },
  {
    id: 'generic-child-1',
    name: 'Child 1',
    height: 1.2,
    type: CharacterType.GENERIC,
    description: 'Generic child character',
    mediaType: 'svg',
    mediaUrl: '/assets/svg/boy1.svg',
    thumbnailUrl: '/assets/svg/boy1.svg',
    svgContent: null,
    color: '#F59E0B',
    colorCustomizable: false,
    colorProperty: 'fill',
    isCustom: false,
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  },
  {
    id: 'celebrity-yaoming',
    name: 'Yao Ming',
    height: 2.26,
    type: CharacterType.CELEBRITY,
    description: 'Chinese basketball player',
    mediaType: 'image',
    mediaUrl: '/assets/images/original-2.webp',
    thumbnailUrl: '/assets/images/original-2.webp',
    color: '#8B5CF6',
    colorCustomizable: false,
    isCustom: false,
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  },
  {
    id: 'object-eiffel',
    name: 'Eiffel Tower',
    height: 324,
    type: CharacterType.OBJECT,
    description: 'Famous landmark in Paris, France',
    mediaType: 'svg',
    mediaUrl: '/assets/svg/eiffel-tower.svg',
    thumbnailUrl: '/assets/svg/eiffel-tower.svg',
    svgContent: null,
    color: '#6B7280',
    colorCustomizable: true,
    colorProperty: 'fill',
    isCustom: false,
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  },
  {
    id: 'bio-giraffe',
    name: 'Giraffe',
    height: 5.5,
    type: CharacterType.BIOLOGY,
    description: 'World\'s tallest land animal',
    mediaType: 'svg',
    mediaUrl: '/assets/svg/giraffe.svg',
    thumbnailUrl: '/assets/svg/giraffe.svg',
    svgContent: null,
    color: '#D97706',
    colorCustomizable: true,
    colorProperty: 'fill',
    isCustom: false,
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  }
];

// 模拟API延迟
const simulateApiDelay = (ms: number = 800) => new Promise(resolve => setTimeout(resolve, ms));

// 使用模拟数据实现queryCharacters
const queryCharactersMock = async (params: QueryCharactersParams = {}): Promise<QueryCharactersResponse> => {

  await simulateApiDelay();

  if (Math.random() < 0.33) {
    return {
      success: false,
    }
  }
  const {
    type = 'all',
    limit = 50,
    offset = 0,
    search = ''
  } = params;

  let filteredCharacters = MOCK_CHARACTERS.filter(char => char.isActive);

  // 按类型过滤
  if (type !== 'all') {
    filteredCharacters = filteredCharacters.filter(char => char.type === type);
  }

  // 按搜索词过滤
  if (search) {
    const searchLower = search.toLowerCase();
    filteredCharacters = filteredCharacters.filter(char =>
      char.name.toLowerCase().includes(searchLower) ||
      char.description?.toLowerCase().includes(searchLower)
    );
  }

  // 分页
  const total = filteredCharacters.length;
  const paginatedCharacters = filteredCharacters.slice(offset, offset + limit);

  return {
    success: true,
    data: paginatedCharacters,
    total,
    message: 'Characters retrieved successfully'
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

  const url = `${API_BASE_URL}/queryCharacters?${queryParams.toString()}`;

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
    throw new Error('Failed to fetch characters from API');
  }
};

// 主要导出函数 - 使用真实API，有fallback到模拟数据
export const queryCharacters = async (params: QueryCharactersParams = {}): Promise<QueryCharactersResponse> => {
  try {
    // 首先尝试调用真实API
    return await queryCharactersApi(params);
  } catch (error) {
    console.warn('API call failed, falling back to mock data:', error);
    // 如果API调用失败，降级到模拟数据
    return queryCharactersMock(params);
  }
};

// 导出类型定义，供其他文件使用
export type { QueryCharactersParams, QueryCharactersResponse };