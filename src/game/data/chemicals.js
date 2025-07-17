// 化学物质数据库
// 定义游戏中使用的化学物质及其属性

export const ChemicalSubstances = {
    // 氢气
    H2: {
        id: 'H2',
        name: '氢气',
        formula: 'H₂',
        state: 'gas',
        color: 0x87CEEB,
        speed: 100, // 像素/秒
        health: 30,
        elements: ['H', 'H'],
        molarMass: 2.016,
        substanceAmount: 2, // 物质数量
        description: '最轻的气体，易燃易爆'
    },
    
    // 氧气
    O2: {
        id: 'O2',
        name: '氧气',
        formula: 'O₂',
        state: 'gas',
        color: 0x87CEEB,
        speed: 90,
        health: 35,
        elements: ['O', 'O'],
        molarMass: 31.998,
        substanceAmount: 3,
        description: '支持燃烧的气体'
    },

    // 水
    H2O: {
        id: 'H2O',
        name: '水',
        formula: 'H₂O',
        state: 'liquid',
        color: 0x4169E1,
        speed: 60,
        health: 50,
        elements: ['H', 'H', 'O'],
        molarMass: 18.015,
        substanceAmount: 4,
        description: '生命之源'
    },

    // 二氧化碳
    CO2: {
        id: 'CO2',
        name: '二氧化碳',
        formula: 'CO₂',
        state: 'gas',
        color: 0x87CEEB,
        speed: 80,
        health: 40,
        elements: ['C', 'O', 'O'],
        molarMass: 44.01,
        substanceAmount: 3,
        description: '温室气体'
    },
    
    // 氯化钠
    NaCl: {
        id: 'NaCl',
        name: '氯化钠',
        formula: 'NaCl',
        state: 'solid',
        color: 0x8B4513,
        speed: 40,
        health: 80,
        elements: ['Na', 'Cl'],
        molarMass: 58.44,
        substanceAmount: 5,
        description: '食盐的主要成分'
    },

    // 氢氧化钠
    NaOH: {
        id: 'NaOH',
        name: '氢氧化钠',
        formula: 'NaOH',
        state: 'solid',
        color: 0x8B4513,
        speed: 35,
        health: 70,
        elements: ['Na', 'O', 'H'],
        molarMass: 39.997,
        substanceAmount: 4,
        description: '强碱，俗称烧碱'
    },

    // 氮气
    N2: {
        id: 'N2',
        name: '氮气',
        formula: 'N₂',
        state: 'gas',
        color: 0x87CEEB,
        speed: 85,
        health: 45,
        elements: ['N', 'N'],
        molarMass: 28.014,
        substanceAmount: 3,
        description: '惰性气体，占空气78%'
    },

    // 甲烷
    CH4: {
        id: 'CH4',
        name: '甲烷',
        formula: 'CH₄',
        state: 'gas',
        color: 0x87CEEB,
        speed: 95,
        health: 25,
        elements: ['C', 'H', 'H', 'H', 'H'],
        molarMass: 16.04,
        substanceAmount: 2,
        description: '天然气的主要成分'
    }
};

// 根据物态获取颜色
export const StateColors = {
    gas: 0x87CEEB,    // 天蓝色
    liquid: 0x4169E1, // 皇室蓝
    solid: 0x8B4513   // 棕色
};

// 根据物态获取速度倍数
export const StateSpeedMultipliers = {
    gas: 1.5,    // 气态移动最快
    liquid: 1.0, // 液态标准速度
    solid: 0.7   // 固态移动最慢
};

// 路径配置
export const LaneConfig = {
    gas: [0, 1],     // 气态路径：第0-1行
    liquid: [2, 3],  // 液态路径：第2-3行
    solid: [4, 5]    // 固态路径：第4-5行
};

// 获取化学物质数据
export function getChemicalData(substanceId) {
    return ChemicalSubstances[substanceId] || null;
}

// 获取所有指定物态的化学物质
export function getSubstancesByState(state) {
    return Object.values(ChemicalSubstances).filter(substance => substance.state === state);
}

// 获取随机化学物质
export function getRandomSubstance(state = null) {
    const substances = state ? getSubstancesByState(state) : Object.values(ChemicalSubstances);
    return substances[Math.floor(Math.random() * substances.length)];
} 