import { Enemy } from '../entities/Enemy.js';
import { getRandomSubstance, ChemicalSubstances } from '../data/chemicals.js';
import { EventBus } from '../EventBus.js';

export class EnemyManager {
    constructor(scene) {
        this.scene = scene;
        
        // 敌人管理
        this.enemies = new Map(); // ID -> Enemy实例
        this.activeEnemies = []; // 活跃敌人数组（用于快速遍历）
        
        // 生成控制
        this.spawnQueue = [];
        this.nextSpawnTime = 0;
        this.spawnInterval = 2000; // 默认2秒生成一个敌人
        this.isSpawning = false;
        
        // 波次控制
        this.currentWave = 0;
        this.waveData = null;
        this.wavePaused = false;
        
        // 统计数据
        this.stats = {
            totalSpawned: 0,
            totalKilled: 0,
            totalReachedEnd: 0,
            currentAlive: 0
        };
        
        // 性能优化
        this.maxEnemies = 50; // 最大同时敌人数量
        this.updateCounter = 0; // 用于分帧更新（当敌人数量>30时）
        
        // 暂停状态
        this.isPaused = false;
        this.pausedSpawnTime = 0; // 暂停时保存的生成时间
        
        this.init();
    }
    
    init() {
        console.log('EnemyManager 初始化');
        
        // 监听游戏事件
        this.setupEventListeners();

        // 注释掉测试生成，使用关卡管理器控制敌人生成
        // this.startTestSpawning();
    }
    
    setupEventListeners() {
        // 监听敌人到达终点事件
        EventBus.on('enemy-reached-end', (enemyData) => {
            this.onEnemyReachedEnd(enemyData);
        });
        
        // 监听敌人被消灭事件
        EventBus.on('enemy-killed', (enemyData) => {
            this.onEnemyKilled(enemyData);
        });
        
        // 监听游戏暂停/恢复事件
        EventBus.on('game-pause', () => {
            this.onGamePause();
        });
        
        EventBus.on('game-resume', () => {
            this.onGameResume();
        });
    }
    
    // 开始测试生成（临时方法）
    startTestSpawning() {
        console.log('开始测试敌人生成');
        this.isSpawning = true;
        this.nextSpawnTime = this.scene.time.now + 1000; // 1秒后开始生成
    }
    
    // 停止生成
    stopSpawning() {
        this.isSpawning = false;
        console.log('停止敌人生成');
    }
    
    // 生成敌人
    spawnEnemy(substanceId = null, lane = null) {
        // console.log(`EnemyManager.spawnEnemy 被调用，参数:`, { substanceId, lane });

        // 检查是否超过最大敌人数量
        if (this.activeEnemies.length >= this.maxEnemies) {
            console.warn('已达到最大敌人数量，跳过生成');
            return null;
        }

        // 如果没有指定物质，随机选择一个
        if (!substanceId) {
            const randomSubstance = getRandomSubstance();
            substanceId = randomSubstance.id;
            // console.log(`随机选择物质: ${substanceId}`);
        } else {
            // console.log(`使用指定物质: ${substanceId}`);
        }
        
        try {
            // 创建敌人实例
            const enemy = new Enemy(this.scene, substanceId, lane);
            
            if (!enemy.chemicalData) {
                console.error('敌人创建失败：无效的化学物质数据');
                return null;
            }

            // 检查敌人所在路径是否可用
            if (this.scene.laneManager && !this.scene.laneManager.isLaneActive(enemy.lane)) {
                console.log(`路径 ${enemy.lane} 已禁用，无法生成敌人`);
                enemy.destroy();
                return null;
            }

            // 添加到管理系统
            this.enemies.set(enemy.id, enemy);
            this.activeEnemies.push(enemy);
            
            // 更新统计
            this.stats.totalSpawned++;
            this.stats.currentAlive++;
            
            console.log(`生成敌人: ${enemy.formula} (${enemy.state}) 在路径 ${enemy.lane}`);
            
            // 发送生成事件
            EventBus.emit('enemy-spawned', {
                enemyId: enemy.id,
                substance: enemy.substance,
                formula: enemy.formula,
                state: enemy.state,
                lane: enemy.lane
            });
            
            return enemy;
            
        } catch (error) {
            console.error('生成敌人时出错:', error);
            return null;
        }
    }
    
    // 移除敌人
    removeEnemy(enemyId, reason = 'unknown') {
        const enemy = this.enemies.get(enemyId);
        if (!enemy) {
            console.warn('尝试移除不存在的敌人:', enemyId);
            return false;
        }
        
        // 从管理系统中移除
        this.enemies.delete(enemyId);
        const index = this.activeEnemies.findIndex(e => e.id === enemyId);
        if (index !== -1) {
            this.activeEnemies.splice(index, 1);
        }
        
        // 更新统计
        this.stats.currentAlive--;
        if (reason === 'killed') {
            this.stats.totalKilled++;
        } else if (reason === 'reached-end') {
            this.stats.totalReachedEnd++;
        }
        
        console.log(`移除敌人: ${enemy.formula} (原因: ${reason})`);
        
        // 销毁敌人
        enemy.destroy();
        
        return true;
    }
    
    // 更新所有敌人
    update(time, delta) {
        // 如果游戏暂停，跳过更新
        if (this.isPaused) {
            return;
        }
        
        // 处理敌人生成
        this.updateSpawning(time);
        
        // 分帧更新敌人（性能优化）
        this.updateEnemiesInBatches(time, delta);
        
        // 清理死亡或到达终点的敌人
        this.cleanupEnemies();
    }
    
    // 更新生成逻辑（已禁用，由关卡管理器控制）
    updateSpawning(time) {
        // 注释掉自动生成逻辑，改为由关卡管理器控制敌人生成
        // if (!this.isSpawning) return;
        //
        // if (time >= this.nextSpawnTime) {
        //     // 生成新敌人
        //     this.spawnEnemy();
        //
        //     // 设置下次生成时间
        //     this.nextSpawnTime = time + this.spawnInterval + Math.random() * 1000; // 添加随机延迟
        // }
    }
    
    // 更新所有敌人
    updateEnemiesInBatches(time, delta) {
        // 如果敌人数量较少，直接更新所有敌人
        if (this.activeEnemies.length <= 30) {
            for (let i = 0; i < this.activeEnemies.length; i++) {
                const enemy = this.activeEnemies[i];
                if (enemy && enemy.isAlive) {
                    enemy.update(time, delta);
                }
            }
        } else {
            // 敌人数量较多时，使用改进的分帧更新
            const batchSize = 15;
            const totalEnemies = this.activeEnemies.length;

            // 重置计数器以避免索引越界
            if (this.updateCounter * batchSize >= totalEnemies) {
                this.updateCounter = 0;
            }

            const startIndex = this.updateCounter * batchSize;
            const endIndex = Math.min(startIndex + batchSize, totalEnemies);

            for (let i = startIndex; i < endIndex; i++) {
                const enemy = this.activeEnemies[i];
                if (enemy && enemy.isAlive) {
                    enemy.update(time, delta);
                }
            }

            this.updateCounter++;
        }
    }
    
    // 清理死亡或到达终点的敌人
    cleanupEnemies() {
        const toRemove = [];
        
        for (const enemy of this.activeEnemies) {
            if (!enemy.isAlive) {
                toRemove.push({ id: enemy.id, reason: 'killed' });
            } else if (enemy.reachedEnd) {
                toRemove.push({ id: enemy.id, reason: 'reached-end' });
            }
        }
        
        // 移除标记的敌人
        for (const { id, reason } of toRemove) {
            this.removeEnemy(id, reason);
        }
    }
    
    // 获取指定范围内的敌人
    getEnemiesInRange(x, y, radius) {
        const enemiesInRange = [];
        
        for (const enemy of this.activeEnemies) {
            if (enemy.isAlive && enemy.intersects(x, y, radius)) {
                enemiesInRange.push(enemy);
            }
        }
        
        return enemiesInRange;
    }
    
    // 获取指定路径上的敌人
    getEnemiesInLane(lane) {
        return this.activeEnemies.filter(enemy => 
            enemy.isAlive && enemy.lane === lane
        );
    }
    
    // 获取指定网格位置的敌人
    getEnemiesAtGrid(row, col, tolerance = 0.5) {
        return this.activeEnemies.filter(enemy => {
            if (!enemy.isAlive) return false;
            
            const gridRow = enemy.gridRow;
            const gridCol = enemy.gridCol;
            
            return gridRow === row && 
                   Math.abs(gridCol - col) <= tolerance;
        });
    }
    
    // 敌人到达终点处理
    onEnemyReachedEnd(enemyData) {
        console.log('敌人到达终点:', enemyData);

        // 触发路径失效事件
        EventBus.emit('lane-breached', {
            lane: enemyData.lane,
            enemyData: enemyData
        });
    }
    
    // 敌人被消灭处理
    onEnemyKilled(enemyData) {
        console.log('敌人被消灭:', enemyData);
        // 这里可以添加奖励能量等逻辑
    }
    
    // 设置生成间隔
    setSpawnInterval(interval) {
        this.spawnInterval = Math.max(500, interval); // 最小500ms间隔
        console.log('设置生成间隔:', this.spawnInterval, 'ms');
    }
    
    // 清除所有敌人
    clearAllEnemies() {
        console.log('清除所有敌人');

        // 销毁所有敌人
        for (const enemy of this.activeEnemies) {
            enemy.destroy();
        }

        // 清空管理器
        this.enemies.clear();
        this.activeEnemies.length = 0;

        // 重置统计
        this.stats.currentAlive = 0;
    }

    // 完全重置敌人管理器状态
    resetEnemyManager() {
        console.log('完全重置敌人管理器状态');

        // 停止生成
        this.stopSpawning();

        // 清除所有敌人
        this.clearAllEnemies();

        // 重置所有状态
        this.isSpawning = false;
        this.wavePaused = false;
        this.spawnInterval = 2000;
        this.lastSpawnTime = 0;

        // 重置统计数据
        this.stats = {
            totalSpawned: 0,
            totalKilled: 0,
            currentAlive: 0
        };

        console.log('敌人管理器状态已完全重置');
    }
    
    // 暂停/恢复敌人更新
    pauseEnemies() {
        this.wavePaused = true;
        console.log('暂停敌人更新');
    }
    
    resumeEnemies() {
        this.wavePaused = false;
        console.log('恢复敌人更新');
    }
    
    // 获取统计信息
    getStats() {
        return {
            ...this.stats,
            spawnInterval: this.spawnInterval,
            isSpawning: this.isSpawning,
            wavePaused: this.wavePaused
        };
    }
    
    // 获取所有活跃敌人信息（调试用）
    getActiveEnemiesInfo() {
        return this.activeEnemies.map(enemy => enemy.getInfo());
    }

    // 获取活跃敌人数量
    getActiveEnemyCount() {
        return this.activeEnemies.length;
    }
    
    // 游戏暂停处理
    onGamePause() {
        this.isPaused = true;
        
        // 保存当前生成时间状态
        if (this.isSpawning && this.nextSpawnTime > 0) {
            this.pausedSpawnTime = this.nextSpawnTime - this.scene.time.now;
        }
        
        console.log('EnemyManager: 游戏已暂停');
    }
    
    // 游戏恢复处理
    onGameResume() {
        this.isPaused = false;
        
        // 恢复生成时间状态
        if (this.isSpawning && this.pausedSpawnTime > 0) {
            this.nextSpawnTime = this.scene.time.now + this.pausedSpawnTime;
            this.pausedSpawnTime = 0;
        }
        
        console.log('EnemyManager: 游戏已恢复');
    }
    
    // 销毁管理器
    destroy() {
        console.log('销毁 EnemyManager');
        
        // 停止生成
        this.stopSpawning();
        
        // 清除所有敌人
        this.clearAllEnemies();
        
        // 清理事件监听器
        EventBus.off('enemy-reached-end');
        EventBus.off('enemy-killed');
        EventBus.off('game-pause');
        EventBus.off('game-resume');
        
        // 清理引用
        this.scene = null;
        this.enemies = null;
        this.activeEnemies = null;
        this.spawnQueue = null;
    }
} 