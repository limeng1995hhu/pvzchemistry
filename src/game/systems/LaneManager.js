import { EventBus } from '../EventBus.js';
import { LaneConfig } from '../data/chemicals.js';

export class LaneManager {
    constructor(scene) {
        this.scene = scene;
        
        // 路径状态
        this.laneStatus = {
            gas: [true, true],     // 气态路径状态 [0, 1]
            liquid: [true, true],  // 液态路径状态 [2, 3]
            solid: [true, true]    // 固态路径状态 [4, 5]
        };
        
        // 路径类型计数
        this.activeLaneTypes = {
            gas: 2,
            liquid: 2,
            solid: 2
        };
        
        // 初始化
        this.init();
    }
    
    init() {
        console.log('LaneManager 初始化');
        
        // 设置事件监听
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        // 监听路径被突破事件
        EventBus.on('lane-breached', (data) => {
            this.onLaneBreached(data);
        });
    }
    
    // 路径被突破处理
    onLaneBreached(data) {
        const { lane } = data;
        console.log(`路径 ${lane} 被突破`);
        
        // 获取路径类型
        const laneType = this.getLaneTypeFromRow(lane);
        if (!laneType) {
            console.error('无效的路径行:', lane);
            return;
        }
        
        // 禁用该路径
        this.disableLane(laneType, lane);
        
        // 检查游戏失败条件
        this.checkGameOverCondition();
    }
    
    // 根据行号获取路径类型
    getLaneTypeFromRow(row) {
        if (row >= 0 && row <= 1) return 'gas';
        if (row >= 2 && row <= 3) return 'liquid';
        if (row >= 4 && row <= 5) return 'solid';
        return null;
    }
    
    // 禁用路径
    disableLane(laneType, row) {
        // 计算在该类型中的索引
        const index = row % 2;

        // 如果路径已经禁用，不需要重复处理
        if (!this.laneStatus[laneType][index]) {
            return;
        }

        // 禁用路径
        this.laneStatus[laneType][index] = false;
        this.activeLaneTypes[laneType]--;

        console.log(`禁用路径: ${laneType} 行 ${row}`);

        // 移除该路径上的所有建筑
        this.removeAllBuildingsInLane(row);

        // 移除该路径上的所有敌人
        this.removeAllEnemiesInLane(row);

        // 发送路径禁用事件
        EventBus.emit('lane-disabled', {
            laneType,
            row,
            remainingLanes: this.activeLaneTypes[laneType]
        });
    }
    
    // 移除指定路径上的所有建筑
    removeAllBuildingsInLane(row) {
        if (!this.scene.buildingPlacementSystem) {
            console.error('建筑放置系统不可用');
            return;
        }
        
        const buildingSystem = this.scene.buildingPlacementSystem;
        const gridSystem = this.scene.gridSystem;
        
        if (!gridSystem) {
            console.error('网格系统不可用');
            return;
        }
        
        // 遍历该行的所有列，移除建筑
        for (let col = 0; col < gridSystem.cols; col++) {
            buildingSystem.removeBuilding(row, col);
        }
        
        console.log(`已移除路径 ${row} 上的所有建筑`);
    }

    // 移除指定路径上的所有敌人
    removeAllEnemiesInLane(row) {
        if (!this.scene.enemyManager) {
            console.error('敌人管理系统不可用');
            return;
        }

        const enemyManager = this.scene.enemyManager;

        // 获取该路径上的所有敌人
        const enemiesInLane = enemyManager.getEnemiesInLane(row);

        console.log(`路径 ${row} 上有 ${enemiesInLane.length} 个敌人需要移除`);

        // 移除所有敌人
        enemiesInLane.forEach(enemy => {
            enemyManager.removeEnemy(enemy.id, 'lane-disabled');
        });

        console.log(`已移除路径 ${row} 上的所有敌人`);
    }

    // 检查路径是否可用
    isLaneActive(row) {
        const laneType = this.getLaneTypeFromRow(row);
        if (!laneType) return false;

        const index = row % 2;
        return this.laneStatus[laneType][index];
    }
    
    // 检查游戏失败条件
    checkGameOverCondition() {
        // 检查是否有任何一种物态的路径全部被禁用
        for (const type in this.activeLaneTypes) {
            if (this.activeLaneTypes[type] === 0) {
                console.log(`所有${type}路径都已被禁用，游戏失败`);
                this.triggerGameOver(type);
                return;
            }
        }
    }
    
    // 触发游戏失败
    triggerGameOver(failedLaneType) {
        EventBus.emit('game-over', {
            reason: 'all-lanes-disabled',
            laneType: failedLaneType
        });
    }
    
    // 获取指定物态的可用路径
    getAvailableLanesForState(state) {
        const laneType = state; // 物态直接对应路径类型
        const availableLanes = [];

        if (this.laneStatus[laneType]) {
            this.laneStatus[laneType].forEach((isActive, index) => {
                if (isActive) {
                    // 计算实际的行号
                    let row;
                    switch (laneType) {
                        case 'gas':
                            row = index; // 0, 1
                            break;
                        case 'liquid':
                            row = index + 2; // 2, 3
                            break;
                        case 'solid':
                            row = index + 4; // 4, 5
                            break;
                    }
                    availableLanes.push(row);
                }
            });
        }

        return availableLanes;
    }

    // 获取路径状态
    getLaneStatus() {
        return {
            laneStatus: { ...this.laneStatus },
            activeLaneTypes: { ...this.activeLaneTypes }
        };
    }

    // 重置路径管理器状态
    resetLaneManager() {
        console.log('重置路径管理器状态');

        // 重置所有路径为启用状态
        this.laneStatus = {
            gas: [true, true],     // 气态路径状态 [0, 1]
            liquid: [true, true],  // 液态路径状态 [2, 3]
            solid: [true, true]    // 固态路径状态 [4, 5]
        };

        // 重置路径类型计数
        this.activeLaneTypes = {
            gas: 2,
            liquid: 2,
            solid: 2
        };

        console.log('路径管理器状态重置完成 - 所有路径已启用');
    }

    // 销毁管理器
    destroy() {
        // 清理事件监听
        EventBus.off('lane-breached');

        console.log('LaneManager 已销毁');
    }
}
