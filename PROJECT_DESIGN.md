# PVZ Chemistry - 项目设计文档

## 1. 项目概述

### 1.1 游戏简介
PVZ Chemistry 是一款结合化学知识的塔防策略游戏，玩家通过放置回收器和反应器，利用真实化学反应来防御和转化敌人，在娱乐中学习化学知识。

### 1.2 核心特色
- **真实化学反应系统**：基于实际化学方程式的游戏机制
- **三态分路设计**：气态、液态、固态敌人分别在不同路径移动
- **双重策略系统**：防御性回收 + 转化性反应
- **教育娱乐融合**：在游戏中自然学习化学知识

## 2. 游戏设计规范

### 2.1 棋盘系统
```
棋盘布局：6行 × 12列网格
敌人移动：从右向左（第12列 → 第1列）

路径分配：
┌─────────────────────────┐
│ 第1-2行：气态路径 (Gas)   │
│ 第3-4行：液态路径 (Liquid)│
│ 第5-6行：固态路径 (Solid) │
└─────────────────────────┘
```

### 2.2 游戏道具系统

#### 2.2.1 三类基础道具
1. **元素 (Elements)**
   - 基础元素：H, O, C, N, Na, Cl, Fe等
   - 化合物：H2O, CO2, NaCl, Fe2O3等
   - 属性：消耗品，放置后消失
   - 用途：配置回收器和反应器

2. **回收器 (Recycler)**
   - 功能：消除对应化学物质的敌人
   - 机制：敌人接触时，如果物质匹配则消除并产生能量
   - 配置：可放入元素改变回收目标

3. **反应器 (Reactor)**
   - 功能：转化敌人的化学性质
   - 机制：敌人经过时自动触发化学反应
   - 容量：可放入多个元素
   - 双重功能：
     - 自动模式：敌人触发反应
     - 主动模式：玩家手动触发生产物质

#### 2.2.2 化学反应系统
```javascript
反应结构：
{
  reactants: ["H2", "O2"],        // 反应物
  products: ["H2O"],              // 生成物
  conditions: {                   // 反应条件
    temperature: "high",
    catalyst: "Pt"
  },
  energy: 50                      // 反应能量变化
}
```

### 2.3 敌人系统

#### 2.3.1 敌人属性
```javascript
Enemy {
  substance: "H2O",              // 化学物质
  state: "liquid",               // 物态 (gas/liquid/solid)
  speed: 2,                      // 移动速度
  lane: 3,                       // 所在路径 (1-6)
  position: {x: 12, y: 3}        // 当前位置
}
```

#### 2.3.2 敌人分路规则
- **气态敌人**：第1-2行，速度较快
- **液态敌人**：第3-4行，速度中等
- **固态敌人**：第5-6行，速度较慢

### 2.4 资源经济系统

#### 2.4.1 能量物质 (Energy)
- **初始资源**：100点能量
- **获取方式**：
  - 回收器消除敌人
  - 地图随机掉落（玩家点击收集）
  - 随时间缓慢增长

#### 2.4.2 价格体系（初步）
```javascript
价格表：
基础元素：10-20能量
简单化合物：30-50能量
回收器：100能量
反应器：150能量
```

## 3. 技术实现架构

### 3.1 项目结构
```
src/
├── game/
│   ├── scenes/
│   │   ├── Boot.js          # 启动场景
│   │   ├── Preloader.js     # 资源加载
│   │   ├── MainMenu.js      # 主菜单
│   │   ├── GamePlay.js      # 游戏主场景
│   │   ├── ChemicalGuide.js # 化学方程表
│   │   └── GameOver.js      # 游戏结束
│   ├── entities/
│   │   ├── Enemy.js         # 敌人实体
│   │   ├── Recycler.js      # 回收器
│   │   ├── Reactor.js       # 反应器
│   │   └── Element.js       # 元素
│   ├── systems/
│   │   ├── ChemicalSystem.js # 化学反应系统
│   │   ├── GridSystem.js    # 网格管理
│   │   ├── EconomySystem.js # 经济系统
│   │   └── LevelSystem.js   # 关卡系统
│   ├── data/
│   │   ├── chemicals.js     # 化学物质数据
│   │   ├── reactions.js     # 反应方程数据
│   │   └── levels.js        # 关卡数据
│   └── ui/
│       ├── HUD.js           # 游戏界面
│       ├── Shop.js          # 商店界面
│       └── InventoryPanel.js # 道具栏
├── assets/
│   ├── sprites/
│   │   ├── elements/        # 元素图标
│   │   ├── enemies/         # 敌人精灵
│   │   └── buildings/       # 建筑精灵
│   └── data/
│       └── chemical_data.json # 化学数据
└── utils/
    ├── ChemicalCalculator.js # 化学计算工具
    └── GameBalance.js       # 游戏平衡配置
```

### 3.2 核心系统设计

#### 3.2.1 化学反应系统
```javascript
class ChemicalSystem {
  constructor() {
    this.reactions = new Map();
    this.loadReactions();
  }
  
  // 检查反应是否可能
  canReact(reactants, conditions) {
    return this.reactions.has(this.getReactionKey(reactants, conditions));
  }
  
  // 执行反应
  react(reactants, conditions) {
    const reaction = this.reactions.get(this.getReactionKey(reactants, conditions));
    return reaction ? reaction.products : null;
  }
}
```

#### 3.2.2 网格系统
```javascript
class GridSystem {
  constructor(rows = 6, cols = 12) {
    this.grid = Array(rows).fill().map(() => Array(cols).fill(null));
    this.rows = rows;
    this.cols = cols;
  }
  
  // 放置建筑
  placeBuilding(x, y, building) {
    if (this.isValidPosition(x, y) && this.grid[y][x] === null) {
      this.grid[y][x] = building;
      return true;
    }
    return false;
  }
}
```

#### 3.2.3 敌人管理系统
```javascript
class EnemyManager {
  constructor() {
    this.enemies = [];
    this.spawnQueue = [];
    this.lanes = {
      gas: [0, 1],      // 气态路径：第0-1行
      liquid: [2, 3],   // 液态路径：第2-3行
      solid: [4, 5]     // 固态路径：第4-5行
    };
  }
  
  spawnEnemy(substance, state) {
    const lanes = this.lanes[state];
    const lane = lanes[Math.floor(Math.random() * lanes.length)];
    const enemy = new Enemy(substance, state, lane);
    this.enemies.push(enemy);
  }
}
```

## 4. 游戏机制详细说明

### 4.1 化学反应机制

#### 4.1.1 反应物匹配
- 反应器中的元素作为反应物之一
- 经过的敌人化学物质作为另一反应物
- 系统检查是否存在对应的化学反应

#### 4.1.2 反应条件
- 温度条件：常温、高温、低温
- 催化剂：特定元素作为催化剂
- 压力条件：标准压力、高压
- 光照条件：光照、无光

#### 4.1.3 反应结果
- 成功反应：敌人转化为产物，延迟加入敌人队列
- 反应失败：敌人正常通过，无变化
- 副反应：可能产生意外的副产物

### 4.2 回收器机制

#### 4.2.1 匹配机制
- 精确匹配：回收器中的化学物质与敌人完全相同
- 元素匹配：回收器包含敌人化学物质的所有元素
- 状态匹配：考虑物质的状态是否匹配

#### 4.2.2 回收奖励
- 基础能量：根据化学物质复杂度给予不同能量
- 连击奖励：连续回收同类物质获得额外奖励
- 稀有奖励：回收稀有化学物质获得特殊奖励

### 4.3 元素系统

#### 4.3.1 元素分类
```javascript
元素类型：
- 常见元素：H, C, O, N (价格便宜，容易获得)
- 金属元素：Fe, Cu, Zn, Al (中等价格，用于合金反应)
- 稀有元素：Au, Pt, U, Ra (价格昂贵，特殊反应)
- 气体元素：He, Ne, Ar (用于特殊条件反应)
```

#### 4.3.2 化合物系统
```javascript
化合物复杂度：
- 简单化合物：H2O, CO2, NaCl (2-3种元素)
- 中等化合物：H2SO4, CaCO3 (3-4种元素)
- 复杂化合物：C6H12O6, Ca(OH)2 (多种元素，复杂结构)
```

## 5. 实现计划

### 5.1 开发阶段规划

#### 第一阶段：核心框架 (1-2周)
- [x] 基础场景搭建
- [ ] 网格系统实现
- [ ] 基础UI框架
- [ ] 简单的建筑放置系统

#### 第二阶段：游戏机制 (2-3周)
- [ ] 敌人系统和移动逻辑
- [ ] 回收器基础功能
- [ ] 反应器基础功能
- [ ] 化学反应数据库

#### 第三阶段：化学系统 (2-3周)
- [ ] 完整化学反应系统
- [ ] 元素配置机制
- [ ] 反应触发和产物生成
- [ ] 化学方程表UI

#### 第四阶段：游戏内容 (2-3周)
- [ ] 关卡设计和数据
- [ ] 经济系统平衡
- [ ] 音效和视觉效果
- [ ] 教学引导系统

#### 第五阶段：优化完善 (1-2周)
- [ ] 性能优化
- [ ] 用户体验优化
- [ ] 测试和调试
- [ ] 发布准备

### 5.2 关键技术难点

1. **化学反应匹配算法**：高效匹配反应物和条件
2. **实时战斗平衡**：反应触发的时机和频率控制
3. **教育内容整合**：如何在不影响游戏性的前提下传授知识
4. **性能优化**：大量敌人和反应的实时计算

### 5.3 测试策略

- **单元测试**：化学反应系统、网格系统
- **集成测试**：游戏机制整体流程
- **平衡测试**：经济系统和难度曲线
- **用户测试**：教育效果和用户体验

## 6. 数据结构设计

### 6.1 化学物质数据结构
```javascript
const ChemicalSubstance = {
  id: "H2O",
  name: "水",
  formula: "H2O",
  elements: ["H", "H", "O"],
  state: "liquid",
  molarMass: 18.015,
  properties: {
    boilingPoint: 100,
    meltingPoint: 0,
    density: 1.0
  },
  sprite: "water.png"
};
```

### 6.2 化学反应数据结构
```javascript
const ChemicalReaction = {
  id: "water_formation",
  name: "水的形成",
  equation: "2H2 + O2 → 2H2O",
  reactants: [
    { substance: "H2", amount: 2 },
    { substance: "O2", amount: 1 }
  ],
  products: [
    { substance: "H2O", amount: 2 }
  ],
  conditions: {
    temperature: "high",
    catalyst: null,
    pressure: "standard"
  },
  energyChange: -484, // kJ/mol
  difficulty: 1
};
```

### 6.3 关卡数据结构
```javascript
const Level = {
  id: "level_01",
  name: "氢气与氧气",
  description: "学习最基本的化学反应",
  grid: { rows: 6, cols: 12 },
  initialEnergy: 100,
  availableElements: ["H", "O", "H2", "O2"],
  availableBuildings: ["recycler", "reactor"],
  enemyWaves: [
    {
      time: 0,
      enemies: [
        { substance: "H2", state: "gas", count: 3, interval: 2000 }
      ]
    }
  ],
  objectives: [
    { type: "survive", duration: 60000 },
    { type: "collect", amount: 50 }
  ]
};
```

## 7. UI/UX 设计规范

### 7.1 主界面布局
```
┌─────────────────────────────────────┐
│ 能量：123  │  暂停  │  设置  │  帮助 │
├─────────────────────────────────────┤
│                                     │
│         游戏区域 (6x12网格)          │
│                                     │
├─────────────────────────────────────┤
│ 道具栏：[H][O][回收器][反应器]       │
└─────────────────────────────────────┘
```

### 7.2 视觉设计原则
- **科学感**：使用现代、简洁的设计风格
- **教育性**：化学符号和公式清晰可读
- **直观性**：游戏操作简单易懂
- **反馈性**：及时的视觉和声音反馈

### 7.3 颜色系统
```css
主色调：
- 背景色：#1a1a2e (深蓝紫)
- 元素色：#0f3460 (蓝色)
- 能量色：#e94560 (红色)
- 成功色：#16213e (绿色)

状态颜色：
- 气态：#87CEEB (天蓝)
- 液态：#4169E1 (皇室蓝)
- 固态：#8B4513 (棕色)
```

## 8. 性能优化策略

### 8.1 渲染优化
- 对象池管理敌人和弹丸
- 精灵图集减少纹理切换
- 视野剔除不可见元素

### 8.2 计算优化
- 化学反应查找使用哈希表
- 碰撞检测使用空间分割
- 帧率自适应调整更新频率

### 8.3 内存管理
- 及时销毁不用的游戏对象
- 合理使用缓存机制
- 监控内存使用情况

---

**文档版本**：v1.0  
**最后更新**：2024年  
**维护者**：Lab Defenders 开发团队 