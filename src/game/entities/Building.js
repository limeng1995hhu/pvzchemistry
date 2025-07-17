import { EventBus } from '../EventBus';

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
            fontSize: '24px', // 增大字体，使其更清晰可见
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
            'CO': 'CO',
            'H2O': 'H₂O',
            'CO2': 'CO₂',
            'CH4': 'CH₄',
            'NH3': 'NH₃',
            'Na': 'Na',
            'Cl2': 'Cl₂',
            'NaCl': 'NaCl',
            'Ca': 'Ca',
            'CaO': 'CaO',
            'NaOH': 'NaOH',
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

        // 显示回收器状态信息
        if (this.targetSubstance) {
            const formula = this.getChemicalFormula(this.targetSubstance);
            const recycleCount = this.recycleCount || 0;

            if (this.scene.hud) {
                this.scene.hud.showMessage(`回收器目标: ${formula} | 已回收: ${recycleCount}次 | 每个物质单位获得${this.energyReward}⚡`, '#4ecdc4');
            }
        } else {
            if (this.scene.hud) {
                this.scene.hud.showMessage('请先拖拽元素到回收器设置目标物质', '#ff8800');
            }
        }
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

        // 回收统计
        this.recycleCount = 0; // 回收次数统计

        // 初始化显示
        this.updateDisplay();
    }
    
    // 设置目标物质
    setTargetSubstance(substance) {
        this.targetSubstance = substance;
        // 更新显示
        this.updateDisplay();
    }

    // 更新元素标签显示
    updateElementLabelDisplay() {
        // 移除旧的标签
        if (this.elementLabel) {
            this.elementLabel.destroy();
            this.elementLabel = null;
        }

        // 只有设置了目标物质时才显示
        if (this.targetSubstance) {
            const formula = this.getChemicalFormula(this.targetSubstance);
            const color = '#00ff00'; // 绿色表示已设置目标

            // 显示化学式
            this.elementLabel = this.scene.add.text(0, -this.config.size/2 - 15, formula, {
                fontFamily: 'Arial',
                fontSize: '24px', // 与反应器字体大小保持一致
                color: color,
                resolution: 2
            }).setOrigin(0.5);

            this.container.add(this.elementLabel);
        }
    }
    
    updateDisplay() {
        // 更新元素标签显示
        this.updateElementLabelDisplay();

        // 设置图标颜色表示状态
        if (this.icon) {
            if (this.targetSubstance) {
                this.icon.setTint(0x00ff00); // 绿色表示已设置目标
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
        // 如果没有设置目标物质，不能回收任何敌人
        if (!this.targetSubstance) {
            return false;
        }

        // 严格匹配：回收器目标物质与敌人物质必须完全相同
        // 例如：C 只能消解 C，不能消解 CO2
        // H2 只能消解 H2，不能消解 H2O
        return this.targetSubstance === enemy.substance;
    }



    onRecycleSuccess(enemy) {
        console.log(`回收器回收了 ${enemy.substance} ×${enemy.substanceAmount}`);

        // 增加回收统计
        this.recycleCount++;

        // 计算能量奖励：每个物质单位给10能量
        const totalEnergyReward = enemy.substanceAmount * this.energyReward;

        // 直接消灭敌人
        enemy.die();

        // 给予能量奖励
        if (this.scene.hud) {
            this.scene.hud.addEnergy(totalEnergyReward);
            this.scene.hud.showMessage(`+${totalEnergyReward}⚡ 回收 ${enemy.formula} ×${enemy.substanceAmount}`, '#4ecdc4');
        }

        // 触发回收特效
        this.playRecycleEffect();

        // 更新回收器状态显示
        this.updateRecycleStatus();

        console.log(`✅ 回收成功，消灭 ${enemy.formula} ×${enemy.substanceAmount}，获得 ${totalEnergyReward} 能量，总回收次数: ${this.recycleCount}`);

        // 返回实际获得的能量，供碰撞系统使用
        return totalEnergyReward;
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

        // 添加亮绿色闪光效果到图标
        if (this.icon) {
            this.icon.setTint(0x88ff88); // 更亮的绿色作为闪光

            this.scene.time.delayedCall(200, () => {
                if (this.icon) {
                    // 恢复正常的绿色而不是清除颜色
                    if (this.targetSubstance) {
                        this.icon.setTint(0x00ff00); // 恢复正常绿色
                    } else {
                        this.icon.clearTint(); // 如果没有目标物质才清除颜色
                    }
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
                    // 恢复正常的绿色而不是清除颜色
                    if (this.targetSubstance) {
                        this.icon.setTint(0x00ff00); // 恢复正常绿色
                    } else {
                        this.icon.clearTint(); // 如果没有目标物质才清除颜色
                    }
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
        this.energyCostPerCharge = 15; // 每次储能消耗的能量

        // 反应状态
        this.isReacting = false;
        this.reactionProgress = 0;

        // UI元素
        this.elementsDisplay = [];

        // 创建元素显示
        this.updateElementsDisplay();
        this.updateReactorElementLabel(); // 初始化上方元素标签
    }

    // 添加元素（储能）
    addElement(elementId) {
        console.log('⚗️ === 反应器addElement开始 ===');
        console.log('传入的elementId:', elementId);
        console.log('当前反应器元素:', this.elements);
        console.log('最大元素类型数:', this.maxElementTypes);
        console.log('最大元素数量:', this.maxElementAmount);

        // 检查是否已存在该元素
        const existingElement = this.elements.find(e => e.elementId === elementId);
        console.log('查找已存在元素结果:', existingElement);

        if (existingElement) {
            console.log('🔄 元素已存在，尝试增加数量...');
            // 检查是否已达到最大存储量
            if (existingElement.amount >= this.maxElementAmount) {
                console.log('❌ 该元素已达到最大存储量');
                return { success: false, message: '该元素已达到最大存储量' };
            }

            // 检查能量是否足够
            if (this.scene.hud && !this.scene.hud.canAfford(this.energyCostPerCharge)) {
                console.log('❌ 能量不足，无法增加元素数量');
                return { success: false, message: '能量不足' };
            }

            // 消耗能量并增加数量
            if (this.scene.hud && this.scene.hud.spendEnergy(this.energyCostPerCharge)) {
                existingElement.amount++;
                this.updateElementsDisplay();
                this.updateReactorElementLabel(); // 更新上方元素标签
                console.log('✅ 元素数量增加成功，新数量:', existingElement.amount);
                return {
                    success: true,
                    message: `${this.getElementName(elementId)} 数量: ${existingElement.amount}/${this.maxElementAmount}`
                };
            }
        } else {
            console.log('➕ 元素不存在，尝试添加新元素...');
            // 检查是否已达到最大元素种类数量
            if (this.elements.length >= this.maxElementTypes) {
                console.log('❌ 已达到最大元素种类数量');
                return { success: false, message: '已达到最大元素种类数量' };
            }

            // 检查能量是否足够
            if (this.scene.hud && !this.scene.hud.canAfford(this.energyCostPerCharge)) {
                console.log('❌ 能量不足，无法添加新元素');
                return { success: false, message: '能量不足' };
            }

            // 消耗能量并添加新元素
            if (this.scene.hud && this.scene.hud.spendEnergy(this.energyCostPerCharge)) {
                this.elements.push({ elementId, amount: 1 });
                this.updateElementsDisplay();
                this.updateReactorElementLabel(); // 更新上方元素标签
                console.log('✅ 新元素添加成功:', { elementId, amount: 1 });
                console.log('反应器当前所有元素:', this.elements);
                return {
                    success: true,
                    message: `添加 ${this.getElementName(elementId)} ×1`
                };
            }
        }

        console.log('❌ 储能失败');
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
        this.updateReactorElementLabel(); // 更新上方元素标签
        return actualRemoved;
    }

    // 更新反应器上方元素标签
    updateReactorElementLabel() {
        if (this.elements.length > 0) {
            // 显示第一个元素的名称
            const firstElement = this.elements[0];
            const elementName = this.getElementName(firstElement.elementId);
            this.showElementLabel(elementName);
        } else {
            // 没有元素时隐藏标签
            this.hideElementLabel();
        }
    }

    // 更新元素显示
    updateElementsDisplay() {
        // 清除旧的显示
        this.elementsDisplay.forEach(display => {
            if (display) display.destroy();
        });
        this.elementsDisplay = [];

        // 不再创建橙色的元素显示，只保留白色的elementLabel

        // 根据存储状态和可反应性设置图标颜色
        if (this.icon) {
            if (this.elements.length > 0) {
                // 检查是否有可用反应
                const hasAvailableReactions = this.getAvailableReactions().length > 0;
                if (hasAvailableReactions) {
                    this.icon.setTint(0x00ff00); // 绿色表示可以反应
                } else {
                    this.icon.setTint(0xff6600); // 橙色表示有元素但无法反应
                }
            } else {
                this.icon.clearTint(); // 无元素时清除颜色
            }
        }
    }

    // 获取元素名称
    getElementName(elementId) {
        const elementMap = {
            'H2': 'H₂',
            'O2': 'O₂',
            'H2O': 'H₂O',
            'C': 'C',
            'N2': 'N₂',
            'CO': 'CO',
            'CO2': 'CO₂',
            'CH4': 'CH₄',
            'NH3': 'NH₃',
            'Na': 'Na',
            'Cl2': 'Cl₂',
            'NaCl': 'NaCl',
            'Ca': 'Ca',
            'CaO': 'CaO',
            'H': 'H',
            'O': 'O',
            'N': 'N'
        };
        return elementMap[elementId] || elementId;
    }
    
    // 检查是否可以与敌人反应
    canReactWithEnemy(enemy) {
        console.log(`🔍 检查反应条件 - 敌人: ${enemy.substance}`);

        // 检查是否有存储的元素
        if (this.elements.length === 0) {
            console.log(`❌ 反应器中没有元素`);
            return false;
        }
        console.log(`✅ 反应器中有元素: ${this.elements.map(e => `${e.elementId}×${e.amount}`).join(', ')}`);

        // 检查是否正在反应中
        if (this.isReacting) {
            console.log(`❌ 反应器正在反应中`);
            return false;
        }

        // 检查能量是否足够（固定消耗20能量）
        if (this.scene.hud && !this.scene.hud.canAfford(20)) {
            console.log(`❌ 能量不足，需要20能量`);
            return false;
        }
        console.log(`✅ 能量充足`);

        // 检查是否有可用的反应
        const availableReaction = this.findAvailableReaction(enemy);
        const canReact = availableReaction !== null;
        console.log(`反应检查结果: ${canReact ? '✅ 可以反应' : '❌ 无可用反应'}`);
        return canReact;
    }

    // 查找可用的反应
    findAvailableReaction(enemy) {
        // 化学反应规则：
        // H2 + O2 → H2O (需要2个H2和1个O2)
        // C + O2 → CO2 (需要1个C和1个O2)
        // C + H2 → CH4 (需要1个C和2个H2)
        // N2 + H2 → NH3 (需要1个N2和3个H2)
        // Na + Cl2 → NaCl (需要2个Na和1个Cl2)
        // Ca + O2 → CaO (需要2个Ca和1个O2)

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
                id: 'co_oxidation',
                reactants: [{ elementId: 'CO', amount: 2 }, { elementId: 'O2', amount: 1 }],
                products: [{ substance: 'CO2', amount: 2 }],
                condition: (enemy) => enemy.substance === 'CO' || enemy.substance === 'O2'
            },
            {
                id: 'methane_synthesis',
                reactants: [{ elementId: 'C', amount: 1 }, { elementId: 'H2', amount: 2 }],
                products: [{ substance: 'CH4', amount: 1 }],
                condition: (enemy) => enemy.substance === 'C' || enemy.substance === 'H2'
            },
            {
                id: 'ammonia_synthesis',
                reactants: [{ elementId: 'N2', amount: 1 }, { elementId: 'H2', amount: 3 }],
                products: [{ substance: 'NH3', amount: 2 }],
                condition: (enemy) => enemy.substance === 'N2' || enemy.substance === 'H2'
            },
            {
                id: 'salt_synthesis',
                reactants: [{ elementId: 'Na', amount: 2 }, { elementId: 'Cl2', amount: 1 }],
                products: [{ substance: 'NaCl', amount: 2 }],
                condition: (enemy) => enemy.substance === 'Na' || enemy.substance === 'Cl2'
            },
            {
                id: 'lime_synthesis',
                reactants: [{ elementId: 'Ca', amount: 2 }, { elementId: 'O2', amount: 1 }],
                products: [{ substance: 'CaO', amount: 2 }],
                condition: (enemy) => enemy.substance === 'Ca' || enemy.substance === 'O2'
            }
        ];

        for (const reaction of reactions) {
            console.log(`检查反应 ${reaction.id}: 条件=${reaction.condition(enemy)}`);
            if (reaction.condition(enemy)) {
                const hasReactants = this.hasRequiredReactants(reaction.reactants, enemy);
                console.log(`反应 ${reaction.id}: 反应物检查=${hasReactants}`);
                if (hasReactants) {
                    console.log(`找到可用反应: ${reaction.id}`);
                    return reaction;
                }
            }
        }

        return null;
    }

    // 检查是否有所需的反应物（检查反应器中的元素和敌人是否能配对反应）
    hasRequiredReactants(reactants, enemy = null) {
        if (!enemy) {
            console.log(`❌ 没有敌人`);
            return false;
        }

        // 检查敌人的物质是否是反应物之一
        const enemyIsReactant = reactants.some(reactant => reactant.elementId === enemy.substance);
        if (!enemyIsReactant) {
            console.log(`❌ 敌人物质 ${enemy.substance} 不是反应物`);
            return false;
        }
        console.log(`✅ 敌人物质 ${enemy.substance} 是反应物`);

        // 检查反应器中是否有至少一种其他反应物
        const otherReactants = reactants.filter(reactant => reactant.elementId !== enemy.substance);
        if (otherReactants.length === 0) {
            // 如果只需要敌人的物质，直接通过
            console.log(`✅ 反应只需要敌人物质 ${enemy.substance}`);
            return true;
        }

        // 检查反应器中是否有任意一种其他反应物
        for (const reactant of otherReactants) {
            const element = this.elements.find(e => e.elementId === reactant.elementId);
            if (element && element.amount > 0) {
                console.log(`✅ 反应器中有反应物: ${reactant.elementId} ×${element.amount}`);
                return true;
            }
        }

        console.log(`❌ 反应器中缺少其他反应物: ${otherReactants.map(r => r.elementId).join(', ')}`);
        return false;
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
        console.log(`⚗️ 执行反应: ${reaction.id}`);

        // 根据敌人数量计算反应规模
        const reactionScale = enemy.substanceAmount;
        console.log(`反应规模: ${reactionScale} (基于敌人物质数量)`);

        // 固定能量消耗：每次反应消耗10能量
        const totalEnergyCost = 10;
        console.log(`计算能量消耗: 固定消耗 ${totalEnergyCost} 能量`);

        // 检查能量是否足够
        if (this.scene.hud && !this.scene.hud.canAfford(totalEnergyCost)) {
            console.log(`❌ 能量不足，需要 ${totalEnergyCost}，反应失败`);
            return false;
        }

        // 扣除能量
        if (this.scene.hud && !this.scene.hud.spendEnergy(totalEnergyCost)) {
            console.log(`❌ 能量扣除失败，反应终止`);
            return false;
        }
        console.log(`✅ 扣除能量: ${totalEnergyCost}`);

        // 不消耗反应器中的物质，只消耗敌人的物质
        console.log(`消耗敌人物质: ${enemy.substance} ×${enemy.substanceAmount}`);
        enemy.consumeSubstance(enemy.substanceAmount); // 完全消耗敌人

        // 生成产物（新敌人）- 根据反应规模调整产物数量
        for (const product of reaction.products) {
            const scaledProduct = {
                ...product,
                amount: product.amount * reactionScale
            };
            console.log(`生成产物: ${scaledProduct.substance} ×${scaledProduct.amount}`);
            this.spawnProductEnemy(scaledProduct);
        }

        // 播放反应特效
        this.playReactionEffect();

        // 显示反应信息
        if (this.scene.hud) {
            const productInfo = reaction.products.map(p => `${p.substance}×${p.amount * reactionScale}`).join(', ');
            this.scene.hud.showMessage(`反应成功！生成: ${productInfo} (-${totalEnergyCost}⚡)`, '#ff6600');
        }

        // 发送反应事件
        EventBus.emit('reaction-occurred', {
            reactionId: reaction.id,
            reactorPos: { row: this.gridRow, col: this.gridCol },
            consumedEnemy: enemy.substance,
            reactionScale: reactionScale,
            energyCost: totalEnergyCost,
            products: reaction.products.map(p => ({
                ...p,
                amount: p.amount * reactionScale
            }))
        });

        console.log(`✅ 反应成功: ${reaction.id}, 规模: ${reactionScale}, 能量消耗: ${totalEnergyCost}, 产物: ${reaction.products.map(p => `${p.substance}×${p.amount * reactionScale}`).join(', ')}`);
        return true;
    }

    // 生成产物敌人
    spawnProductEnemy(product) {
        if (this.scene.enemyManager) {
            console.log(`🧪 开始生成产物敌人: ${product.substance} ×${product.amount}`);

            // 根据产物数量决定生成策略
            if (product.amount <= 5) {
                // 数量较少时，生成单个敌人包含所有数量
                const newEnemy = this.scene.enemyManager.spawnEnemy(product.substance, this.gridRow);
                if (newEnemy) {
                    // 设置产物敌人的数量
                    newEnemy.substanceAmount = product.amount;
                    newEnemy.maxSubstanceAmount = product.amount;
                    newEnemy.updateAmountDisplay();

                    // 设置新敌人的位置为反应器所在的网格列
                    this.setEnemyPosition(newEnemy);

                    console.log(`✅ 生成单个产物敌人: ${product.substance} ×${product.amount} 在位置 (${this.gridRow}, ${this.gridCol})`);
                } else {
                    console.error(`❌ 生成产物敌人失败: ${product.substance}`);
                }
            } else {
                // 数量较多时，分批生成多个敌人
                const maxPerEnemy = 3; // 每个敌人最多携带3个单位
                const enemyCount = Math.ceil(product.amount / maxPerEnemy);

                for (let i = 0; i < enemyCount; i++) {
                    const remainingAmount = product.amount - (i * maxPerEnemy);
                    const currentAmount = Math.min(maxPerEnemy, remainingAmount);

                    // 添加小延迟避免敌人重叠
                    setTimeout(() => {
                        const newEnemy = this.scene.enemyManager.spawnEnemy(product.substance, this.gridRow);
                        if (newEnemy) {
                            newEnemy.substanceAmount = currentAmount;
                            newEnemy.maxSubstanceAmount = currentAmount;
                            newEnemy.updateAmountDisplay();
                            this.setEnemyPosition(newEnemy);

                            console.log(`✅ 生成批次产物敌人 ${i+1}/${enemyCount}: ${product.substance} ×${currentAmount}`);
                        }
                    }, i * 200); // 每200ms生成一个
                }

                console.log(`✅ 计划生成 ${enemyCount} 个产物敌人，总数量: ${product.amount}`);
            }
        }
    }

    // 设置敌人位置的辅助方法
    setEnemyPosition(enemy) {
        if (this.scene.gridSystem) {
            // 让新敌人从最右边开始（重置到起始位置）
            enemy.currentCol = enemy.startCol;
            enemy.gridCol = enemy.startCol;
            enemy.progress = 0; // 从头开始移动

            // 更新敌人的视觉位置
            enemy.updatePosition();

            console.log(`新产物敌人 ${enemy.substance} 设置到最右边位置，列: ${enemy.startCol}`);
        }
    }

    // 手动触发反应
    triggerReaction() {
        console.log('手动触发反应');
        this.playReactionEffect();
    }

    playReactionEffect() {
        // 反应特效：只有缩放动画，不改变颜色
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

        // 不改变反应器颜色，保持原有状态
    }

    // 重写反应器点击处理
    onReactorClicked() {
        console.log('反应器被点击');

        if (this.elements.length > 0) {
            // 显示反应器状态信息
            const elementsInfo = this.elements.map(e => `${this.getElementName(e.elementId)}×${e.amount}`).join(', ');

            // 检查可能的反应
            const availableReactions = this.getAvailableReactions();
            let reactionInfo = '';
            if (availableReactions.length > 0) {
                reactionInfo = ` | 可反应: ${availableReactions.join(', ')}`;
            }

            if (this.scene.hud) {
                this.scene.hud.showMessage(`反应器: ${elementsInfo}${reactionInfo}`, '#ff6600');
            }
        } else {
            if (this.scene.hud) {
                this.scene.hud.showMessage('反应器为空，请拖拽元素添加反应物', '#ff8800');
            }
        }

        // 播放点击特效
        this.playClickEffect();
    }

    // 获取可用的反应列表
    getAvailableReactions() {
        const reactions = [
            {
                id: 'water_synthesis',
                name: 'H₂O',
                reactants: [{ elementId: 'H2', amount: 2 }, { elementId: 'O2', amount: 1 }]
            },
            {
                id: 'co2_synthesis',
                name: 'CO₂',
                reactants: [{ elementId: 'C', amount: 1 }, { elementId: 'O2', amount: 1 }]
            },
            {
                id: 'co_oxidation',
                name: 'CO₂',
                reactants: [{ elementId: 'CO', amount: 2 }, { elementId: 'O2', amount: 1 }]
            },
            {
                id: 'methane_synthesis',
                name: 'CH₄',
                reactants: [{ elementId: 'C', amount: 1 }, { elementId: 'H2', amount: 2 }]
            },
            {
                id: 'ammonia_synthesis',
                name: 'NH₃',
                reactants: [{ elementId: 'N2', amount: 1 }, { elementId: 'H2', amount: 3 }]
            },
            {
                id: 'salt_synthesis',
                name: 'NaCl',
                reactants: [{ elementId: 'Na', amount: 2 }, { elementId: 'Cl2', amount: 1 }]
            },
            {
                id: 'lime_synthesis',
                name: 'CaO',
                reactants: [{ elementId: 'Ca', amount: 2 }, { elementId: 'O2', amount: 1 }]
            }
        ];

        return reactions.filter(reaction =>
            this.hasRequiredReactants(reaction.reactants, null)
        ).map(reaction => reaction.name);
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