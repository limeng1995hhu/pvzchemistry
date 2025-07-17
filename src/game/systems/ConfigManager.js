/**
 * 配置管理器
 * 处理JSON配置文件的加载和解析
 */
export class ConfigManager {
    constructor() {
        this.configs = {
            levels: {},
            reactions: {},
            elements: {},
            waves: {}
        };
        
        this.isLoaded = false;
        this.loadPromise = null;
    }
    
    /**
     * 加载所有配置文件
     * @returns {Promise<void>}
     */
    async loadConfigs() {
        if (this.loadPromise) {
            return this.loadPromise;
        }
        
        this.loadPromise = this._loadConfigs();
        return this.loadPromise;
    }
    
    async _loadConfigs() {
        try {
            console.log('ConfigManager: 开始加载配置文件...');

            // 尝试加载JSON配置文件
            try {
                await this.loadJSONConfigs();
                console.log('ConfigManager: JSON配置加载成功');
                this.isLoaded = true;
                return;
            } catch (jsonError) {
                console.log('ConfigManager: JSON文件不可用，使用默认配置');
                console.log('JSON错误详情:', jsonError.message);
            }

            // 使用默认配置
            this.loadDefaultConfigs();
            console.log('ConfigManager: 默认配置加载成功');
            this.isLoaded = true;

        } catch (error) {
            console.error('ConfigManager: 配置加载失败:', error);
            this.loadDefaultConfigs();
            this.isLoaded = true;
        }
    }
    


    /**
     * 从JSON文件加载配置
     */
    async loadJSONConfigs() {
        // 尝试加载配置文件
        const configUrls = [
            './src/assets/data/levels.json'
        ];

        for (const jsonUrl of configUrls) {
            try {
                const response = await fetch(jsonUrl);

                if (!response.ok) {
                    continue; // 尝试下一个文件
                }

                const jsonData = await response.json();

                if (jsonData.levels) {
                    this.configs.levels = jsonData.levels;
                }

                if (jsonData.reactions) {
                    this.configs.reactions = jsonData.reactions;
                }

                if (jsonData.elements) {
                    this.configs.elements = jsonData.elements;
                }

                if (jsonData.waves) {
                    this.configs.waves = jsonData.waves;
                }

                console.log(`ConfigManager: 成功加载配置文件 ${jsonUrl}`);
                return; // 成功加载，退出循环

            } catch (error) {
                console.log(`ConfigManager: 加载 ${jsonUrl} 失败:`, error.message);
                continue; // 尝试下一个文件
            }
        }

        throw new Error('所有JSON配置文件都无法加载');
    }
    

    
    /**
     * 加载默认配置
     */
    loadDefaultConfigs() {
        this.configs.levels = {
            'level_01': {
                id: 'level_01',
                name: '氢气入门',
                description: '学习使用回收器回收氢气敌人',
                difficulty: 1,
                initialEnergy: 100,
                gridRows: 6,
                gridCols: 12,
                availableBuildings: ['recycler'],
                availableReactions: [],
                objectives: [
                    { type: 'survive', duration: 60000, description: '生存60秒' },
                    { type: 'recycle', target: 'H2', amount: 6, description: '回收6个氢气敌人' }
                ],
                waves: [
                    {
                        id: 'wave1',
                        startTime: 2000,
                        enemies: [{ substance: 'H2', state: 'gas', count: 1, interval: 0, amount: 1 }]
                    },
                    {
                        id: 'wave2',
                        startTime: 10000,
                        enemies: [{ substance: 'H2', state: 'gas', count: 1, interval: 0, amount: 2 }]
                    },
                    {
                        id: 'wave3',
                        startTime: 20000,
                        enemies: [{ substance: 'H2', state: 'gas', count: 1, interval: 0, amount: 3 }]
                    }
                ],
                rewards: {
                    energy: 50,
                    unlockElements: ['oxygen'],
                    unlockReactions: ['water_synthesis']
                }
            }
        };
        
        this.configs.elements = {
            'H2': {
                id: 'H2',
                symbol: 'H₂',
                name: '氢气',
                atomicNumber: 1,
                color: '#87CEEB',
                price: 10,
                rarity: 1,
                unlockLevel: 'level_01'
            },
            'O2': {
                id: 'O2',
                symbol: 'O₂',
                name: '氧气',
                atomicNumber: 8,
                color: '#4169E1',
                price: 10,
                rarity: 1,
                unlockLevel: 'level_01'
            },
            'H2O': {
                id: 'H2O',
                symbol: 'H₂O',
                name: '水',
                atomicNumber: 0, // 化合物没有原子序数
                color: '#4169E1',
                price: 15,
                rarity: 2,
                unlockLevel: 'level_02'
            }
        };
        
        this.configs.reactions = {
            'water_synthesis': {
                id: 'water_synthesis',
                name: '水合成反应',
                equation: '2H₂ + O₂ → 2H₂O',
                reactants: [
                    { elementId: 'H2', amount: 2 },
                    { elementId: 'O2', amount: 1 }
                ],
                products: [
                    { substance: 'H2O', amount: 2 }
                ],
                energyCost: 10,
                energyGain: 20,
                unlockLevel: 1
            }
        };
    }
    

    
    /**
     * 获取关卡配置
     */
    getLevelConfig(levelId) {
        return this.configs.levels[levelId] || null;
    }
    
    /**
     * 获取所有关卡配置
     */
    getAllLevelConfigs() {
        return this.configs.levels;
    }
    
    /**
     * 获取元素配置
     */
    getElementConfig(elementId) {
        return this.configs.elements[elementId] || null;
    }
    
    /**
     * 获取反应配置
     */
    getReactionConfig(reactionId) {
        return this.configs.reactions[reactionId] || null;
    }
    
    /**
     * 检查配置是否已加载
     */
    isConfigLoaded() {
        return this.isLoaded;
    }
}

// 创建全局配置管理器实例
export const configManager = new ConfigManager();
