# queryCharacters API 设置指南

## 概述

本文档描述了如何设置和使用 `queryCharacters` API，该API用于从Supabase数据库中查询角色数据。

## 前置条件

1. **安装 Supabase 客户端**:
   ```bash
   npm install @supabase/supabase-js
   ```

2. **Supabase 项目设置**:
   - 创建Supabase项目
   - 执行 `sql/database.sql` 中的建表语句
   - 执行 `sql/insert_sample_data.sql` 插入示例数据

3. **环境变量配置**:
   复制 `.env.example` 为 `.env.local` 并填入你的Supabase配置：
   ```bash
   cp .env.example .env.local
   ```

## API 端点

### GET /api/queryCharacters

查询角色数据。

#### 请求参数

| 参数 | 类型 | 必填 | 默认值 | 描述 |
|------|------|------|--------|------|
| type | string | 否 | 'all' | 角色类型：'generic', 'celebrity', 'object', 'biology', 'upload', 'all' |
| search | string | 否 | '' | 搜索关键词（按名称搜索） |
| limit | number | 否 | 50 | 每页返回数量 |
| offset | number | 否 | 0 | 偏移量（分页用） |

#### 响应格式

```typescript
interface QueryCharactersResponse {
  success: boolean;
  data?: Character[];
  total?: number;
  message?: string;
  error?: string;
}
```

#### 示例请求

```javascript
// 获取所有通用角色
fetch('/api/queryCharacters?type=generic&limit=10')

// 搜索名称包含"Elon"的角色
fetch('/api/queryCharacters?search=Elon')

// 获取第二页数据
fetch('/api/queryCharacters?limit=20&offset=20')
```

## 数据库模式

角色表(`characters`)包含以下字段：

- `id`: 唯一标识符
- `name`: 角色名称
- `height`: 身高（米）
- `type`: 角色类型
- `media_type`: 媒体类型（'svg' | 'image'）
- `media_url`: 主要媒体URL
- `thumbnail_url`: 缩略图URL
- `color`: 默认颜色
- `color_customizable`: 是否可自定义颜色
- `color_property`: 颜色属性名
- `is_active`: 是否激活
- `created_at`: 创建时间
- `updated_at`: 更新时间

## 错误处理

API具有自动降级功能：
1. 首先尝试从Supabase数据库查询
2. 如果数据库查询失败，自动降级到模拟数据
3. 确保前端始终能够获得数据

## 类型定义

相关的TypeScript类型定义位于：
- `/components/Characters.ts` - 前端Character接口
- `/lib/types.ts` - 数据库和API相关类型
- `/components/api/characterService.ts` - API服务函数

## 部署注意事项

1. 确保环境变量正确配置
2. 确保Supabase数据库已正确设置
3. 确保服务角色密钥具有适当的权限
4. 考虑添加适当的缓存策略以提高性能