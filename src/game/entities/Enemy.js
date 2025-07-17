import { getChemicalData, StateSpeedMultipliers, LaneConfig } from '../data/chemicals.js';
import { EventBus } from '../EventBus.js';

export class Enemy {
    constructor(scene, substanceId, lane = null) {
        this.scene = scene;
        this.substanceId = substanceId;
        
        // 获取化学物质数据
        this.chemicalData = getChemicalData(substanceId);
        if (!this.chemicalData) {
            console.error('未找到化学物质数据:', substanceId);
            return;
        }
        
        // 基础属性
        this.id = Math.random().toString(36).substr(2, 9);
        this.substance = this.chemicalData.id;
        this.formula = this.chemicalData.formula;
        this.state = this.chemicalData.state;
        this.health = this.chemicalData.health;
        this.maxHealth = this.health;

        // 物质数量系统
        this.substanceAmount = this.chemicalData.substanceAmount || 3; // 默认物质数量为3
        this.maxSubstanceAmount = this.substanceAmount;
        
        // 确定所在路径
        this.lane = this.determineLane(lane);
        
        // 移动属性
        this.baseSpeed = this.chemicalData.speed;
        this.speedMultiplier = StateSpeedMultipliers[this.state] || 1.0;
        // 应用全局速度减半
        this.speed = (this.baseSpeed * this.speedMultiplier) * 0.5;
        
        // 位置属性
        this.startCol = 11; // 从第12列开始（索引11）
        this.endCol = 0;    // 到第1列结束（索引0）
        this.currentCol = this.startCol;
        this.progress = 0;  // 0-1之间，表示移动进度
        
        // 网格位置
        this.gridRow = this.lane;
        this.gridCol = this.currentCol;
        
        // 世界坐标
        this.x = 0;
        this.y = 0;
        
        // 视觉组件
        this.container = null;
        this.sprite = null;
        this.formulaLabel = null;
        this.healthBar = null;
        
        // 状态
        this.isAlive = true;
        this.reachedEnd = false;
        
        this.create();
    }
    
    // 确定敌人所在路径
    determineLane(preferredLane = null) {
        const availableLanes = LaneConfig[this.state];
        
        if (preferredLane !== null && availableLanes.includes(preferredLane)) {
            return preferredLane;
        }
        
        // 随机选择该物态对应的路径
        return availableLanes[Math.floor(Math.random() * availableLanes.length)];
    }
    
    create() {
        // 获取初始位置
        const initialPos = this.getWorldPosition();
        
        // 创建敌人容器
        this.container = this.scene.add.container(initialPos.x, initialPos.y);
        
        // 创建敌人主体
        this.createSprite();
        
        // 创建化学式标签
        this.createFormulaLabel();
        
        // 创建生命值条
        this.createHealthBar();
        
        // 设置容器深度
        this.container.setDepth(5);
    }
    
    createSprite() {
        const size = this.getSize();
        
        // 创建圆形精灵作为敌人主体
        this.sprite = this.scene.add.circle(0, 0, size/2, this.chemicalData.color);
        this.sprite.setStrokeStyle(2, 0xffffff, 0.8);
        
        // 添加到容器
        this.container.add(this.sprite);
    }
    
    createFormulaLabel() {
        // 创建化学式显示（包含系数）
        if (this.substanceAmount > 1) {
            // 创建数量标签（粗体）
            this.amountLabel = this.scene.add.text(-10, -this.getSize()/2 - 20, this.substanceAmount.toString(), {
                fontFamily: 'Arial Bold',
                fontSize: '20px',
                color: '#ffffff',
                resolution: 2
            }).setOrigin(1, 0.5); // 右对齐

            // 创建化学式标签（正常字体）
            this.formulaLabel = this.scene.add.text(-8, -this.getSize()/2 - 20, this.formula, {
                fontFamily: 'Arial',
                fontSize: '18px',
                color: '#ffffff',
                resolution: 2
            }).setOrigin(0, 0.5); // 左对齐

            // 添加到容器
            this.container.add([this.amountLabel, this.formulaLabel]);
        } else {
            // 只显示化学式
            this.formulaLabel = this.scene.add.text(0, -this.getSize()/2 - 20, this.formula, {
                fontFamily: 'Arial',
                fontSize: '18px',
                color: '#ffffff',
                resolution: 2
            }).setOrigin(0.5);

            // 添加到容器
            this.container.add(this.formulaLabel);
        }
    }
    
    createHealthBar() {
        // 不再创建血条相关对象，实现为空操作
        this.healthBar = null;
        this.healthBarBg = null;
    }
    
    // 获取敌人大小
    getSize() {
        // 根据网格系统获取合适的大小
        const gridSystem = this.scene.gridSystem;
        if (gridSystem) {
            return gridSystem.cellSize * 0.6; // 占网格的60%
        }
        return 30; // 默认大小
    }
    
    // 获取世界坐标位置
    getWorldPosition() {
        const gridSystem = this.scene.gridSystem;
        if (gridSystem) {
            // 计算当前在路径上的精确位置
            const startPos = gridSystem.gridToWorld(this.gridRow, this.startCol);
            const endPos = gridSystem.gridToWorld(this.gridRow, this.endCol);
            
            if (startPos && endPos) {
                const x = startPos.x + (endPos.x - startPos.x) * this.progress;
                const y = startPos.y;
                return { x, y };
            }
        }
        
        // 回退方案
        return { x: 600, y: 300 };
    }
    
    // 更新敌人状态
    update(time, delta) {
        if (!this.isAlive || this.reachedEnd) {
            return;
        }
        
        // 更新移动
        this.updateMovement(delta);
        
        // 更新位置
        this.updatePosition();
        
        // 检查是否到达终点
        this.checkEndReached();
    }
    
    // 更新移动逻辑
    updateMovement(delta) {
        // 计算移动距离（像素/秒转换为像素/毫秒）
        const moveDistance = (this.speed * delta) / 1000;
        
        // 计算总路径长度
        const gridSystem = this.scene.gridSystem;
        if (gridSystem) {
            const totalDistance = gridSystem.gridSize ? 
                gridSystem.gridSize.width * (this.startCol - this.endCol) : 
                600; // 默认总距离
            
            // 更新进度
            this.progress += moveDistance / totalDistance;
            this.progress = Math.min(1.0, this.progress);
            
            // 更新网格列位置
            this.gridCol = this.startCol - Math.floor(this.progress * (this.startCol - this.endCol));
        }
    }
    
    // 更新视觉位置
    updatePosition() {
        const worldPos = this.getWorldPosition();
        this.x = worldPos.x;
        this.y = worldPos.y;
        
        if (this.container) {
            this.container.setPosition(this.x, this.y);
        }
    }
    
    // 检查是否到达终点
    checkEndReached() {
        if (this.progress >= 1.0 && !this.reachedEnd) {
            this.reachedEnd = true;
            console.log(`敌人 ${this.formula} 到达终点`);

            // 发送敌人到达终点事件
            EventBus.emit('enemy-reached-end', {
                enemyId: this.id,
                substance: this.substance,
                formula: this.formula,
                state: this.state,
                lane: this.lane
            });
        }
    }
    
    // 受到伤害
    takeDamage(damage) {
        if (!this.isAlive) return false;

        this.health = Math.max(0, this.health - damage);
        this.updateHealthBar();

        if (this.health <= 0) {
            this.die();
            return true; // 敌人死亡
        }

        return false; // 敌人存活
    }

    // 消耗物质数量
    consumeSubstance(amount) {
        if (!this.isAlive) return 0;

        const actualConsumed = Math.min(amount, this.substanceAmount);
        this.substanceAmount -= actualConsumed;

        // 更新物质数量显示
        this.updateAmountDisplay();

        // 如果物质数量归零，敌人消失
        if (this.substanceAmount <= 0) {
            console.log(`敌人 ${this.formula} 物质数量归零，消失`);
            this.die();
        }

        return actualConsumed;
    }

    // 更新物质数量显示
    updateAmountDisplay() {
        // 先移除旧的标签
        if (this.amountLabel) {
            this.amountLabel.destroy();
            this.amountLabel = null;
        }
        if (this.formulaLabel) {
            this.formulaLabel.destroy();
            this.formulaLabel = null;
        }

        // 重新创建标签
        this.createFormulaLabel();

        // 根据剩余数量改变颜色
        let color;
        if (this.substanceAmount <= 1) {
            color = '#ff8888'; // 浅红色警告
        } else if (this.substanceAmount <= 2) {
            color = '#ffaa88'; // 橙色警告
        } else {
            color = '#ffffff'; // 正常白色
        }

        // 应用颜色
        if (this.amountLabel) {
            this.amountLabel.setColor(color);
        }
        if (this.formulaLabel) {
            this.formulaLabel.setColor(color);
        }
    }
    
    // 更新生命值条
    updateHealthBar() {
        if (this.healthBar) {
            const healthPercent = this.health / this.maxHealth;
            const barWidth = this.getSize() * 0.8 * healthPercent;
            this.healthBar.setSize(barWidth, 4);
            
            // 根据血量改变颜色
            if (healthPercent > 0.6) {
                this.healthBar.setFillStyle(0x00ff00); // 绿色
            } else if (healthPercent > 0.3) {
                this.healthBar.setFillStyle(0xffff00); // 黄色
            } else {
                this.healthBar.setFillStyle(0xff0000); // 红色
            }
        }
    }
    
    // 敌人死亡
    die() {
        this.isAlive = false;
        console.log(`敌人 ${this.formula} 被消灭`);

        // 发送敌人死亡事件
        EventBus.emit('enemy-killed', {
            enemyId: this.id,
            substance: this.substance,
            formula: this.formula
        });

        // 播放死亡效果
        this.playDeathEffect();
    }
    
    // 播放死亡特效
    playDeathEffect() {
        if (this.container) {
            this.scene.tweens.add({
                targets: this.container,
                scaleX: 1.5,
                scaleY: 1.5,
                alpha: 0,
                duration: 300,
                ease: 'Power2',
                onComplete: () => {
                    this.destroy();
                }
            });
        }
    }
    
    // 获取敌人边界框（用于碰撞检测）
    getBounds() {
        const size = this.getSize();
        const halfSize = size / 2;
        
        return {
            x: this.x - halfSize,
            y: this.y - halfSize,
            width: size,
            height: size,
            centerX: this.x,
            centerY: this.y
        };
    }
    
    // 检查是否与点或区域相交
    intersects(x, y, radius = 0) {
        const distance = Math.sqrt((this.x - x) ** 2 + (this.y - y) ** 2);
        return distance <= (this.getSize() / 2 + radius);
    }
    
    // 销毁敌人
    destroy() {
        if (this.container) {
            this.container.destroy();
        }

        // 清理引用
        this.container = null;
        this.sprite = null;
        this.formulaLabel = null;
        this.amountLabel = null;
        this.healthBar = null;
        this.scene = null;
    }
    
    // 获取敌人信息（用于调试）
    getInfo() {
        return {
            id: this.id,
            substance: this.substance,
            formula: this.formula,
            state: this.state,
            health: this.health,
            lane: this.lane,
            progress: this.progress,
            isAlive: this.isAlive,
            reachedEnd: this.reachedEnd
        };
    }
} 