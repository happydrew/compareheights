-- 角色数据表
CREATE TABLE characters (
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

  -- 状态字段
  is_active BOOLEAN NOT NULL DEFAULT true,  -- 是否激活状态

  -- 时间戳
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(), -- 创建时间
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()  -- 更新时间
)
COMMENT ON TABLE characters IS '角色数据表，存储身高比较工具中的角色信息，支持从夸克尺度到宇宙尺度';

-- 字段注释
COMMENT ON COLUMN characters.id IS '角色唯一标识符';
COMMENT ON COLUMN characters.name IS '角色名称';
COMMENT ON COLUMN characters.height IS '身高，单位为米，使用DOUBLE PRECISION支持从夸克(~10^-18m)到宇宙(~10^26m)尺度';
COMMENT ON COLUMN characters.type IS '角色类型：generic(通用角色)/celebrity(名人)/object(物体)/biology(生物)/upload(上传图片)';
COMMENT ON COLUMN characters.media_type IS '媒体类型：svg(矢量图)或image(位图)';
COMMENT ON COLUMN characters.media_url IS '主要图片或SVG文件的URL地址';
COMMENT ON COLUMN characters.thumbnail_url IS '缩略图URL，用于角色库列表展示';
COMMENT ON COLUMN characters.color IS '默认颜色，HEX格式(如#3B82F6)，SVG角色可自定义';
COMMENT ON COLUMN characters.color_customizable IS '是否支持自定义颜色，主要用于SVG角色';
COMMENT ON COLUMN characters.color_property IS 'SVG中需要修改颜色的属性名，多个属性用逗号分隔(如fill,stroke)';
COMMENT ON COLUMN characters.is_custom IS '是否为自定义角色';
COMMENT ON COLUMN characters.is_active IS '是否激活状态';
COMMENT ON COLUMN characters.created_at IS '记录创建时间';
COMMENT ON COLUMN characters.updated_at IS '记录最后更新时间';

-- 创建索引
CREATE INDEX idx_characters_type ON characters(type);
CREATE INDEX idx_characters_name ON characters(name);
CREATE INDEX idx_characters_height ON characters(height);
CREATE INDEX idx_characters_is_active ON characters(is_active);

-- 为LIKE查询优化的索引 (支持前缀匹配)
CREATE INDEX idx_characters_name_pattern ON characters(name text_pattern_ops);

-- 创建更新时间触发器
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_characters_updated_at
    BEFORE UPDATE ON characters
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();