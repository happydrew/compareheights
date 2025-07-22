// 角色姓名生成器 - 为通用角色随机生成个性化姓名

export interface NameLibrary {
  [key: string]: string[];
}

// 各类角色的姓名库，每类10个姓名（匹配实际角色ID格式）
export const CHARACTER_NAMES: NameLibrary = {
  // 成年男性 (generic-male)
  'generic-genman': [
    'Alex Chen', 'David Wilson', 'Michael Brown', 'James Taylor', 'Robert Davis',
    'William Garcia', 'John Martinez', 'Thomas Anderson', 'Christopher Lee', 'Daniel White'
  ],

  'generic-man': [
    'Alex Chen', 'David Wilson', 'Michael Brown', 'James Taylor', 'Robert Davis',
    'William Garcia', 'John Martinez', 'Thomas Anderson', 'Christopher Lee', 'Daniel White'
  ],

  // 成年女性 (generic-female)
  'generic-genwoman': [
    'Emily Johnson', 'Sarah Miller', 'Jessica Davis', 'Ashley Wilson', 'Amanda Brown',
    'Jennifer Garcia', 'Lisa Martinez', 'Michelle Taylor', 'Stephanie Lee', 'Nicole White'
  ],

  'generic-woman': [
    'Emily Johnson', 'Sarah Miller', 'Jessica Davis', 'Ashley Wilson', 'Amanda Brown',
    'Jennifer Garcia', 'Lisa Martinez', 'Michelle Taylor', 'Stephanie Lee', 'Nicole White'
  ],

  // 儿童 (generic-child) - 可以是男孩或女孩
  'generic-child': [
    'Tyler Smith', 'Emma Chen', 'Brandon Wilson', 'Olivia Brown', 'Justin Taylor',
    'Ava Davis', 'Kevin Garcia', 'Sophia Martinez', 'Ryan Anderson', 'Mia Lee'
  ],

  // 老年男性
  'generic-oldman': [
    'George Thompson', 'Frank Miller', 'Henry Davis', 'Walter Wilson', 'Arthur Brown',
    'Harold Garcia', 'Ralph Martinez', 'Albert Taylor', 'Eugene Anderson', 'Ernest Lee'
  ],

  // 老年女性
  'generic-oldwoman': [
    'Dorothy Johnson', 'Betty Miller', 'Helen Davis', 'Margaret Wilson', 'Ruth Brown',
    'Frances Garcia', 'Joan Martinez', 'Mary Taylor', 'Patricia Anderson', 'Barbara Lee'
  ],

  // 婴儿/幼儿（性别中性）
  'generic-baby': [
    'Baby Alex', 'Baby Sam', 'Baby Jordan', 'Baby Taylor', 'Baby Casey',
    'Baby Riley', 'Baby Avery', 'Baby Quinn', 'Baby Morgan', 'Baby Blake'
  ],

  // 青少年男性
  'generic-boy': [
    'Jake Thompson', 'Noah Miller', 'Ethan Davis', 'Lucas Wilson', 'Mason Brown',
    'Logan Garcia', 'Jackson Martinez', 'Aiden Taylor', 'Carter Anderson', 'Owen Lee'
  ],

  // 青少年女性
  'generic-girl': [
    'Chloe Johnson', 'Madison Miller', 'Abigail Davis', 'Grace Wilson', 'Lily Brown',
    'Zoe Garcia', 'Natalie Martinez', 'Hannah Taylor', 'Samantha Anderson', 'Ella Lee'
  ],

  // 通用人物（不分性别年龄）
  'generic-person': [
    'Jordan Smith', 'Taylor Johnson', 'Casey Brown', 'Riley Wilson', 'Morgan Davis',
    'Avery Garcia', 'Quinn Martinez', 'Blake Anderson', 'Cameron Lee', 'Drew White'
  ]
};

// 根据角色ID生成随机姓名
export const generateRandomName = (characterId: string, originalName: string): string => {
  // 如果不是通用角色，返回原名称
  if (!characterId.startsWith('generic-')) {
    return originalName;
  }

  // 移除数字后缀，获取基础角色类型
  const baseType = characterId.replace(/-\d+$/, '');

  // 获取对应的姓名库
  const nameList = CHARACTER_NAMES[baseType];

  if (!nameList || nameList.length === 0) {
    // 如果没找到对应姓名库，返回原名称
    console.log(`No name library found for baseType: ${baseType}, returning original name: ${originalName}`);
    return originalName;
  }

  // 随机选择一个姓名
  const randomIndex = Math.floor(Math.random() * nameList.length);
  const randomName = nameList[randomIndex];

  console.log(`Generated random name for ${characterId} (${baseType}): ${randomName}`);
  return randomName;
};

// 根据角色类型检查是否需要生成随机姓名
export const shouldGenerateRandomName = (characterId: string): boolean => {
  return characterId.startsWith('generic-') && CHARACTER_NAMES[characterId.replace(/-\d+$/, '')] !== undefined;
};

// 获取角色类型的可用姓名数量
export const getNamePoolSize = (characterId: string): number => {
  const baseType = characterId.replace(/-\d+$/, '');
  const nameList = CHARACTER_NAMES[baseType];
  return nameList ? nameList.length : 0;
};

export default CHARACTER_NAMES;