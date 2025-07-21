-- 插入示例角色数据
-- 注意：在生产环境中，请确保已经创建了characters表

-- 清空现有数据（可选）
-- DELETE FROM characters;

-- 插入通用角色
INSERT INTO characters (id, name, height, type, media_type, media_url, thumbnail_url, color, color_customizable, color_property) VALUES
('generic-male-1', 'Male 1', 1.75, 'generic', 'svg', '/assets/svg/man1.svg', '/assets/svg/man1.svg', '#3B82F6', false, 'fill'),
('generic-female-1', 'Female 1', 1.65, 'generic', 'svg', '/assets/svg/woman1.svg', '/assets/svg/woman1.svg', '#EC4899', true, 'fill'),
('generic-child-1', 'Child 1', 1.2, 'generic', 'svg', '/assets/svg/boy1.svg', '/assets/svg/boy1.svg', '#F59E0B', true, 'fill'),
('generic-male-2', 'Male 2', 1.80, 'generic', 'svg', '/assets/svg/man2.svg', '/assets/svg/man2.svg', '#3B82F6', false, 'fill'),
('generic-female-2', 'Female 2', 1.68, 'generic', 'svg', '/assets/svg/woman2.svg', '/assets/svg/woman2.svg', '#EC4899', true, 'fill');

-- 插入名人角色
INSERT INTO characters (id, name, height, type, media_type, media_url, thumbnail_url, color, color_customizable, is_active) VALUES
('celebrity-musk', 'Elon Musk', 1.88, 'celebrity', 'image', '/assets/images/original-3.webp', '/assets/images/original-3.webp', '#1F2937', false),
('celebrity-gates', 'Bill Gates', 1.77, 'celebrity', 'image', '/assets/images/original-4.webp', '/assets/images/original-4.webp', '#374151', false),
('celebrity-ronaldo', 'Cristiano Ronaldo', 1.87, 'celebrity', 'image', '/assets/images/original-1.webp', '/assets/images/original-1.webp', '#EF4444', false),
('celebrity-yaoming', 'Yao Ming', 2.26, 'celebrity', 'image', '/assets/images/original-2.webp', '/assets/images/original-2.webp', '#8B5CF6', false);

-- 插入物体
INSERT INTO characters (id, name, height, type, media_type, media_url, thumbnail_url, color, color_customizable, color_property) VALUES
('object-eiffel', 'Eiffel Tower', 324, 'object', 'svg', '/assets/svg/eiffel-tower.svg', '/assets/svg/eiffel-tower.svg', '#6B7280', true, 'fill'),
('object-statue-liberty', 'Statue of Liberty', 93, 'object', 'svg', '/assets/svg/statue-liberty.svg', '/assets/svg/statue-liberty.svg', '#059669', true, 'fill'),
('object-big-ben', 'Big Ben', 96, 'object', 'svg', '/assets/svg/big-ben.svg', '/assets/svg/big-ben.svg', '#92400E', true, 'fill');

-- 插入生物
INSERT INTO characters (id, name, height, type, media_type, media_url, thumbnail_url, color, color_customizable, color_property) VALUES
('bio-giraffe', 'Giraffe', 5.5, 'biology', 'svg', '/assets/svg/giraffe.svg', '/assets/svg/giraffe.svg', '#D97706', true, 'fill'),
('bio-elephant', 'African Elephant', 4.0, 'biology', 'svg', '/assets/svg/elephant.svg', '/assets/svg/elephant.svg', '#6B7280', true, 'fill'),
('bio-blue-whale', 'Blue Whale', 30.0, 'biology', 'svg', '/assets/svg/blue-whale.svg', '/assets/svg/blue-whale.svg', '#3B82F6', true, 'fill'),
('bio-t-rex', 'Tyrannosaurus Rex', 12.0, 'biology', 'svg', '/assets/svg/t-rex.svg', '/assets/svg/t-rex.svg', '#059669', true, 'fill');

-- 检查插入结果
SELECT 
    type, 
    COUNT(*) as count,
    AVG(height) as avg_height,
    MIN(height) as min_height,
    MAX(height) as max_height
FROM characters 
GROUP BY type 
ORDER BY type;