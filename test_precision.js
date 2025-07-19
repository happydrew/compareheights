// 测试极端尺寸的精度
const quarkSize = 0.0000000000001; // 10^-13 cm
const universeSize = 8.7e+28; // 宇宙大小 cm
const ratio = universeSize / quarkSize;

console.log('夸克大小:', quarkSize);
console.log('宇宙大小:', universeSize);
console.log('尺寸比例:', ratio);
console.log('比例的科学计数法:', ratio.toExponential(2));

// 测试像素计算精度
const chartHeight = 400; // 像素
const pixelsPerCm = chartHeight / universeSize;
console.log('pixelsPerCm (宇宙尺度):', pixelsPerCm);
console.log('pixelsPerCm (科学计数法):', pixelsPerCm.toExponential(2));

const quarkPixels = quarkSize * pixelsPerCm;
console.log('夸克的像素高度:', quarkPixels);
console.log('夸克像素 (科学计数法):', quarkPixels.toExponential(2));

// 测试 Number 边界
console.log('JavaScript Number.MIN_VALUE:', Number.MIN_VALUE);
console.log('JavaScript Number.MAX_VALUE:', Number.MAX_VALUE);
console.log('Number.MAX_SAFE_INTEGER:', Number.MAX_SAFE_INTEGER);

// 测试精度损失
console.log('\n精度测试:');
console.log('1 + Number.EPSILON:', 1 + Number.EPSILON);
console.log('1 + Number.EPSILON/2:', 1 + Number.EPSILON/2);
console.log('Number.EPSILON:', Number.EPSILON);

// 测试极小数值运算
const smallNum1 = 1e-20;
const smallNum2 = 1e-21;
console.log('\n极小数值运算:');
console.log('1e-20 + 1e-21:', smallNum1 + smallNum2);
console.log('1e-20 - 1e-21:', smallNum1 - smallNum2);
console.log('1e-20 * 1e-21:', smallNum1 * smallNum2);
console.log('1e-20 / 1e-21:', smallNum1 / smallNum2);