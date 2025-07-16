export class Building {
    constructor(scene, x, y, type, config = {}) {
        this.scene = scene;
        this.x = x;
        this.y = y;
        this.type = type; // 'recycler' | 'reactor'
        this.config = config;
        
        // 网格位置
        this.gridRow = -1;
        this.gridCol = -1;
        
        // 建筑属性
        this.health = config.health || 100;
        this.maxHealth = this.health;
        this.level = 1;
        
        // 视觉组件
        this.container = null;
        this.sprite = null;
        this.healthBar = null;
        this.elementLabel = null; // 显示元素的标签
        
        this.create();
    }
    
    create() {
        console.log('创建建筑:', this.type, 'at', this.x, this.y);
        
        // 创建建筑容器
        this.container = this.scene.add.container(this.x, this.y);
        
        // 根据建筑类型创建不同的外观
        this.createSprite();
        
        // 创建血量条（可选）
        if (this.config.showHealthBar) {
            this.createHealthBar();
        }
        
        // 设置交互性
        this.setupInteractivity();
    }
    
    createSprite() {
        const size = this.config.size || 50;
        
        // 建筑背景
        this.background = this.scene.add.rectangle(0, 0, size, size, this.getColor(), 0.8);
        this.background.setStrokeStyle(2, 0xffffff);
        
        // 建筑图标 - 增大字体占满网格
        const iconSize = Math.max(size * 0.6, 32); // 图标大小为网格的60%，最小32px
        this.icon = this.scene.add.text(0, 0, this.getIcon(), {
            fontFamily: 'Arial Bold',
            fontSize: `${iconSize}px`,
            color: '#ffffff',
            resolution: 2
        }).setOrigin(0.5);
        
        // 创建元素标签（初始为空）
        this.elementLabel = this.scene.add.text(0, -size/2 - 15, '', {
            fontFamily: 'Arial Bold',
            fontSize: '14px',
            color: '#ffffff',
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            padding: { x: 6, y: 3 },
            resolution: 2
        }).setOrigin(0.5);
        this.elementLabel.setVisible(false);
        
        // 添加到容器
        this.container.add([this.background, this.icon, this.elementLabel]);
    }
    
    createHealthBar() {
        const barWidth = 40;
        const barHeight = 4;
        
        // 血量条背景
        this.healthBarBg = this.scene.add.rectangle(0, -30, barWidth, barHeight, 0x333333);
        
        // 血量条前景
        this.healthBar = this.scene.add.rectangle(0, -30, barWidth, barHeight, 0x00ff00);
        
        this.container.add([this.healthBarBg, this.healthBar]);
    }
    
    setupInteractivity() {
        this.background.setInteractive();
        
        // 悬停效果
        this.background.on('pointerover', () => {
            this.background.setAlpha(1.0);
            this.container.setScale(1.1);
        });
        
        this.background.on('pointerout', () => {
            this.background.setAlpha(0.8);
            this.container.setScale(1.0);
        });
        
        // 点击事件
        this.background.on('pointerdown', () => {
            this.onClicked();
        });
    }
    
    // 获取建筑颜色（子类可重写）
    getColor() {
        switch (this.type) {
            case 'recycler': return 0x16213e;
            case 'reactor': return 0x000000; // 改为黑色
            default: return 0x666666;
        }
    }
    
    // 获取建筑图标（子类可重写）
    getIcon() {
        switch (this.type) {
            case 'recycler': return '♻';
            case 'reactor': return '🔥'; // 改为火焰图标表示加热反应
            default: return '?';
        }
    }
    
    // 获取建筑名称（子类可重写）
    getName() {
        switch (this.type) {
            case 'recycler': return '回收器';
            case 'reactor': return '反应器';
            default: return '建筑';
        }
    }
    
    // 设置网格位置
    setGridPosition(row, col) {
        this.gridRow = row;
        this.gridCol = col;
    }

    // 将元素名称转换为化学式
    getChemicalFormula(elementName) {
        const formulaMap = {
            '氢气': 'H₂',
            '氧气': 'O₂', 
            '碳': 'C',
            '氮气': 'N₂',
            // 可以根据需要添加更多元素映射
            'H₂': 'H₂',
            'O₂': 'O₂',
            'C': 'C',
            'N₂': 'N₂'
        };
        return formulaMap[elementName] || elementName;
    }
    
    // 设置世界位置
    setPosition(x, y) {
        this.x = x;
        this.y = y;
        if (this.container) {
            this.container.setPosition(x, y);
        }
    }
    
    // 更新血量条
    updateHealthBar() {
        if (this.healthBar) {
            const healthPercent = this.health / this.maxHealth;
            const barWidth = 40 * healthPercent;
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
    
    // 受到伤害
    takeDamage(damage) {
        this.health = Math.max(0, this.health - damage);
        this.updateHealthBar();
        
        if (this.health <= 0) {
            this.destroy();
        }
    }
    
    // 修复建筑
    repair(amount) {
        this.health = Math.min(this.maxHealth, this.health + amount);
        this.updateHealthBar();
    }
    
    // 点击事件处理
    onClicked() {
        console.log(`${this.getName()} 被点击`);
        // 子类可重写此方法
    }
    
    // 更新逻辑（每帧调用）
    update(time, delta) {
        // 子类可重写此方法添加具体的建筑逻辑
    }
    
    // 销毁建筑
    destroy() {
        if (this.container) {
            this.container.destroy();
        }
        this.container = null;
        this.sprite = null;
        this.healthBar = null;
    }

    // 显示元素标签
    showElementLabel(text) {
        if (this.elementLabel) {
            this.elementLabel.setText(text);
            this.elementLabel.setVisible(true);
        }
    }

    // 隐藏元素标签
    hideElementLabel() {
        if (this.elementLabel) {
            this.elementLabel.setVisible(false);
        }
    }
}

// 回收器类
export class Recycler extends Building {
    constructor(scene, x, y, config = {}) {
        super(scene, x, y, 'recycler', config);
        
        // 回收器特有属性
        this.targetSubstance = config.targetSubstance || null;
        this.recycleRate = config.recycleRate || 1;
        this.energyReward = config.energyReward || 10;
    }
    
    // 设置目标物质
    setTargetSubstance(substance) {
        this.targetSubstance = substance;
        // 更新显示
        this.updateDisplay();
    }
    
    updateDisplay() {
        // 显示目标物质在建筑上方
        if (this.targetSubstance) {
            // 将元素名称转换为化学式显示
            const formula = this.getChemicalFormula(this.targetSubstance);
            this.showElementLabel(formula);
            // 设置图标颜色表示已设置目标
            if (this.icon) {
                this.icon.setTint(0x00ff00); // 绿色表示已设置目标
            }
        } else {
            this.hideElementLabel();
            if (this.icon) {
                this.icon.clearTint();
            }
        }
    }
    
    // 尝试回收敌人
    tryRecycle(enemy) {
        if (!this.targetSubstance || enemy.substance === this.targetSubstance) {
            // 回收成功
            this.onRecycleSuccess(enemy);
            return true;
        }
        return false;
    }
    
    onRecycleSuccess(enemy) {
        console.log(`回收器回收了 ${enemy.substance}`);
        // 触发回收特效
        this.playRecycleEffect();
    }
    
    playRecycleEffect() {
        // 简单的回收特效
        this.scene.tweens.add({
            targets: this.container,
            scaleX: 1.2,
            scaleY: 1.2,
            duration: 200,
            yoyo: true,
            ease: 'Power2'
        });
    }
}

// 反应器类
export class Reactor extends Building {
    constructor(scene, x, y, config = {}) {
        super(scene, x, y, 'reactor', config);
        
        // 反应器特有属性
        this.elements = []; // 存储的元素
        this.maxElements = config.maxElements || 3;
        this.reactionRate = config.reactionRate || 1;
    }
    
    // 添加元素
    addElement(element) {
        if (this.elements.length < this.maxElements) {
            this.elements.push(element);
            this.updateDisplay();
            return true;
        }
        return false;
    }
    
    // 移除元素
    removeElement(index) {
        if (index >= 0 && index < this.elements.length) {
            const removed = this.elements.splice(index, 1)[0];
            this.updateDisplay();
            return removed;
        }
        return null;
    }
    
    updateDisplay() {
        // 显示存储的元素在建筑上方
        if (this.elements.length > 0) {
            // 将元素符号转换为化学式显示
            const formulas = this.elements.map(element => this.getChemicalFormula(element));
            const elementStr = formulas.join(' + ');
            this.showElementLabel(elementStr);
            // 根据存储的元素数量改变图标颜色
            if (this.icon) {
                const intensity = this.elements.length / this.maxElements;
                const tint = Math.floor(255 * intensity);
                this.icon.setTint((tint << 16) | (tint << 8) | 255); // 蓝色渐变
            }
        } else {
            this.hideElementLabel();
            if (this.icon) {
                this.icon.clearTint(); // 无元素时恢复原色
            }
        }
    }
    
    // 尝试反应
    tryReact(enemy) {
        // 这里需要化学反应系统支持
        // 暂时返回false
        return false;
    }
    
    // 手动触发反应
    triggerReaction() {
        console.log('手动触发反应');
        this.playReactionEffect();
    }
    
    playReactionEffect() {
        // 简单的反应特效
        this.scene.tweens.add({
            targets: this.icon,
            angle: 360,
            duration: 500,
            ease: 'Power2'
        });
    }
} 