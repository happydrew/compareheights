// 数据库相关类型定义

// 数据库中的角色记录结构
export interface DatabaseCharacter {
  id: string;
  name: string;
  height: number;
  type: string;
  media_type: 'svg' | 'image';
  media_url: string;
  thumbnail_url: string;
  color: string | null;
  color_customizable: boolean;
  color_property: string | null;
  order: number;
}

// API查询参数
export interface CharacterQueryParams {
  type?: string;
  search?: string;
  limit?: number;
  offset?: number;
}

// API响应结构
export interface CharacterQueryResponse {
  success: boolean;
  data?: any[];
  total?: number;
  message?: string;
  error?: string;
}