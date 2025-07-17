# 化学塔防游戏 JSON 配置说明

## 📋 概述

本游戏使用JSON格式进行配置，提供简洁、直观的配置方式。JSON格式易于编辑、版本控制，适合开发和维护。

## 📁 配置文件

**主配置文件：** `src/assets/data/levels.json`

包含以下配置数据：
- **levels** - 关卡配置
- **elements** - 元素配置  
- **reactions** - 化学反应配置

## 🎯 关卡配置 (levels)

### 基本结构
```json
{
  "levels": {
    "level_01": {
      "id": "level_01",
      "name": "氢气入门",
      "description": "学习使用回收器回收氢气敌人",
      "difficulty": 1,
      "initialEnergy": 100,
      "gridRows": 6,
      "gridCols": 12,
      "availableBuildings": ["recycler"],
      "availableReactions": [],
      "objectives": [...],
      "waves": [...],
      "rewards": {...}
    }
  }
}
```

### 字段说明

| 字段 | 类型 | 说明 | 示例 |
|------|------|------|------|
| id | string | 关卡唯一标识符 | "level_01" |
| name | string | 关卡显示名称 | "氢气入门" |
| description | string | 关卡描述 | "学习使用回收器..." |
| difficulty | number | 难度等级(1-5) | 1 |
| initialEnergy | number | 初始能量 | 100 |
| gridRows | number | 网格行数 | 6 |
| gridCols | number | 网格列数 | 12 |
| availableBuildings | array | 可用建筑类型 | ["recycler", "reactor"] |
| availableReactions | array | 可用化学反应 | ["water_synthesis"] |
| objectives | array | 关卡目标 | 见下方说明 |
| waves | array | 敌人波次 | 见下方说明 |
| rewards | object | 关卡奖励 | 见下方说明 |

### 关卡目标 (objectives)
```json
"objectives": [
  {
    "type": "survive",
    "duration": 60000,
    "description": "生存60秒"
  },
  {
    "type": "recycle",
    "target": "H2",
    "amount": 6,
    "description": "回收6个氢气敌人"
  }
]
```

**目标类型：**
- **survive** - 生存指定时间（毫秒）
- **recycle** - 回收指定数量的物质
- **collect_energy** - 收集指定数量的能量
- **perform_reactions** - 执行指定次数的反应

### 敌人波次 (waves)
```json
"waves": [
  {
    "id": "wave1",
    "startTime": 2000,
    "enemies": [
      {
        "substance": "H2",
        "state": "gas",
        "count": 1,
        "interval": 0,
        "amount": 1
      }
    ]
  }
]
```

**波次字段：**
- **id** - 波次标识符
- **startTime** - 开始时间（毫秒，相对关卡开始）
- **enemies** - 敌人配置数组

**敌人字段：**
- **substance** - 物质类型（H2, O2, C等）
- **state** - 物质状态（gas, liquid, solid）
- **count** - 生成数量
- **interval** - 生成间隔（毫秒）
- **amount** - 每个敌人的物质数量

### 关卡奖励 (rewards)
```json
"rewards": {
  "energy": 50,
  "unlockElements": ["oxygen"],
  "unlockReactions": ["water_synthesis"]
}
```

## 🧪 元素配置 (elements)

```json
"elements": {
  "H2": {
    "id": "H2",
    "symbol": "H₂",
    "name": "氢气",
    "atomicNumber": 1,
    "color": "#87CEEB",
    "price": 10,
    "rarity": 1,
    "unlockLevel": "level_01"
  }
}
```

**字段说明：**
- **id** - 元素标识符
- **symbol** - 化学符号（支持下标）
- **name** - 中文名称
- **atomicNumber** - 原子序数
- **color** - 显示颜色（十六进制）
- **price** - 购买价格
- **rarity** - 稀有度（1-5）
- **unlockLevel** - 解锁关卡

## ⚗️ 化学反应配置 (reactions)

```json
"reactions": {
  "water_synthesis": {
    "id": "water_synthesis",
    "name": "水合成反应",
    "equation": "2H₂ + O₂ → 2H₂O",
    "reactants": [
      { "elementId": "H2", "amount": 2 },
      { "elementId": "O2", "amount": 1 }
    ],
    "products": [
      { "substance": "H2O", "amount": 2 }
    ],
    "energyCost": 10,
    "energyGain": 20,
    "unlockLevel": 1
  }
}
```

**字段说明：**
- **id** - 反应标识符
- **name** - 反应名称
- **equation** - 化学方程式
- **reactants** - 反应物数组
- **products** - 产物数组
- **energyCost** - 能量消耗
- **energyGain** - 能量产出
- **unlockLevel** - 解锁等级

## 📝 配置示例

### 关卡一：氢气入门
```json
{
  "id": "level_01",
  "name": "氢气入门",
  "description": "学习使用回收器回收氢气敌人",
  "difficulty": 1,
  "initialEnergy": 100,
  "availableBuildings": ["recycler"],
  "objectives": [
    {
      "type": "survive",
      "duration": 60000,
      "description": "生存60秒"
    },
    {
      "type": "recycle",
      "target": "H2",
      "amount": 6,
      "description": "回收6个氢气敌人"
    }
  ],
  "waves": [
    {
      "id": "wave1",
      "startTime": 2000,
      "enemies": [
        {
          "substance": "H2",
          "state": "gas",
          "count": 1,
          "interval": 0,
          "amount": 1
        }
      ]
    },
    {
      "id": "wave2",
      "startTime": 10000,
      "enemies": [
        {
          "substance": "H2",
          "state": "gas",
          "count": 1,
          "interval": 0,
          "amount": 2
        }
      ]
    },
    {
      "id": "wave3",
      "startTime": 20000,
      "enemies": [
        {
          "substance": "H2",
          "state": "gas",
          "count": 1,
          "interval": 0,
          "amount": 3
        }
      ]
    }
  ]
}
```

## 🔧 编辑建议

### 1. 使用代码编辑器
推荐使用支持JSON语法高亮的编辑器：
- Visual Studio Code
- Sublime Text
- Atom
- WebStorm

### 2. JSON格式验证
- 确保语法正确（括号匹配、逗号使用）
- 使用在线JSON验证工具检查格式
- 注意字符串必须用双引号

### 3. 数据类型注意
- **字符串**：用双引号包围
- **数字**：直接写数值，不用引号
- **布尔值**：true/false（小写）
- **数组**：用方括号 []
- **对象**：用花括号 {}

### 4. 常见错误
- 最后一个元素后不要加逗号
- 属性名必须用双引号
- 注释不被支持（可以用特殊字段如"_comment"）

## 🎮 游戏中的使用

配置文件会在游戏启动时自动加载：
1. 系统尝试加载 `src/assets/data/levels.json`
2. 如果加载失败，使用内置的默认配置
3. 配置数据被缓存，供游戏各系统使用

## 🔄 热重载

在开发环境中，修改JSON文件后：
1. 刷新浏览器页面
2. 新的配置会自动加载
3. 无需重新编译代码

## ⚠️ 注意事项

1. **文件编码**：使用UTF-8编码保存文件
2. **语法检查**：确保JSON格式正确
3. **数据验证**：确保数值在合理范围内
4. **引用完整性**：确保引用的元素和反应存在
5. **测试验证**：修改后在游戏中测试

## 📚 相关资源

- [JSON官方文档](https://www.json.org/json-zh.html)
- [在线JSON验证器](https://jsonlint.com/)
- [VS Code JSON支持](https://code.visualstudio.com/docs/languages/json)

通过JSON配置，您可以轻松地：
- ✅ 添加新关卡
- ✅ 修改游戏平衡
- ✅ 配置化学反应
- ✅ 调整敌人波次
- ✅ 设置关卡目标

JSON配置简单直观，是游戏开发的理想选择！
