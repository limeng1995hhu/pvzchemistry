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
            fontSize: '21px', // 从14px增大50%到21px
            color: '#ffffff',
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
            // 根据建筑类型调用不同的点击处理
            if (this.type === 'recycler') {
                this.onRecyclerClicked();
            } else if (this.type === 'reactor') {
                this.onReactorClicked();
            } else {
                this.onClicked();
            }
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

    // 将物质ID转换为化学式显示
    getChemicalFormula(substanceId) {
        const formulaMap = {
            'H2': 'H₂',
            'O2': 'O₂',
            'C': 'C',
            'N2': 'N₂',
            'H2O': 'H₂O',
            'CO2': 'CO₂',
            'NaCl': 'NaCl',
            'NaOH': 'NaOH',
            'CH4': 'CH₄',
            // 兼容旧的名称映射
            '氢气': 'H₂',
            '氧气': 'O₂',
            '碳': 'C',
            '氮气': 'N₂'
        };
        return formulaMap[substanceId] || substanceId;
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

    // 回收器专用点击处理
    onRecyclerClicked() {
        console.log('回收器被点击');

        // 如果已设置目标物质，尝试储能
        if (this.targetSubstance) {
            const result = this.chargeSubstance();

            if (this.scene.hud) {
                const color = result.success ? '#4ecdc4' : '#ff0000';
                this.scene.hud.showMessage(result.message, color);
            }

            if (result.success) {
                // 播放储能特效
                this.playChargeEffect();
            }
        } else {
            if (this.scene.hud) {
                this.scene.hud.showMessage('请先拖拽元素到回收器设置目标物质（严格匹配：H₂只能消解H₂）', '#ff8800');
            }
        }
    }

    // 储能特效
    playChargeEffect() {
        // 蓝色闪光表示储能
        if (this.icon) {
            this.icon.setTint(0x0088ff);

            this.scene.time.delayedCall(300, () => {
                if (this.icon) {
                    this.icon.setTint(0x00ff00); // 恢复绿色
                }
            });
        }

        // 缩放动画
        this.scene.tweens.add({
            targets: this.container,
            scaleX: 1.1,
            scaleY: 1.1,
            duration: 150,
            yoyo: true,
            ease: 'Power2'
        });
    }

    // 反应器专用点击处理（基类中的默认实现）
    onReactorClicked() {
        console.log('反应器被点击（基类实现）');
        this.playClickEffect();
    }

    // 点击特效
    playClickEffect() {
        // 轻微的缩放动画
        this.scene.tweens.add({
            targets: this.container,
            scaleX: 1.05,
            scaleY: 1.05,
            duration: 100,
            yoyo: true,
            ease: 'Power2'
        });
    }
    
    // 更新逻辑（每帧调用）
    update(time, delta) {
        // 子类可重写此方法添加具体的建筑逻辑
    }
    
    // 销毁建筑
    destroy() {
        // 如果是反应器，清理元素显示
        if (this.type === 'reactor' && this.elementsDisplay) {
            this.elementsDisplay.forEach(display => {
                if (display) display.destroy();
            });
            this.elementsDisplay = [];
        }

        if (this.container) {
            this.container.destroy();
        }

        // 清理引用
        this.container = null;
        this.sprite = null;
        this.healthBar = null;
        this.elementLabel = null;
        this.amountLabel = null;
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

        // 物质数量和储能系统
        this.substanceAmount = 0; // 当前储存的物质数量
        this.maxSubstanceAmount = 10; // 最大储存量
        this.energyCostPerCharge = 20; // 每次储能消耗的能量

        // 初始化显示
        this.updateDisplay();
    }
    
    // 设置目标物质
    setTargetSubstance(substance) {
        this.targetSubstance = substance;
        // 设置目标物质后，初始化物质数量为1
        if (this.substanceAmount === 0) {
            this.substanceAmount = 1;
        }
        // 更新显示
        this.updateDisplay();
    }

    // 更新元素标签显示（包含物质数量）
    updateElementLabelWithAmount() {
        // 移除旧的标签
        if (this.elementLabel) {
            this.elementLabel.destroy();
            this.elementLabel = null;
        }
        if (this.amountLabel) {
            this.amountLabel.destroy();
            this.amountLabel = null;
        }

        // 只有设置了目标物质时才显示
        if (this.targetSubstance) {
            const formula = this.getChemicalFormula(this.targetSubstance);
            const color = this.substanceAmount > 0 ? '#00ff00' : '#888888'; // 绿色表示有库存，灰色表示无库存

            if (this.substanceAmount > 1) {
                // 创建数量标签（粗体）
                this.amountLabel = this.scene.add.text(-5, -this.config.size/2 - 25, this.substanceAmount.toString(), {
                    fontFamily: 'Arial Bold',
                    fontSize: '18px',
                    color: color,
                    resolution: 2
                }).setOrigin(1, 0.5); // 右对齐

                // 创建化学式标签（正常字体）
                this.elementLabel = this.scene.add.text(-3, -this.config.size/2 - 25, formula, {
                    fontFamily: 'Arial',
                    fontSize: '16px',
                    color: color,
                    resolution: 2
                }).setOrigin(0, 0.5); // 左对齐

                this.container.add([this.amountLabel, this.elementLabel]);
            } else {
                // 只显示化学式
                this.elementLabel = this.scene.add.text(0, -this.config.size/2 - 25, formula, {
                    fontFamily: 'Arial',
                    fontSize: '16px',
                    color: color,
                    resolution: 2
                }).setOrigin(0.5);

                this.container.add(this.elementLabel);
            }
        }
    }
    
    updateDisplay() {
        // 更新元素标签显示（包含物质数量）
        this.updateElementLabelWithAmount();

        // 设置图标颜色表示状态
        if (this.icon) {
            if (this.targetSubstance) {
                if (this.substanceAmount > 0) {
                    this.icon.setTint(0x00ff00); // 绿色表示有库存
                } else {
                    this.icon.setTint(0x888888); // 灰色表示无库存
                }
            } else {
                this.icon.clearTint(); // 无目标物质
            }
        }
    }
    
    // 尝试回收敌人
    tryRecycle(enemy) {
        if (this.canRecycleEnemy(enemy)) {
            // 回收成功
            this.onRecycleSuccess(enemy);
            return true;
        }
        return false;
    }

    // 检查是否可以回收敌人（严格化学物质匹配）
    canRecycleEnemy(enemy) {
        // 如果没有设置目标物质或物质数量为0，不能回收任何敌人
        if (!this.targetSubstance || this.substanceAmount <= 0) {
            return false;
        }

        // 严格匹配：回收器目标物质与敌人物质必须完全相同
        // 例如：C 只能消解 C，不能消解 CO2
        // H2 只能消解 H2，不能消解 H2O
        return this.targetSubstance === enemy.substance;
    }

    // 储能功能 - 增加物质数量
    chargeSubstance() {
        // 检查是否已设置目标物质
        if (!this.targetSubstance) {
            return { success: false, message: '请先设置目标物质' };
        }

        // 检查是否已达到最大储存量
        if (this.substanceAmount >= this.maxSubstanceAmount) {
            return { success: false, message: '已达到最大储存量' };
        }

        // 检查能量是否足够
        if (this.scene.hud && !this.scene.hud.canAfford(this.energyCostPerCharge)) {
            return { success: false, message: '能量不足' };
        }

        // 消耗能量并增加物质数量
        if (this.scene.hud && this.scene.hud.spendEnergy(this.energyCostPerCharge)) {
            this.substanceAmount++;
            this.updateDisplay();

            return {
                success: true,
                message: `储能成功！物质数量: ${this.substanceAmount}/${this.maxSubstanceAmount}`
            };
        }

        return { success: false, message: '储能失败' };
    }

    onRecycleSuccess(enemy) {
        console.log(`回收器回收了 ${enemy.substance}`);

        // 增加回收统计
        this.recycleCount = (this.recycleCount || 0) + 1;

        // 触发回收特效
        this.playRecycleEffect();

        // 更新回收器状态显示
        this.updateRecycleStatus();
    }

    // 更新回收器状态显示
    updateRecycleStatus() {
        // 可以在这里添加回收次数显示或其他状态更新
        if (this.recycleCount && this.recycleCount % 5 === 0) {
            // 每回收5个敌人，播放特殊效果
            this.playLevelUpEffect();
        }
    }

    playRecycleEffect() {
        // 回收特效：缩放动画
        this.scene.tweens.add({
            targets: this.container,
            scaleX: 1.2,
            scaleY: 1.2,
            duration: 200,
            yoyo: true,
            ease: 'Power2'
        });

        // 添加绿色闪光效果到图标
        if (this.icon) {
            this.icon.setTint(0x00ff00);

            this.scene.time.delayedCall(200, () => {
                if (this.icon) {
                    this.icon.clearTint();
                }
            });
        }

        // 添加背景颜色变化效果
        if (this.background) {
            const originalColor = this.background.fillColor;
            this.background.setFillStyle(0x00ff00, 0.8);

            this.scene.time.delayedCall(200, () => {
                if (this.background) {
                    this.background.setFillStyle(originalColor, 0.8);
                }
            });
        }
    }

    // 升级特效
    playLevelUpEffect() {
        // 旋转特效
        this.scene.tweens.add({
            targets: this.container,
            angle: 360,
            duration: 500,
            ease: 'Power2'
        });

        // 金色闪光效果到图标
        if (this.icon) {
            this.icon.setTint(0xffd700);
            this.scene.time.delayedCall(500, () => {
                if (this.icon) {
                    this.icon.clearTint();
                }
            });
        }

        // 背景金色效果
        if (this.background) {
            const originalColor = this.background.fillColor;
            this.background.setFillStyle(0xffd700, 0.8);
            this.scene.time.delayedCall(500, () => {
                if (this.background) {
                    this.background.setFillStyle(originalColor, 0.8);
                }
            });
        }
    }

    // 获取回收器状态信息
    getRecycleInfo() {
        return {
            targetSubstance: this.targetSubstance,
            recycleCount: this.recycleCount || 0,
            recycleRate: this.recycleRate,
            energyReward: this.energyReward
        };
    }
}

// 反应器类
export class Reactor extends Building {
    constructor(scene, x, y, config = {}) {
        super(scene, x, y, 'reactor', config);

        // 反应器特有属性
        this.elements = []; // 存储的元素 [{elementId, amount}, ...]
        this.maxElementTypes = 4; // 最大存储不同元素种类数量
        this.maxElementAmount = 10; // 每种元素的最大存储量
        this.reactionCooldown = 3000; // 反应冷却时间（毫秒）
        this.lastReactionTime = 0;
        this.energyCostPerCharge = 15; // 每次储能消耗的能量

        // 反应状态
        this.isReacting = false;
        this.reactionProgress = 0;

        // UI元素
        this.elementsDisplay = [];

        // 创建元素显示
        this.updateElementsDisplay();
    }

    // 添加元素（储能）
    addElement(elementId) {
        // 检查是否已存在该元素
        const existingElement = this.elements.find(e => e.elementId === elementId);

        if (existingElement) {
            // 检查是否已达到最大存储量
            if (existingElement.amount >= this.maxElementAmount) {
                return { success: false, message: '该元素已达到最大存储量' };
            }

            // 检查能量是否足够
            if (this.scene.hud && !this.scene.hud.canAfford(this.energyCostPerCharge)) {
                return { success: false, message: '能量不足' };
            }

            // 消耗能量并增加数量
            if (this.scene.hud && this.scene.hud.spendEnergy(this.energyCostPerCharge)) {
                existingElement.amount++;
                this.updateElementsDisplay();
                return {
                    success: true,
                    message: `${this.getElementName(elementId)} 数量: ${existingElement.amount}/${this.maxElementAmount}`
                };
            }
        } else {
            // 检查是否已达到最大元素种类数量
            if (this.elements.length >= this.maxElementTypes) {
                return { success: false, message: '已达到最大元素种类数量' };
            }

            // 检查能量是否足够
            if (this.scene.hud && !this.scene.hud.canAfford(this.energyCostPerCharge)) {
                return { success: false, message: '能量不足' };
            }

            // 消耗能量并添加新元素
            if (this.scene.hud && this.scene.hud.spendEnergy(this.energyCostPerCharge)) {
                this.elements.push({ elementId, amount: 1 });
                this.updateElementsDisplay();
                return {
                    success: true,
                    message: `添加 ${this.getElementName(elementId)} ×1`
                };
            }
        }

        return { success: false, message: '储能失败' };
    }

    // 移除元素
    removeElement(elementId, amount = 1) {
        const elementIndex = this.elements.findIndex(e => e.elementId === elementId);

        if (elementIndex === -1) {
            return 0; // 没有找到该元素
        }

        const element = this.elements[elementIndex];
        const actualRemoved = Math.min(amount, element.amount);

        element.amount -= actualRemoved;

        // 如果数量为0，移除该元素
        if (element.amount <= 0) {
            this.elements.splice(elementIndex, 1);
        }

        this.updateElementsDisplay();
        return actualRemoved;
    }
    
    // 更新元素显示
    updateElementsDisplay() {
        // 清除旧的显示
        this.elementsDisplay.forEach(display => {
            if (display) display.destroy();
        });
        this.elementsDisplay = [];

        // 创建新的元素显示
        if (this.elements.length > 0) {
            const startY = -this.config.size/2 - 25;
            const spacing = 20;

            this.elements.forEach((element, index) => {
                const y = startY - (index * spacing);
                const elementName = this.getElementName(element.elementId);

                if (element.amount > 1) {
                    // 创建数量标签（粗体）
                    const amountLabel = this.scene.add.text(-5, y, element.amount.toString(), {
                        fontFamily: 'Arial Bold',
                        fontSize: '14px',
                        color: '#ff6600', // 橙色
                        resolution: 2
                    }).setOrigin(1, 0.5);

                    // 创建元素标签（正常字体）
                    const elementLabel = this.scene.add.text(-3, y, elementName, {
                        fontFamily: 'Arial',
                        fontSize: '12px',
                        color: '#ff6600',
                        resolution: 2
                    }).setOrigin(0, 0.5);

                    this.container.add([amountLabel, elementLabel]);
                    this.elementsDisplay.push(amountLabel, elementLabel);
                } else {
                    // 只显示元素名称
                    const elementLabel = this.scene.add.text(0, y, elementName, {
                        fontFamily: 'Arial',
                        fontSize: '12px',
                        color: '#ff6600',
                        resolution: 2
                    }).setOrigin(0.5);

                    this.container.add(elementLabel);
                    this.elementsDisplay.push(elementLabel);
                }
            });
        }

        // 根据存储状态设置图标颜色
        if (this.icon) {
            if (this.elements.length > 0) {
                this.icon.setTint(0xff6600); // 橙色表示有元素
            } else {
                this.icon.clearTint();
            }
        }
    }

    // 获取元素名称
    getElementName(elementId) {
        const elementMap = {
            'H2': 'H₂',
            'O2': 'O₂',
            'C': 'C',
            'N2': 'N₂',
            'H': 'H',
            'O': 'O',
            'N': 'N'
        };
        return elementMap[elementId] || elementId;
    }
    
    // 检查是否可以与敌人反应
    canReactWithEnemy(enemy) {
        // 检查冷却时间
        const currentTime = this.scene.time.now;
        if (currentTime - this.lastReactionTime < this.reactionCooldown) {
            return false;
        }

        // 检查是否有存储的元素
        if (this.elements.length === 0) {
            return false;
        }

        // 检查是否正在反应中
        if (this.isReacting) {
            return false;
        }

        // 检查是否有可用的反应
        return this.findAvailableReaction(enemy) !== null;
    }

    // 查找可用的反应
    findAvailableReaction(enemy) {
        // 简单的反应规则：
        // H2 + O2 → H2O (需要2个H2和1个O2)
        // C + O2 → CO2 (需要1个C和1个O2)
        // N2 + H2 → NH3 (需要1个N2和3个H2)

        const reactions = [
            {
                id: 'water_synthesis',
                reactants: [{ elementId: 'H2', amount: 2 }, { elementId: 'O2', amount: 1 }],
                products: [{ substance: 'H2O', amount: 2 }],
                condition: (enemy) => enemy.substance === 'H2' || enemy.substance === 'O2'
            },
            {
                id: 'co2_synthesis',
                reactants: [{ elementId: 'C', amount: 1 }, { elementId: 'O2', amount: 1 }],
                products: [{ substance: 'CO2', amount: 1 }],
                condition: (enemy) => enemy.substance === 'C' || enemy.substance === 'O2'
            },
            {
                id: 'methane_synthesis',
                reactants: [{ elementId: 'C', amount: 1 }, { elementId: 'H2', amount: 2 }],
                products: [{ substance: 'CH4', amount: 1 }],
                condition: (enemy) => enemy.substance === 'C' || enemy.substance === 'H2'
            }
        ];

        for (const reaction of reactions) {
            if (reaction.condition(enemy) && this.hasRequiredReactants(reaction.reactants)) {
                return reaction;
            }
        }

        return null;
    }

    // 检查是否有所需的反应物
    hasRequiredReactants(reactants) {
        for (const reactant of reactants) {
            const element = this.elements.find(e => e.elementId === reactant.elementId);
            if (!element || element.amount < reactant.amount) {
                return false;
            }
        }
        return true;
    }

    // 尝试反应
    tryReact(enemy) {
        if (!this.canReactWithEnemy(enemy)) {
            return false;
        }

        const reaction = this.findAvailableReaction(enemy);
        if (!reaction) {
            return false;
        }

        // 执行反应
        return this.executeReaction(reaction, enemy);
    }

    // 执行反应
    executeReaction(reaction, enemy) {
        console.log(`执行反应: ${reaction.id}`);

        // 消耗反应物
        for (const reactant of reaction.reactants) {
            this.removeElement(reactant.elementId, reactant.amount);
        }

        // 消耗敌人（作为反应物之一）
        const consumedAmount = Math.min(1, enemy.substanceAmount);
        enemy.consumeSubstance(consumedAmount);

        // 生成产物（新敌人）
        for (const product of reaction.products) {
            this.spawnProductEnemy(product);
        }

        // 播放反应特效
        this.playReactionEffect();

        // 更新冷却时间
        this.lastReactionTime = this.scene.time.now;

        // 发送反应事件
        EventBus.emit('reaction-occurred', {
            reactionId: reaction.id,
            reactorPos: { row: this.gridRow, col: this.gridCol },
            consumedEnemy: enemy.substance,
            products: reaction.products
        });

        console.log(`✅ 反应成功: ${reaction.id}, 产物: ${reaction.products.map(p => p.substance).join(', ')}`);
        return true;
    }

    // 生成产物敌人
    spawnProductEnemy(product) {
        if (this.scene.enemyManager) {
            // 在反应器附近生成新敌人
            const newEnemy = this.scene.enemyManager.spawnEnemy(product.substance);
            if (newEnemy) {
                // 设置产物敌人的数量
                newEnemy.substanceAmount = product.amount;
                newEnemy.updateAmountDisplay();

                console.log(`生成产物敌人: ${product.substance} ×${product.amount}`);
            }
        }
    }

    // 手动触发反应
    triggerReaction() {
        console.log('手动触发反应');
        this.playReactionEffect();
    }

    playReactionEffect() {
        // 反应特效：旋转 + 缩放 + 颜色变化
        this.scene.tweens.add({
            targets: this.container,
            scaleX: 1.3,
            scaleY: 1.3,
            duration: 300,
            yoyo: true,
            ease: 'Power2'
        });

        // 图标旋转
        this.scene.tweens.add({
            targets: this.icon,
            angle: 360,
            duration: 500,
            ease: 'Power2'
        });

        // 颜色闪烁
        if (this.icon) {
            this.icon.setTint(0xffff00); // 黄色闪光
            this.scene.time.delayedCall(500, () => {
                if (this.icon) {
                    this.icon.setTint(0xff6600); // 恢复橙色
                }
            });
        }
    }

    // 重写反应器点击处理
    onReactorClicked() {
        console.log('反应器被点击');

        if (this.elements.length > 0) {
            // 显示反应器状态信息
            const elementsInfo = this.elements.map(e => `${this.getElementName(e.elementId)}×${e.amount}`).join(', ');
            const cooldownStatus = this.isOnCooldown() ? '冷却中' : '就绪';

            if (this.scene.hud) {
                this.scene.hud.showMessage(`反应器状态: ${elementsInfo} | ${cooldownStatus}`, '#ff6600');
            }
        } else {
            if (this.scene.hud) {
                this.scene.hud.showMessage('反应器为空，请拖拽元素添加反应物', '#ff8800');
            }
        }

        // 播放点击特效
        this.playClickEffect();
    }

    // 检查是否在冷却中
    isOnCooldown() {
        const currentTime = this.scene.time.now;
        return (currentTime - this.lastReactionTime) < this.reactionCooldown;
    }

    // 点击特效
    playClickEffect() {
        // 轻微的缩放动画
        this.scene.tweens.add({
            targets: this.container,
            scaleX: 1.05,
            scaleY: 1.05,
            duration: 100,
            yoyo: true,
            ease: 'Power2'
        });
    }
}