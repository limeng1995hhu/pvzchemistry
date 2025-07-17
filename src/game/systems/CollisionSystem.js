import { EventBus } from '../EventBus.js';

/**
 * 碰撞检测系统
 * 负责处理游戏中各种实体之间的碰撞检测
 */
export class CollisionSystem {
    constructor(scene) {
        this.scene = scene;
        
        // 碰撞检测配置
        this.config = {
            recyclerDetectionRadius: 0.6, // 回收器检测半径（相对于网格大小）
            reactorDetectionRadius: 0.8,  // 反应器检测半径
            enableDebugDraw: false         // 是否显示调试绘制
        };
        
        // 调试绘制
        this.debugGraphics = null;
        
        // 性能优化
        this.lastUpdateTime = 0;
        this.updateInterval = 50; // 每50ms检测一次碰撞
        
        this.init();
    }
    
    init() {
        if (this.config.enableDebugDraw) {
            this.debugGraphics = this.scene.add.graphics();
            this.debugGraphics.setDepth(10);
        }
        
        console.log('CollisionSystem 初始化完成');
    }
    
    // 主更新方法
    update(time, delta) {
        // 性能优化：不每帧都检测碰撞
        if (time - this.lastUpdateTime < this.updateInterval) {
            return;
        }
        this.lastUpdateTime = time;
        
        // 清除调试绘制
        if (this.debugGraphics) {
            this.debugGraphics.clear();
        }
        
        // 检测回收器碰撞
        this.checkRecyclerCollisions();
        
        // 检测反应器碰撞
        this.checkReactorCollisions();
    }
    
    // 检测回收器与敌人的碰撞
    checkRecyclerCollisions() {
        if (!this.scene.buildingPlacementSystem || !this.scene.enemyManager) {
            return;
        }
        
        const buildings = this.scene.buildingPlacementSystem.buildings;
        
        buildings.forEach(building => {
            if (building.type === 'recycler' && building.targetSubstance) {
                this.checkBuildingEnemyCollision(building, 'recycle');
            }
        });
    }
    
    // 检测反应器与敌人的碰撞
    checkReactorCollisions() {
        if (!this.scene.buildingPlacementSystem || !this.scene.enemyManager) {
            return;
        }
        
        const buildings = this.scene.buildingPlacementSystem.buildings;
        
        buildings.forEach(building => {
            if (building.type === 'reactor' && building.elements.length > 0) {
                this.checkBuildingEnemyCollision(building, 'react');
            }
        });
    }
    
    // 检测建筑与敌人的碰撞
    checkBuildingEnemyCollision(building, interactionType) {
        const buildingBounds = this.getBuildingBounds(building);
        const detectionRadius = this.getDetectionRadius(building.type);
        
        // 调试绘制检测范围
        if (this.debugGraphics) {
            this.drawDetectionRadius(buildingBounds.centerX, buildingBounds.centerY, detectionRadius);
        }
        
        // 获取检测范围内的敌人
        const enemiesInRange = this.scene.enemyManager.getEnemiesInRange(
            buildingBounds.centerX,
            buildingBounds.centerY,
            detectionRadius
        );
        
        // 处理碰撞
        for (const enemy of enemiesInRange) {
            if (this.handleBuildingEnemyInteraction(building, enemy, interactionType)) {
                break; // 一次只处理一个敌人
            }
        }
    }
    
    // 处理建筑与敌人的交互
    handleBuildingEnemyInteraction(building, enemy, interactionType) {
        switch (interactionType) {
            case 'recycle':
                return this.handleRecycleInteraction(building, enemy);
            case 'react':
                return this.handleReactInteraction(building, enemy);
            default:
                return false;
        }
    }
    
    // 处理回收交互
    handleRecycleInteraction(building, enemy) {
        console.log(`碰撞检测: 回收器(目标=${building.targetSubstance}) vs 敌人(${enemy.substance})`);

        if (building.canRecycleEnemy(enemy)) {
            // 计算能量奖励
            const energyReward = this.calculateEnergyReward(enemy);

            // 给予能量奖励
            if (this.scene.hud) {
                this.scene.hud.addEnergy(energyReward);
                this.scene.hud.showMessage(`+${energyReward}⚡ 回收 ${enemy.formula}`, '#4ecdc4');
            }

            // 触发回收成功
            building.onRecycleSuccess(enemy);

            // 移除敌人
            enemy.die();

            // 发送回收事件
            EventBus.emit('enemy-recycled', {
                enemyId: enemy.id,
                substance: enemy.substance,
                formula: enemy.formula,
                energyReward: energyReward,
                recyclerPos: { row: building.gridRow, col: building.gridCol }
            });

            console.log(`✅ 回收器成功回收敌人: ${enemy.formula}, 获得 ${energyReward} 能量`);
            return true;
        }
        console.log(`❌ 回收器无法回收敌人: ${enemy.formula}`);
        return false;
    }
    
    // 处理反应交互
    handleReactInteraction(building, enemy) {
        // 这里将来实现化学反应逻辑
        // 暂时返回false
        console.log(`反应器尝试与 ${enemy.formula} 反应`);
        return false;
    }
    
    // 计算能量奖励
    calculateEnergyReward(enemy) {
        let baseReward = 10; // 基础奖励
        
        // 根据敌人血量计算奖励
        const healthBonus = Math.floor(enemy.maxHealth / 10);
        
        // 根据物态计算奖励倍数
        const stateMultiplier = {
            'gas': 1.0,
            'liquid': 1.2,
            'solid': 1.5
        };
        
        const multiplier = stateMultiplier[enemy.state] || 1.0;
        
        return Math.floor((baseReward + healthBonus) * multiplier);
    }
    
    // 获取建筑边界框
    getBuildingBounds(building) {
        const size = this.scene.gridSystem ? this.scene.gridSystem.cellSize : 50;
        const halfSize = size / 2;
        
        return {
            x: building.x - halfSize,
            y: building.y - halfSize,
            width: size,
            height: size,
            centerX: building.x,
            centerY: building.y
        };
    }
    
    // 获取检测半径
    getDetectionRadius(buildingType) {
        const cellSize = this.scene.gridSystem ? this.scene.gridSystem.cellSize : 50;
        
        switch (buildingType) {
            case 'recycler':
                return cellSize * this.config.recyclerDetectionRadius;
            case 'reactor':
                return cellSize * this.config.reactorDetectionRadius;
            default:
                return cellSize * 0.5;
        }
    }
    
    // 调试绘制检测半径
    drawDetectionRadius(x, y, radius) {
        if (this.debugGraphics) {
            this.debugGraphics.lineStyle(2, 0xff0000, 0.5);
            this.debugGraphics.strokeCircle(x, y, radius);
        }
    }
    
    // 点与圆的碰撞检测
    pointInCircle(pointX, pointY, circleX, circleY, radius) {
        const dx = pointX - circleX;
        const dy = pointY - circleY;
        return (dx * dx + dy * dy) <= (radius * radius);
    }
    
    // 圆与圆的碰撞检测
    circleToCircle(x1, y1, r1, x2, y2, r2) {
        const dx = x1 - x2;
        const dy = y1 - y2;
        const distance = Math.sqrt(dx * dx + dy * dy);
        return distance <= (r1 + r2);
    }
    
    // 矩形与圆的碰撞检测
    rectToCircle(rectX, rectY, rectW, rectH, circleX, circleY, radius) {
        const closestX = Math.max(rectX, Math.min(circleX, rectX + rectW));
        const closestY = Math.max(rectY, Math.min(circleY, rectY + rectH));
        
        const dx = circleX - closestX;
        const dy = circleY - closestY;
        
        return (dx * dx + dy * dy) <= (radius * radius);
    }
    
    // 设置调试模式
    setDebugMode(enabled) {
        this.config.enableDebugDraw = enabled;
        
        if (enabled && !this.debugGraphics) {
            this.debugGraphics = this.scene.add.graphics();
            this.debugGraphics.setDepth(10);
        } else if (!enabled && this.debugGraphics) {
            this.debugGraphics.destroy();
            this.debugGraphics = null;
        }
    }
    
    // 销毁系统
    destroy() {
        if (this.debugGraphics) {
            this.debugGraphics.destroy();
        }
        
        this.scene = null;
        this.debugGraphics = null;
        
        console.log('CollisionSystem 已销毁');
    }
}
