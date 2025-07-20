import { createClient } from '@supabase/supabase-js';

// 从环境变量获取Supabase配置
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// 创建Supabase管理员客户端，用于服务端操作
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

// 数据库表名
export const TABLES = {
  CHARACTERS: 'characters'
} as const;