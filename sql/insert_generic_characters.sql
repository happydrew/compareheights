-- 插入generic类型的角色数据
-- 基于权威身高数据和SVG文件

-- 清空现有generic角色数据（可选）
-- DELETE FROM characters WHERE type = 'generic';

-- 成年男性角色 (平均身高1.75米)
INSERT INTO characters (id, name, height, type, media_type, media_url, thumbnail_url, color, color_customizable, color_property) VALUES
('man-1', 'Man 1', 1.75, 'generic', 'svg', 'https://raw.githubusercontent.com/happydrew/compareheights-characters/refs/heads/main/generic/man1.svg', 'https://raw.githubusercontent.com/happydrew/compareheights-characters/refs/heads/main/generic/man1.svg', '#3B82F6', false, 'fill'),
('man-2', 'Man 2', 1.75, 'generic', 'svg', 'https://raw.githubusercontent.com/happydrew/compareheights-characters/refs/heads/main/generic/man2.svg', 'https://raw.githubusercontent.com/happydrew/compareheights-characters/refs/heads/main/generic/man2.svg', '#3B82F6', false, 'fill'),
('man-3', 'Man 3', 1.75, 'generic', 'svg', 'https://raw.githubusercontent.com/happydrew/compareheights-characters/refs/heads/main/generic/man3.svg', 'https://raw.githubusercontent.com/happydrew/compareheights-characters/refs/heads/main/generic/man3.svg', '#3B82F6', false, 'fill'),
('man-4', 'Man 4', 1.75, 'generic', 'svg', 'https://raw.githubusercontent.com/happydrew/compareheights-characters/refs/heads/main/generic/man4.svg', 'https://raw.githubusercontent.com/happydrew/compareheights-characters/refs/heads/main/generic/man4.svg', '#3B82F6', false, 'fill'),
('man-5', 'Man 5', 1.75, 'generic', 'svg', 'https://raw.githubusercontent.com/happydrew/compareheights-characters/refs/heads/main/generic/man5.svg', 'https://raw.githubusercontent.com/happydrew/compareheights-characters/refs/heads/main/generic/man5.svg', '#3B82F6', false, 'fill'),
('man-6', 'Man 6', 1.75, 'generic', 'svg', 'https://raw.githubusercontent.com/happydrew/compareheights-characters/refs/heads/main/generic/man6.svg', 'https://raw.githubusercontent.com/happydrew/compareheights-characters/refs/heads/main/generic/man6.svg', '#3B82F6', false, 'fill'),
('man-7', 'Man 7', 1.75, 'generic', 'svg', 'https://raw.githubusercontent.com/happydrew/compareheights-characters/refs/heads/main/generic/man7.svg', 'https://raw.githubusercontent.com/happydrew/compareheights-characters/refs/heads/main/generic/man7.svg', '#3B82F6', false, 'fill'),
('man-8', 'Man 8', 1.75, 'generic', 'svg', 'https://raw.githubusercontent.com/happydrew/compareheights-characters/refs/heads/main/generic/man8.svg', 'https://raw.githubusercontent.com/happydrew/compareheights-characters/refs/heads/main/generic/man8.svg', '#3B82F6', false, 'fill');

-- 成年女性角色 (平均身高1.62米)  
INSERT INTO characters (id, name, height, type, media_type, media_url, thumbnail_url, color, color_customizable, color_property) VALUES
('woman-1', 'Woman 1', 1.62, 'generic', 'svg', '/assets/svg/woman1.svg', '/assets/svg/woman1.svg', '#EC4899', false, 'fill'),
('woman-2', 'Woman 2', 1.62, 'generic', 'svg', '/assets/svg/woman2.svg', '/assets/svg/woman2.svg', '#EC4899', false, 'fill'),
('woman-3', 'Woman 3', 1.62, 'generic', 'svg', '/assets/svg/woman3.svg', '/assets/svg/woman3.svg', '#EC4899', false, 'fill'),
('woman-4', 'Woman 4', 1.62, 'generic', 'svg', '/assets/svg/woman4.svg', '/assets/svg/woman4.svg', '#EC4899', false, 'fill'),
('woman-5', 'Woman 5', 1.62, 'generic', 'svg', '/assets/svg/woman5.svg', '/assets/svg/woman5.svg', '#EC4899', false, 'fill'),
('woman-6', 'Woman 6', 1.62, 'generic', 'svg', '/assets/svg/woman6.svg', '/assets/svg/woman6.svg', '#EC4899', false, 'fill'),
('woman-7', 'Woman 7', 1.62, 'generic', 'svg', '/assets/svg/woman7.svg', '/assets/svg/woman7.svg', '#EC4899', false, 'fill');

-- 12岁男孩角色 (平均身高1.50米)
INSERT INTO characters (id, name, height, type, media_type, media_url, thumbnail_url, color, color_customizable, color_property) VALUES
('boy-1', 'Boy 1', 1.50, 'generic', 'svg', '/assets/svg/boy1.svg', '/assets/svg/boy1.svg', '#10B981', false, 'fill'),
('boy-2', 'Boy 2', 1.50, 'generic', 'svg', '/assets/svg/boy2.svg', '/assets/svg/boy2.svg', '#10B981', false, 'fill'),
('boy-3', 'Boy 3', 1.50, 'generic', 'svg', '/assets/svg/boy3.svg', '/assets/svg/boy3.svg', '#10B981', false, 'fill'),
('boy-4', 'Boy 4', 1.50, 'generic', 'svg', '/assets/svg/boy4.svg', '/assets/svg/boy4.svg', '#10B981', false, 'fill'),
('boy-5', 'Boy 5', 1.50, 'generic', 'svg', '/assets/svg/boy5.svg', '/assets/svg/boy5.svg', '#10B981', false, 'fill'),
('boy-6', 'Boy 6', 1.50, 'generic', 'svg', '/assets/svg/boy6.svg', '/assets/svg/boy6.svg', '#10B981', false, 'fill'),
('boy-7', 'Boy 7', 1.50, 'generic', 'svg', '/assets/svg/boy7.svg', '/assets/svg/boy7.svg', '#10B981', false, 'fill'),
('boy-8', 'Boy 8', 1.50, 'generic', 'svg', '/assets/svg/boy8.svg', '/assets/svg/boy8.svg', '#10B981', false, 'fill'),
('boy-9', 'Boy 9', 1.50, 'generic', 'svg', '/assets/svg/boy9.svg', '/assets/svg/boy9.svg', '#10B981', false, 'fill'),
('boy-10', 'Boy 10', 1.50, 'generic', 'svg', '/assets/svg/boy10.svg', '/assets/svg/boy10.svg', '#10B981', false, 'fill'),
('boy-11', 'Boy 11', 1.50, 'generic', 'svg', '/assets/svg/boy11.svg', '/assets/svg/boy11.svg', '#10B981', false, 'fill'),
('boy-12', 'Boy 12', 1.50, 'generic', 'svg', '/assets/svg/boy12.svg', '/assets/svg/boy12.svg', '#10B981', false, 'fill'),
('boy-13', 'Boy 13', 1.50, 'generic', 'svg', '/assets/svg/boy13.svg', '/assets/svg/boy13.svg', '#10B981', false, 'fill'),
('boy-14', 'Boy 14', 1.50, 'generic', 'svg', '/assets/svg/boy14.svg', '/assets/svg/boy14.svg', '#10B981', false, 'fill'),
('boy-15', 'Boy 15', 1.50, 'generic', 'svg', '/assets/svg/boy15.svg', '/assets/svg/boy15.svg', '#10B981', false, 'fill'),
('boy-16', 'Boy 16', 1.50, 'generic', 'svg', '/assets/svg/boy16.svg', '/assets/svg/boy16.svg', '#10B981', false, 'fill'),
('boy-17', 'Boy 17', 1.50, 'generic', 'svg', '/assets/svg/boy17.svg', '/assets/svg/boy17.svg', '#10B981', false, 'fill'),
('boy-18', 'Boy 18', 1.50, 'generic', 'svg', '/assets/svg/boy18.svg', '/assets/svg/boy18.svg', '#10B981', false, 'fill');

-- 12岁女孩角色 (平均身高1.51米)
INSERT INTO characters (id, name, height, type, media_type, media_url, thumbnail_url, color, color_customizable, color_property) VALUES
('girl-1', 'Girl 1', 1.51, 'generic', 'svg', '/assets/svg/girl1.svg', '/assets/svg/girl1.svg', '#F59E0B', false, 'fill'),
('girl-2', 'Girl 2', 1.51, 'generic', 'svg', '/assets/svg/girl2.svg', '/assets/svg/girl2.svg', '#F59E0B', false, 'fill'),
('girl-3', 'Girl 3', 1.51, 'generic', 'svg', '/assets/svg/girl3.svg', '/assets/svg/girl3.svg', '#F59E0B', false, 'fill'),
('girl-4', 'Girl 4', 1.51, 'generic', 'svg', '/assets/svg/girl4.svg', '/assets/svg/girl4.svg', '#F59E0B', false, 'fill'),
('girl-5', 'Girl 5', 1.51, 'generic', 'svg', '/assets/svg/girl5.svg', '/assets/svg/girl5.svg', '#F59E0B', false, 'fill'),
('girl-6', 'Girl 6', 1.51, 'generic', 'svg', '/assets/svg/girl6.svg', '/assets/svg/girl6.svg', '#F59E0B', false, 'fill'),
('girl-7', 'Girl 7', 1.51, 'generic', 'svg', '/assets/svg/girl7.svg', '/assets/svg/girl7.svg', '#F59E0B', false, 'fill'),
('girl-8', 'Girl 8', 1.51, 'generic', 'svg', '/assets/svg/girl8.svg', '/assets/svg/girl8.svg', '#F59E0B', false, 'fill'),
('girl-9', 'Girl 9', 1.51, 'generic', 'svg', '/assets/svg/girl9.svg', '/assets/svg/girl9.svg', '#F59E0B', false, 'fill'),
('girl-10', 'Girl 10', 1.51, 'generic', 'svg', '/assets/svg/girl10.svg', '/assets/svg/girl10.svg', '#F59E0B', false, 'fill'),
('girl-11', 'Girl 11', 1.51, 'generic', 'svg', '/assets/svg/girl11.svg', '/assets/svg/girl11.svg', '#F59E0B', false, 'fill'),
('girl-12', 'Girl 12', 1.51, 'generic', 'svg', '/assets/svg/girl12.svg', '/assets/svg/girl12.svg', '#F59E0B', false, 'fill'),
('girl-13', 'Girl 13', 1.51, 'generic', 'svg', '/assets/svg/girl13.svg', '/assets/svg/girl13.svg', '#F59E0B', false, 'fill'),
('girl-14', 'Girl 14', 1.51, 'generic', 'svg', '/assets/svg/girl14.svg', '/assets/svg/girl14.svg', '#F59E0B', false, 'fill'),
('girl-15', 'Girl 15', 1.51, 'generic', 'svg', '/assets/svg/girl15.svg', '/assets/svg/girl15.svg', '#F59E0B', false, 'fill'),
('girl-16', 'Girl 16', 1.51, 'generic', 'svg', '/assets/svg/girl16.svg', '/assets/svg/girl16.svg', '#F59E0B', false, 'fill'),
('girl-17', 'Girl 17', 1.51, 'generic', 'svg', '/assets/svg/girl17.svg', '/assets/svg/girl17.svg', '#F59E0B', false, 'fill'),
('girl-18', 'Girl 18', 1.51, 'generic', 'svg', '/assets/svg/girl18.svg', '/assets/svg/girl18.svg', '#F59E0B', false, 'fill');

-- 老年男性角色 (平均身高1.68米)
INSERT INTO characters (id, name, height, type, media_type, media_url, thumbnail_url, color, color_customizable, color_property) VALUES
('oldman-1', 'Old Man 1', 1.68, 'generic', 'svg', '/assets/svg/oldman1.svg', '/assets/svg/oldman1.svg', '#6B7280', false, 'fill'),
('oldman-2', 'Old Man 2', 1.68, 'generic', 'svg', '/assets/svg/oldman2.svg', '/assets/svg/oldman2.svg', '#6B7280', false, 'fill'),
('oldman-3', 'Old Man 3', 1.68, 'generic', 'svg', '/assets/svg/oldman3.svg', '/assets/svg/oldman3.svg', '#6B7280', false, 'fill'),
('oldman-4', 'Old Man 4', 1.68, 'generic', 'svg', '/assets/svg/oldman4.svg', '/assets/svg/oldman4.svg', '#6B7280', false, 'fill'),
('oldman-5', 'Old Man 5', 1.68, 'generic', 'svg', '/assets/svg/oldman5.svg', '/assets/svg/oldman5.svg', '#6B7280', false, 'fill');

-- 老年女性角色 (平均身高1.58米)
INSERT INTO characters (id, name, height, type, media_type, media_url, thumbnail_url, color, color_customizable, color_property) VALUES
('oldwoman-1', 'Old Woman 1', 1.58, 'generic', 'svg', '/assets/svg/oldwoman1.svg', '/assets/svg/oldwoman1.svg', '#9CA3AF', false, 'fill'),
('oldwoman-2', 'Old Woman 2', 1.58, 'generic', 'svg', '/assets/svg/oldwoman2.svg', '/assets/svg/oldwoman2.svg', '#9CA3AF', false, 'fill'),
('oldwoman-3', 'Old Woman 3', 1.58, 'generic', 'svg', '/assets/svg/oldwoman3.svg', '/assets/svg/oldwoman3.svg', '#9CA3AF', false, 'fill'),
('oldwoman-4', 'Old Woman 4', 1.58, 'generic', 'svg', '/assets/svg/oldwoman4.svg', '/assets/svg/oldwoman4.svg', '#9CA3AF', false, 'fill'),
('oldwoman-5', 'Old Woman 5', 1.58, 'generic', 'svg', '/assets/svg/oldwoman5.svg', '/assets/svg/oldwoman5.svg', '#9CA3AF', false, 'fill'),
('oldwoman-6', 'Old Woman 6', 1.58, 'generic', 'svg', '/assets/svg/oldwoman6.svg', '/assets/svg/oldwoman6.svg', '#9CA3AF', false, 'fill');

-- 可自定义颜色的成年男性角色 (genman系列)
INSERT INTO characters (id, name, height, type, media_type, media_url, thumbnail_url, color, color_customizable, color_property) VALUES
('genman-1', 'Generic Man 1', 1.75, 'generic', 'svg', '/assets/svg/genman1.svg', '/assets/svg/genman1.svg', '#3B82F6', true, 'fill'),
('genman-2', 'Generic Man 2', 1.75, 'generic', 'svg', '/assets/svg/genman2.svg', '/assets/svg/genman2.svg', '#3B82F6', true, 'fill'),
('genman-3', 'Generic Man 3', 1.75, 'generic', 'svg', '/assets/svg/genman3.svg', '/assets/svg/genman3.svg', '#3B82F6', true, 'fill'),
('genman-4', 'Generic Man 4', 1.75, 'generic', 'svg', '/assets/svg/genman4.svg', '/assets/svg/genman4.svg', '#3B82F6', true, 'fill'),
('genman-5', 'Generic Man 5', 1.75, 'generic', 'svg', '/assets/svg/genman5.svg', '/assets/svg/genman5.svg', '#3B82F6', true, 'fill'),
('genman-6', 'Generic Man 6', 1.75, 'generic', 'svg', '/assets/svg/genman6.svg', '/assets/svg/genman6.svg', '#3B82F6', true, 'fill'),
('genman-7', 'Generic Man 7', 1.75, 'generic', 'svg', '/assets/svg/genman7.svg', '/assets/svg/genman7.svg', '#3B82F6', true, 'fill'),
('genman-8', 'Generic Man 8', 1.75, 'generic', 'svg', '/assets/svg/genman8.svg', '/assets/svg/genman8.svg', '#3B82F6', true, 'fill');

-- 可自定义颜色的成年女性角色 (genwoman系列)
INSERT INTO characters (id, name, height, type, media_type, media_url, thumbnail_url, color, color_customizable, color_property) VALUES
('genwoman-1', 'Generic Woman 1', 1.62, 'generic', 'svg', '/assets/svg/genwoman1.svg', '/assets/svg/genwoman1.svg', '#EC4899', true, 'fill'),
('genwoman-2', 'Generic Woman 2', 1.62, 'generic', 'svg', '/assets/svg/genwoman2.svg', '/assets/svg/genwoman2.svg', '#EC4899', true, 'fill'),
('genwoman-3', 'Generic Woman 3', 1.62, 'generic', 'svg', '/assets/svg/genwoman3.svg', '/assets/svg/genwoman3.svg', '#EC4899', true, 'fill'),
('genwoman-4', 'Generic Woman 4', 1.62, 'generic', 'svg', '/assets/svg/genwoman4.svg', '/assets/svg/genwoman4.svg', '#EC4899', true, 'fill'),
('genwoman-5', 'Generic Woman 5', 1.62, 'generic', 'svg', '/assets/svg/genwoman5.svg', '/assets/svg/genwoman5.svg', '#EC4899', true, 'fill'),
('genwoman-6', 'Generic Woman 6', 1.62, 'generic', 'svg', '/assets/svg/genwoman6.svg', '/assets/svg/genwoman6.svg', '#EC4899', true, 'fill'),
('genwoman-7', 'Generic Woman 7', 1.62, 'generic', 'svg', '/assets/svg/genwoman7.svg', '/assets/svg/genwoman7.svg', '#EC4899', true, 'fill'),
('genwoman-8', 'Generic Woman 8', 1.62, 'generic', 'svg', '/assets/svg/genwoman8.svg', '/assets/svg/genwoman8.svg', '#EC4899', true, 'fill');

-- 检查插入结果
SELECT 
    type, 
    COUNT(*) as count,
    AVG(height) as avg_height,
    MIN(height) as min_height,
    MAX(height) as max_height
FROM characters 
WHERE type = 'generic'
GROUP BY type;

-- 显示所有generic角色
SELECT id, name, height, color_customizable FROM characters WHERE type = 'generic' ORDER BY height, name;