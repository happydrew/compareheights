-- 角色数据表
CREATE TABLE public.characters (
  id TEXT PRIMARY KEY,                    -- 角色唯一标识符
  name TEXT NOT NULL,                     -- 角色名称
  height DOUBLE PRECISION NOT NULL,       -- 身高（单位：米，使用双精度浮点数支持极大极小值）
  type TEXT NOT NULL,                     -- 角色类型：generic/celebrity/object/biology

  -- 媒体相关字段
  media_type TEXT NOT NULL CHECK (media_type IN ('svg', 'image')), -- 媒体类型：svg或image
  media_url TEXT NOT NULL,                -- 主要图片/SVG的URL
  thumbnail_url TEXT NOT NULL,            -- 缩略图URL（用于角色库展示）

  -- 外观相关字段
  color TEXT,                            -- 默认颜色（HEX格式，如#3B82F6）
  color_customizable BOOLEAN NOT NULL DEFAULT false, -- 是否支持自定义颜色
  color_property TEXT,                   -- SVG中需要修改颜色的属性名（如fill,stroke）

  -- 时间戳
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()   -- 创建时间
);

-- 为订单表启用RLS
ALTER TABLE public.characters ENABLE ROW LEVEL SECURITY;

-- RLS策略：只允许 service_role 用户访问订单表
CREATE POLICY "Admins can manage all characters"
  ON public.characters
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

COMMENT ON TABLE public.characters IS '角色数据表，存储身高比较工具中的角色信息，支持从夸克尺度到宇宙尺度';

-- 字段注释
COMMENT ON COLUMN public.characters.id IS '角色唯一标识符';
COMMENT ON COLUMN public.characters.name IS '角色名称';
COMMENT ON COLUMN public.characters.height IS '身高，单位为米，使用DOUBLE PRECISION支持从夸克(~10^-18m)到宇宙(~10^26m)尺度';
COMMENT ON COLUMN public.characters.type IS '角色类型：generic(通用角色)/celebrity(名人)/object(物体)/biology(生物)/upload(上传图片)';
COMMENT ON COLUMN public.characters.media_type IS '媒体类型：svg(矢量图)或image(位图)';
COMMENT ON COLUMN public.characters.media_url IS '主要图片或SVG文件的URL地址';
COMMENT ON COLUMN public.characters.thumbnail_url IS '缩略图URL，用于角色库列表展示';
COMMENT ON COLUMN public.characters.color IS '默认颜色，HEX格式(如#3B82F6)，SVG角色可自定义';
COMMENT ON COLUMN public.characters.color_customizable IS '是否支持自定义颜色，主要用于SVG角色';
COMMENT ON COLUMN public.characters.color_property IS 'SVG中需要修改颜色的属性名，多个属性用逗号分隔(如fill,stroke)';
COMMENT ON COLUMN public.characters.created_at IS '记录创建时间';

-- 创建索引
CREATE INDEX idx_characters_type ON public.characters(type);
CREATE INDEX idx_characters_name ON public.characters(name);
CREATE INDEX idx_characters_height ON public.characters(height);

-- 为LIKE查询优化的索引 (支持前缀匹配)
CREATE INDEX idx_characters_name_pattern ON public.characters(name text_pattern_ops);

