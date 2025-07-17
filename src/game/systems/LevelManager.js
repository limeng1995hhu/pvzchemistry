import { EventBus } from '../EventBus.js';
import { configManager } from './ConfigManager.js';

/**
 * 关卡管理系统
 * 负责加载关卡配置、管理敌人波次、检查关卡目标
 */
export class LevelManager {
    constructor(scene) {
        this.scene = scene;
        
        // 当前关卡信息
        this.currentLevel = null;
        this.levelId = null;

        // 关卡配置缓存
        this.levelConfigs = null;
        
        // 波次管理
        this.waves = [];
        this.currentWaveIndex = 0;
        this.waveStartTime = 0;
        this.isLevelActive = false;
        
        // 关卡目标
        this.objectives = [];
        this.completedObjectives = [];
        
        // 统计数据
        this.stats = {
            enemiesSpawned: 0,
            enemiesKilled: 0,
            energyCollected: 0,
            reactionsPerformed: 0,
            levelStartTime: 0,
            levelDuration: 0
        };
        
        this.init();
    }
    
    async init() {
        console.log('LevelManager 初始化');
        this.setupEventListeners();

        // 使用配置管理器加载配置
        await this.loadLevelConfigs();
    }

    // 使用配置管理器加载关卡配置
    async loadLevelConfigs() {
        try {
            console.log('LevelManager: 加载关卡配置...');

            // 等待配置管理器加载完成
            await configManager.loadConfigs();

            // 获取关卡配置
            this.levelConfigs = configManager.getAllLevelConfigs();

            console.log('LevelManager: 关卡配置加载完成', Object.keys(this.levelConfigs));

        } catch (error) {
            console.error('LevelManager: 加载关卡配置失败:', error);
            // 使用默认配置作为后备
            this.levelConfigs = this.getDefaultLevelConfigs();
        }
    }


    
    setupEventListeners() {
        // 监听敌人相关事件
        EventBus.on('enemy-spawned', (data) => {
            this.stats.enemiesSpawned++;
        });
        
        EventBus.on('enemy-killed', (data) => {
            this.stats.enemiesKilled++;
        });
        
        EventBus.on('enemy-recycled', (data) => {
            this.stats.energyCollected += data.energyReward || 0;
        });
        
        EventBus.on('reaction-occurred', (data) => {
            this.stats.reactionsPerformed++;
        });
    }
    
    // 加载关卡
    loadLevel(levelId) {
        console.log(`加载关卡: ${levelId}`);
        
        this.levelId = levelId;
        this.currentLevel = this.getLevelConfig(levelId);
        
        if (!this.currentLevel) {
            console.error(`关卡配置未找到: ${levelId}`);
            return false;
        }
        
        // 重置统计数据
        this.resetStats();
        
        // 配置关卡
        this.setupLevel();
        
        return true;
    }
    
    // 获取关卡配置
    getLevelConfig(levelId) {
        if (!this.levelConfigs) {
            console.warn('关卡配置未加载，使用配置管理器');
            return configManager.getLevelConfig(levelId) || this.getDefaultLevelConfig(levelId);
        }

        return this.levelConfigs[levelId] || this.getDefaultLevelConfig(levelId);
    }

    // 获取默认关卡配置（后备方案）
    getDefaultLevelConfigs() {
        return {
            'level_01': this.getDefaultLevelConfig('level_01')
        };
    }

    // 获取默认关卡一配置
    getDefaultLevelConfig(levelId) {
        if (levelId === 'level_01') {
            return {
                id: 'level_01',
                name: '氢气入门',
                description: '学习使用回收器回收氢气敌人',
                initialEnergy: 100,
                availableBuildings: ['recycler'],
                availableItems: ['hydrogen', 'recycler'], // 兼容旧版本
                objectives: [
                    { type: 'survive', duration: 60000, description: '生存60秒' },
                    { type: 'recycle', target: 'H2', amount: 6, description: '回收6个氢气敌人' }
                ],
                waves: [
                    {
                        id: 'wave1',
                        startTime: 2000,
                        enemies: [{ substance: 'H2', amount: 1, count: 1, interval: 0 }]
                    },
                    {
                        id: 'wave2',
                        startTime: 10000,
                        enemies: [{ substance: 'H2', amount: 2, count: 1, interval: 0 }]
                    },
                    {
                        id: 'wave3',
                        startTime: 20000,
                        enemies: [{ substance: 'H2', amount: 3, count: 1, interval: 0 }]
                    }
                ]
            };
        }
        return null;
    }
    
    // 设置关卡
    setupLevel() {
        console.log('设置关卡:', this.currentLevel.name);
        
        // 设置初始能量
        if (this.scene.hud) {
            this.scene.hud.setEnergy(this.currentLevel.initialEnergy);
        }
        
        // 配置可用道具
        this.configureAvailableItems();
        
        // 设置关卡目标
        this.objectives = [...this.currentLevel.objectives];
        this.completedObjectives = [];
        
        // 设置敌人波次
        this.waves = [...this.currentLevel.waves];
        this.currentWaveIndex = 0;
        
        // 显示关卡信息
        this.showLevelInfo();
    }
    
    // 配置可用道具
    configureAvailableItems() {
        // 从关卡配置获取可用道具
        let availableItems = [];

        // 支持新的availableBuildings字段
        if (this.currentLevel.availableBuildings) {
            availableItems = [...this.currentLevel.availableBuildings];
        }

        // 兼容旧的availableItems字段
        if (this.currentLevel.availableItems) {
            availableItems = [...this.currentLevel.availableItems];
        }

        // 添加氢气元素（关卡一需要）
        if (this.currentLevel.id === 'level_01') {
            if (!availableItems.includes('hydrogen')) {
                availableItems.unshift('hydrogen');
            }
        }

        console.log('可用道具:', availableItems);

        // 发送事件通知道具栏更新
        EventBus.emit('level-items-configured', {
            availableItems: availableItems
        });
    }
    
    // 显示关卡信息
    showLevelInfo() {
        if (this.scene.hud) {
            this.scene.hud.showMessage(`关卡: ${this.currentLevel.name}`, '#4ecdc4', 3000);
            
            // 显示目标
            setTimeout(() => {
                const objectiveText = this.objectives.map(obj => obj.description).join(' | ');
                this.scene.hud.showMessage(`目标: ${objectiveText}`, '#ffaa00', 5000);
            }, 3500);
        }
    }
    
    // 开始关卡
    startLevel() {
        console.log('开始关卡');
        
        this.isLevelActive = true;
        this.stats.levelStartTime = this.scene.time.now;
        this.waveStartTime = this.scene.time.now;
        
        // 停止当前的敌人生成
        if (this.scene.enemyManager) {
            this.scene.enemyManager.stopSpawning();
        }
        
        // 发送关卡开始事件
        EventBus.emit('level-started', {
            levelId: this.levelId,
            levelName: this.currentLevel.name
        });
    }
    
    // 更新关卡状态
    update(time, delta) {
        if (!this.isLevelActive) return;
        
        // 更新关卡持续时间
        this.stats.levelDuration = time - this.stats.levelStartTime;
        
        // 处理敌人波次
        this.updateWaves(time);
        
        // 检查关卡目标
        this.checkObjectives(time);
    }
    
    // 更新敌人波次
    updateWaves(time) {
        const elapsedTime = time - this.waveStartTime;
        
        // 检查是否有新的波次需要开始
        for (let i = this.currentWaveIndex; i < this.waves.length; i++) {
            const wave = this.waves[i];
            
            if (elapsedTime >= wave.startTime && !wave.started) {
                this.startWave(wave);
                wave.started = true;
                this.currentWaveIndex = i + 1;
            }
        }
    }
    
    // 开始波次
    startWave(wave) {
        console.log(`开始波次: ${wave.id}`);
        
        // 生成波次中的敌人
        wave.enemies.forEach(enemyConfig => {
            this.spawnWaveEnemy(enemyConfig);
        });
        
        // 显示波次信息
        if (this.scene.hud) {
            this.scene.hud.showMessage(`${wave.id} 开始！`, '#ff6600', 2000);
        }
    }
    
    // 生成波次敌人
    spawnWaveEnemy(enemyConfig) {
        if (this.scene.enemyManager) {
            for (let i = 0; i < enemyConfig.count; i++) {
                setTimeout(() => {
                    const enemy = this.scene.enemyManager.spawnEnemy(enemyConfig.substance);
                    if (enemy) {
                        // 设置敌人的物质数量
                        enemy.substanceAmount = enemyConfig.amount;
                        enemy.maxSubstanceAmount = enemyConfig.amount;
                        enemy.updateAmountDisplay();
                        
                        console.log(`生成波次敌人: ${enemyConfig.substance} ×${enemyConfig.amount}`);
                    }
                }, i * (enemyConfig.interval || 0));
            }
        }
    }
    
    // 检查关卡目标
    checkObjectives(time) {
        this.objectives.forEach((objective, index) => {
            if (this.completedObjectives.includes(index)) return;
            
            let completed = false;
            
            switch (objective.type) {
                case 'survive':
                    completed = this.stats.levelDuration >= objective.duration;
                    break;
                case 'recycle':
                    // 这里需要更精确的回收统计
                    completed = this.stats.enemiesKilled >= objective.amount;
                    break;
                case 'collect_energy':
                    completed = this.stats.energyCollected >= objective.amount;
                    break;
            }
            
            if (completed) {
                this.completeObjective(index, objective);
            }
        });
        
        // 检查是否所有目标都完成
        if (this.completedObjectives.length === this.objectives.length) {
            this.completeLevel();
        }
    }
    
    // 完成目标
    completeObjective(index, objective) {
        this.completedObjectives.push(index);
        console.log(`目标完成: ${objective.description}`);
        
        if (this.scene.hud) {
            this.scene.hud.showMessage(`✅ ${objective.description}`, '#00ff00', 3000);
        }
        
        EventBus.emit('objective-completed', {
            objectiveIndex: index,
            objective: objective
        });
    }
    
    // 完成关卡
    completeLevel() {
        console.log('关卡完成！');
        
        this.isLevelActive = false;
        
        if (this.scene.hud) {
            this.scene.hud.showMessage('🎉 关卡完成！', '#00ff00', 5000);
        }
        
        EventBus.emit('level-completed', {
            levelId: this.levelId,
            stats: this.stats,
            duration: this.stats.levelDuration
        });
    }
    
    // 重置统计数据
    resetStats() {
        this.stats = {
            enemiesSpawned: 0,
            enemiesKilled: 0,
            energyCollected: 0,
            reactionsPerformed: 0,
            levelStartTime: 0,
            levelDuration: 0
        };
    }
    
    // 获取关卡进度
    getLevelProgress() {
        return {
            levelId: this.levelId,
            levelName: this.currentLevel?.name || '',
            objectives: this.objectives,
            completedObjectives: this.completedObjectives,
            stats: this.stats,
            isActive: this.isLevelActive
        };
    }
    
    // 销毁管理器
    destroy() {
        this.isLevelActive = false;
        
        // 清理事件监听
        EventBus.off('enemy-spawned');
        EventBus.off('enemy-killed');
        EventBus.off('enemy-recycled');
        EventBus.off('reaction-occurred');
        
        console.log('LevelManager 已销毁');
    }
}
