// 角色姓名生成器 - 为通用角色随机生成个性化姓名

export interface NameLibrary {
  [key: string]: string[];
}

// 各类角色的姓名库，每类10个姓名（匹配实际角色ID格式）
export const CHARACTER_NAMES: NameLibrary = {
  // 成年男性 (generic-male)
  'generic-genman': [
    'Alex', 'David', 'Michael', 'James', 'Robert',
    'William', 'John', 'Thomas', 'Christopher', 'Daniel'
  ],

  'generic-man': [
    'Alex', 'David', 'Michael', 'James', 'Robert',
    'William', 'John', 'Thomas', 'Christopher', 'Daniel'
  ],

  // 成年女性 (generic-female)
  'generic-genwoman': [
    'Emily', 'Sarah', 'Jessica', 'Ashley', 'Amanda',
    'Jennifer', 'Lisa', 'Michelle', 'Stephanie', 'Nicole'
  ],

  'generic-woman': [
    'Emily', 'Sarah', 'Jessica', 'Ashley', 'Amanda',
    'Jennifer', 'Lisa', 'Michelle', 'Stephanie', 'Nicole'
  ],

  // 儿童 (generic-child) - 可以是男孩或女孩
  'generic-child': [
    'Tyler', 'Emma', 'Brandon', 'Olivia', 'Justin',
    'Ava', 'Kevin', 'Sophia', 'Ryan', 'Mia'
  ],

  // 老年男性
  'generic-oldman': [
    'George', 'Frank', 'Henry', 'Walter', 'Arthur',
    'Harold', 'Ralph', 'Albert', 'Eugene', 'Ernest'
  ],

  // 老年女性
  'generic-oldwoman': [
    'Dorothy', 'Betty', 'Helen', 'Margaret', 'Ruth',
    'Frances', 'Joan', 'Mary', 'Patricia', 'Barbara'
  ],

  // 婴儿/幼儿（性别中性）
  'generic-baby': [
    'Baby', 'Sweetie', 'Pumpkin', 'Angel', 'Bunny',
    'Princess', 'Sugarplum', 'Lulu', 'Daisy', 'Buddy'
  ],

  // 青少年男性
  'generic-boy': [
    'Jake', 'Noah', 'Ethan', 'Lucas', 'Mason',
    'Logan', 'Jackson', 'Aiden', 'Carter', 'Owen'
  ],

  // 青少年女性
  'generic-girl': [
    'Chloe', 'Madison', 'Abigail', 'Grace', 'Lily',
    'Zoe', 'Natalie', 'Hannah', 'Samantha', 'Ella'
  ],

  // 通用人物（不分性别年龄）
  'generic-person': [
    'Jordan', 'Taylor', 'Casey', 'Riley', 'Morgan',
    'Avery', 'Quinn', 'Blake', 'Cameron', 'Drew'
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