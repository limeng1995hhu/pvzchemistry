import { CSVParser } from '../utils/CSVParser';

export class ConfigLoader {
    constructor() {
        this.reactions = [];
        this.levels = [];
        this.elements = [];
        this.loaded = false;
    }
    
    async loadAllConfigs() {
        try {
            const [reactionsCSV, levelsCSV, elementsCSV] = await Promise.all([
                this.loadCSV('/src/assets/data/reactions.csv'),
                this.loadCSV('/src/assets/data/levels.csv'),
                this.loadCSV('/src/assets/data/elements.csv')
            ]);
            
            this.reactions = this.parseReactions(reactionsCSV);
            this.levels = this.parseLevels(levelsCSV);
            this.elements = this.parseElements(elementsCSV);
            
            this.loaded = true;
            console.log('CSV配置加载完成');
            console.log('关卡数量:', this.levels.length);
            console.log('反应数量:', this.reactions.length);
            console.log('元素数量:', this.elements.length);
            
            return true;
        } catch (error) {
            console.error('CSV配置加载失败:', error);
            return false;
        }
    }
    
    async loadCSV(path) {
        const response = await fetch(path);
        if (!response.ok) {
            throw new Error(`加载CSV失败: ${path}`);
        }
        const csvText = await response.text();
        return CSVParser.parseCSV(csvText);
    }
    
    parseReactions(rawData) {
        return rawData.map(row => ({
            id: row.id,
            name: row.name,
            equation: row.equation,
            description: row.description,
            reactants: this.parseReactants(row.reactants),
            products: this.parseProducts(row.products),
            energyCost: parseInt(row.energy_cost) || 0,
            energyGain: parseInt(row.energy_gain) || 0,
            difficulty: parseInt(row.difficulty) || 1,
            unlockLevel: parseInt(row.unlock_level) || 1,
            conditions: CSVParser.parseComplexField(row.conditions, 'keyvalue')
        }));
    }
    
    parseLevels(rawData) {
        return rawData.map(row => ({
            id: row.id,
            name: row.name,
            description: row.description,
            difficulty: parseInt(row.difficulty) || 1,
            initialEnergy: parseInt(row.initial_energy) || 100,
            grid: {
                rows: parseInt(row.grid_rows) || 6,
                cols: parseInt(row.grid_cols) || 12
            },
            availableBuildings: CSVParser.parseComplexField(row.available_buildings, 'array'),
            availableReactions: CSVParser.parseComplexField(row.available_reactions, 'array'),
            objectives: CSVParser.parseComplexField(row.objectives, 'objectives'),
            enemyWaves: CSVParser.parseComplexField(row.enemy_waves, 'waves'),
            rewards: {
                energy: parseInt(row.rewards_energy) || 0,
                unlockElements: CSVParser.parseComplexField(row.unlock_elements, 'array'),
                unlockReactions: CSVParser.parseComplexField(row.unlock_reactions, 'array')
            }
        }));
    }
    
    parseElements(rawData) {
        return rawData.map(row => ({
            symbol: row.symbol,
            name: row.name,
            nameEn: row.name_en,
            atomicNumber: parseInt(row.atomic_number) || 0,
            color: row.color,
            price: parseInt(row.price) || 0,
            rarity: row.rarity,
            description: row.description,
            unlockLevel: parseInt(row.unlock_level) || 1
        }));
    }
    
    parseReactants(reactantsStr) {
        // 解析 "H:2;O:1" 格式
        return reactantsStr.split(';').map(item => {
            const [element, count] = item.split(':');
            return { element: element.trim(), count: parseInt(count) || 1 };
        });
    }
    
    parseProducts(productsStr) {
        // 解析 "H2O:water:liquid:#4169E1:1" 格式
        return productsStr.split(';').map(item => {
            const [formula, name, state, color, count] = item.split(':');
            return {
                formula: formula.trim(),
                name: name.trim(),
                state: state.trim(),
                color: color.trim(),
                count: parseInt(count) || 1
            };
        });
    }
    
    // 获取所有关卡（用于关卡选择界面）
    getAllLevels() {
        return this.levels;
    }
    
    // 获取关卡配置
    getLevel(id) {
        return this.levels.find(l => l.id === id) || null;
    }
    
    // 获取反应配置
    getReaction(id) {
        return this.reactions.find(r => r.id === id) || null;
    }
    
    // 获取元素配置
    getElement(symbol) {
        return this.elements.find(e => e.symbol === symbol) || null;
    }
}

export const gameConfig = new ConfigLoader();