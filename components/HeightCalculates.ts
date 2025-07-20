export {
    Unit, convertHeightSmart, convertHeightSmartImperial, Precision, formatNumber, getBestUnit,
    getImperialGridUnitLabel, convertHeightPrecision, convertHeightForGridImperial, convertHeight,
    UnitSystem, UNIT_CONVERSIONS
};

// 高精度数值处理类
// 注意：当前实现使用JavaScript的number类型，在极端尺寸跨度下可能有精度限制
// 测试范围：夸克(10^-13 cm) 到 宇宙(10^28 cm)，跨度约10^41
// JavaScript Number 精度：约15-17位有效数字，最大安全整数2^53-1
// 对于超过精度范围的极端计算，可能需要考虑使用decimal.js或big.js库
class Precision {
    private value: number;
    private precision: number;

    constructor(value: number | string, precision: number = 15) {
        this.value = typeof value === 'string' ? parseFloat(value) : value;
        this.precision = precision;
    }

    static from(value: number | string, precision?: number): Precision {
        return new Precision(value, precision);
    }

    multiply(other: number | Precision): Precision {
        const otherValue = other instanceof Precision ? other.value : other;
        return new Precision(this.value * otherValue, this.precision);
    }

    divide(other: number | Precision): Precision {
        const otherValue = other instanceof Precision ? other.value : other;
        return new Precision(this.value / otherValue, this.precision);
    }

    add(other: number | Precision): Precision {
        const otherValue = other instanceof Precision ? other.value : other;
        return new Precision(this.value + otherValue, this.precision);
    }

    subtract(other: number | Precision): Precision {
        const otherValue = other instanceof Precision ? other.value : other;
        return new Precision(this.value - otherValue, this.precision);
    }

    toNumber(): number {
        return this.value;
    }

    toString(decimals?: number): string {
        if (decimals !== undefined) {
            return this.value.toFixed(decimals);
        }
        return this.value.toString();
    }

    toExponential(decimals?: number): string {
        return this.value.toExponential(decimals);
    }
}

// 单位制枚举
enum Unit {
    CM = 'cm',
    FT_IN = 'ft-in'
}

// 单位制枚举
enum UnitSystem {
    // 公制单位
    NANOMETER = 'nm',
    MICROMETER = 'μm',
    MILLIMETER = 'mm',
    CENTIMETER = 'cm',
    METER = 'm',
    KILOMETER = 'km',
    // 英制单位
    INCH = 'in',
    FOOT = 'ft',
    MILE = 'mi'
}

// 单位转换系数（基于米）
const UNIT_CONVERSIONS = {
    [UnitSystem.NANOMETER]: 1000000000,  // 1m = 10^9 nm
    [UnitSystem.MICROMETER]: 1000000,    // 1m = 10^6 μm
    [UnitSystem.MILLIMETER]: 1000,       // 1m = 1000 mm
    [UnitSystem.CENTIMETER]: 100,        // 1m = 100 cm
    [UnitSystem.METER]: 1,               // 1m = 1 m
    [UnitSystem.KILOMETER]: 0.001,       // 1m = 0.001 km
    [UnitSystem.INCH]: 39.3701,          // 1m = 39.3701 in
    [UnitSystem.FOOT]: 3.28084,          // 1m = 3.28084 ft
    [UnitSystem.MILE]: 0.000621371       // 1m = 0.000621371 mi
};

// 动态选择最适合的单位制 - 优化版，避免科学计数法
function getBestUnit(heightInM: number, preferMetric: boolean = true): UnitSystem {
    const absHeight = Math.abs(heightInM);

    if (preferMetric) {
        // 先尝试转换到各个单位，检查是否会产生科学计数法
        const nmValue = absHeight * UNIT_CONVERSIONS[UnitSystem.NANOMETER];
        const umValue = absHeight * UNIT_CONVERSIONS[UnitSystem.MICROMETER];
        const mmValue = absHeight * UNIT_CONVERSIONS[UnitSystem.MILLIMETER];
        const cmValue = absHeight * UNIT_CONVERSIONS[UnitSystem.CENTIMETER];
        const mValue = absHeight * UNIT_CONVERSIONS[UnitSystem.METER];
        const kmValue = absHeight * UNIT_CONVERSIONS[UnitSystem.KILOMETER];

        // 从小到大检查，优先选择不需要科学计数法的最合适单位
        if (absHeight < 0.00001) {
            // 纳米级别
            if (nmValue >= 1 && nmValue < 1000) return UnitSystem.NANOMETER;
            if (umValue >= 0.001 && umValue < 1000) return UnitSystem.MICROMETER;
            if (mmValue >= 0.001 && mmValue < 1000) return UnitSystem.MILLIMETER;
            return UnitSystem.NANOMETER; // 回退到纳米
        }

        if (absHeight < 0.01) {
            // 微米级别  
            if (umValue >= 1 && umValue < 1000) return UnitSystem.MICROMETER;
            if (mmValue >= 0.001 && mmValue < 1000) return UnitSystem.MILLIMETER;
            if (cmValue >= 0.001 && cmValue < 1000) return UnitSystem.CENTIMETER;
            return UnitSystem.MICROMETER; // 回退到微米
        }

        if (absHeight < 0.1) {
            // 毫米级别
            if (mmValue >= 1 && mmValue < 1000) return UnitSystem.MILLIMETER;
            if (cmValue >= 0.001 && cmValue < 1000) return UnitSystem.CENTIMETER;
            if (mValue >= 0.001 && mValue < 1000) return UnitSystem.METER;
            return UnitSystem.MILLIMETER; // 回退到毫米
        }

        if (absHeight < 10) {
            // 厘米级别
            if (cmValue >= 1 && cmValue < 1000) return UnitSystem.CENTIMETER;
            if (mValue >= 0.001 && mValue < 1000) return UnitSystem.METER;
            if (kmValue >= 0.001 && kmValue < 1000) return UnitSystem.KILOMETER;
            return UnitSystem.CENTIMETER; // 回退到厘米
        }

        if (absHeight < 1000) {
            // 米级别
            if (mValue >= 1 && mValue < 1000) return UnitSystem.METER;
            if (kmValue >= 0.001 && kmValue < 1000) return UnitSystem.KILOMETER;
            return UnitSystem.METER; // 回退到米
        }

        // 千米级别
        return UnitSystem.KILOMETER;

    } else {
        // 英制单位逻辑（原来基于厘米，现在基于米）
        if (absHeight < 0.0254) return UnitSystem.INCH;
        if (absHeight < 304.8) return UnitSystem.FOOT;
        return UnitSystem.MILE;
    }
}

// 格式化科学计数法为上标形式
function formatScientificNotation(value: number, decimals: number = 2): string {
    const exp = value.toExponential(decimals);
    const parts = exp.split('e');
    if (parts.length !== 2) return exp;

    const mantissa = parts[0];
    let exponent = parseInt(parts[1]);

    // 上标数字映射
    const superscriptMap: { [key: string]: string } = {
        '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴',
        '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹',
        '-': '⁻', '+': '⁺'
    };

    // 转换指数为上标
    const expStr = exponent.toString();
    const superscriptExp = expStr.split('').map(char => superscriptMap[char] || char).join('');

    return `${mantissa}×10${superscriptExp}`;
}

// 格式化数值显示 - 新的全局规则
function formatNumber(value: number, maxLength: number = 8): string {
    // 科学计数法规则：整数部分超过3位(≥1000)或小于0.001时使用科学计数法，4位有效数字
    if (Math.abs(value) >= 1000 || (Math.abs(value) < 0.001 && value !== 0)) {
        return formatScientificNotation(value, 3); // 3位小数确保4位有效数字
    }

    // 常规显示：保持最多4位有效数字
    const str = value.toString();
    if (str.length > maxLength) {
        // 计算需要的小数位数以保持4位有效数字
        const integerDigits = Math.floor(Math.log10(Math.abs(value))) + 1;
        const decimals = Math.max(0, 4 - integerDigits);
        return value.toFixed(decimals);
    }

    return str;
}

// 高精度转换高度
function convertHeightPrecision(heightInM: number, targetUnit: UnitSystem): { value: number, formatted: string } {
    const conversion = UNIT_CONVERSIONS[targetUnit];
    const precision = Precision.from(heightInM);
    const converted = precision.multiply(conversion);
    const value = converted.toNumber();

    return {
        value,
        formatted: formatNumber(value)
    };
}

// 单位转换函数（保持向后兼容）
const convertHeight = (m: number, unit: Unit): string => {
    switch (unit) {
        case Unit.CM:
            return `${(m * 100).toFixed(1)}cm`;
        case Unit.FT_IN:
            const totalInches = (m * 100) / 2.54;
            const feet = Math.floor(totalInches / 12);
            const inches = totalInches % 12;
            return `${feet}' ${inches.toFixed(1)}"`;
        default:
            return `${(m * 100).toFixed(1)}cm`;
    }
};

// 新的智能高度转换函数
const convertHeightSmart = (m: number, preferMetric: boolean = true): string => {
    const bestUnit = getBestUnit(m, preferMetric);
    const result = convertHeightPrecision(m, bestUnit);
    return `${result.formatted}${bestUnit}`;
};

// 智能英制单位显示函数 - 新的统一规则
const convertHeightSmartImperial = (m: number): string => {
    const totalInches = (m * 100) / 2.54;
    const totalFeet = totalInches / 12;

    // 小于等于1英尺：用英寸单位（必要时用科学计数法）
    if (totalFeet <= 1) {
        const inchesValue = totalInches;
        if (Math.abs(inchesValue) >= 1000 || (Math.abs(inchesValue) < 0.001 && inchesValue !== 0)) {
            return `${formatScientificNotation(inchesValue, 3)}in`;
        }
        return `${formatNumber(inchesValue)}in`;
    }

    // 1英尺到10000英尺：用英尺英寸格式
    if (totalFeet < 10000) {
        const feet = Math.floor(totalInches / 12);
        const inches = totalInches % 12;
        return `${feet}' ${inches.toFixed(1)}"`;
    }

    // 大于等于10000英尺：用英里单位（必要时用科学计数法）
    const miles = totalFeet / 5280;
    if (Math.abs(miles) >= 1000 || (Math.abs(miles) < 0.001 && miles !== 0)) {
        return `${formatScientificNotation(miles, 3)}mi`;
    }
    return `${formatNumber(miles)}mi`;
};

// 获取英制网格标题的单位显示
const getImperialGridUnitLabel = (maxHeightInComparison: number): string => {
    const maxTotalFeet = ((maxHeightInComparison * 100) / 2.54) / 12;

    if (maxTotalFeet <= 1) {
        return "in"; // 英寸
    } else if (maxTotalFeet < 10000) {
        return "ft/in"; // 英尺英寸
    } else {
        return "mi"; // 英里
    }
};

// 网格刻度线专用的英制显示函数 - 基于最大高度判断显示方式
const convertHeightForGridImperial = (m: number, maxHeightInComparison: number): string => {
    const maxTotalFeet = ((maxHeightInComparison * 100) / 2.54) / 12;
    const totalInches = (m * 100) / 2.54;
    const totalFeet = totalInches / 12;

    // 根据最大高度确定显示方式
    if (maxTotalFeet <= 1) {
        // 最大高度小于等于1英尺：统一用英寸
        const inchesValue = totalInches;
        if (Math.abs(inchesValue) >= 1000 || (Math.abs(inchesValue) < 0.001 && inchesValue !== 0)) {
            return formatScientificNotation(inchesValue, 3);
        }
        return formatNumber(inchesValue);
    } else if (maxTotalFeet < 10000) {
        // 最大高度在1-10000英尺：统一用英尺英寸格式
        const feet = Math.floor(totalInches / 12);
        const inches = totalInches % 12;
        return `${feet}' ${inches.toFixed(1)}"`;
    } else {
        // 最大高度大于等于10000英尺：统一用英里
        const miles = totalFeet / 5280;
        if (Math.abs(miles) >= 1000 || (Math.abs(miles) < 0.001 && miles !== 0)) {
            return formatScientificNotation(miles, 3);
        }
        return formatNumber(miles);
    }
};