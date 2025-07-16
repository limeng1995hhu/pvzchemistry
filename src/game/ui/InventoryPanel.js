export class InventoryPanel {
    constructor(scene) {
        this.scene = scene;
        this.selectedTool = null;
        this.tools = new Map();
        
        this.create();
    }

    create() {
        const { width, height } = this.scene.cameras.main;
        
        // 创建道具栏容器
        this.container = this.scene.add.container(0, 0);
        
        // 不再需要道具栏背景和标题，直接创建工具按钮
        this.createToolButtons();
        
        // 创建选中指示器
        this.createSelectionIndicator();
    }

    createToolButtons() {
        const { width, height } = this.scene.cameras.main;
        const buttonY = 70; // 与更高的HUD中心对齐
        const buttonSize = 70; // 增大按钮尺寸
        const buttonSpacing = 80; // 增加间距适应更大按钮
        const startX = 320; // 向右移动避免与能量文字重叠

        // 定义工具数据
        const toolsData = [
            { id: 'hydrogen', symbol: 'H', name: '氢', color: '#87CEEB', price: 10 },
            { id: 'oxygen', symbol: 'O', name: '氧', color: '#4169E1', price: 10 },
            { id: 'carbon', symbol: 'C', name: '碳', color: '#8B4513', price: 15 },
            { id: 'nitrogen', symbol: 'N', name: '氮', color: '#90EE90', price: 15 },
            { id: 'recycler', symbol: '♻', name: '回收器', color: '#16213e', price: 100 },
            { id: 'reactor', symbol: '⚗', name: '反应器', color: '#e94560', price: 150 }
        ];

        // 创建按钮
        toolsData.forEach((tool, index) => {
            const x = startX + index * buttonSpacing;
            const button = this.createToolButton(x, buttonY, buttonSize, tool);
            this.tools.set(tool.id, { ...tool, button, x, y: buttonY });
        });
    }

    createToolButton(x, y, size, toolData) {
        // 按钮容器
        const buttonContainer = this.scene.add.container(x, y);

        // 按钮背景
        const background = this.scene.add.rectangle(0, 0, size, size, toolData.color, 0.8);
        background.setStrokeStyle(2, 0xffffff);
        background.setInteractive();

        // 按钮符号 (增大图标)
        const symbol = this.scene.add.text(0, -8, toolData.symbol, {
            fontFamily: 'Arial Bold',
            fontSize: '32px', // 增大图标字体
            color: '#ffffff',
            resolution: 2 // 强制高分辨率渲染
        }).setOrigin(0.5);

        // 按钮名称
        const name = this.scene.add.text(0, 15, toolData.name, {
            fontFamily: 'Arial',
            fontSize: '12px', // 增大字体
            color: '#ffffff',
            resolution: 2 // 强制高分辨率渲染
        }).setOrigin(0.5);

        // 价格显示
        const price = this.scene.add.text(0, 26, `${toolData.price}⚡`, {
            fontFamily: 'Arial',
            fontSize: '10px', // 增大字体
            color: '#e94560',
            resolution: 2 // 强制高分辨率渲染
        }).setOrigin(0.5);

        buttonContainer.add([background, symbol, name, price]);

        // 悬停效果
        background.on('pointerover', () => {
            background.setAlpha(1.0);
            buttonContainer.setScale(1.1);
            this.showToolTooltip(toolData, x, y);
        });

        background.on('pointerout', () => {
            background.setAlpha(0.8);
            buttonContainer.setScale(1.0);
            this.hideToolTooltip();
        });

        // 点击事件
        background.on('pointerdown', () => {
            this.selectTool(toolData.id);
        });

        this.container.add(buttonContainer);
        return { container: buttonContainer, background, symbol, name, price };
    }

    createSelectionIndicator() {
        // 选中指示器
        this.selectionIndicator = this.scene.add.graphics();
        this.selectionIndicator.lineStyle(3, 0xffd700); // 金色边框
        this.selectionIndicator.setVisible(false);
        this.container.add(this.selectionIndicator);
    }

    selectTool(toolId) {
        const tool = this.tools.get(toolId);
        if (!tool) return;

        // 检查能量是否足够
        if (this.scene.hud && !this.scene.hud.spendEnergy(tool.price)) {
            return; // 能量不足
        }

        this.selectedTool = toolId;
        this.updateSelectionIndicator(tool);
        
        // 播放选择音效（如果有的话）
        // this.scene.sound.play('select');
        
        // 显示选择消息
        if (this.scene.hud) {
            this.scene.hud.showMessage(`已选择: ${tool.name} (-${tool.price}⚡)`, '#4ecdc4');
        }

        console.log('选择道具:', tool.name, '消耗能量:', tool.price);
    }

    updateSelectionIndicator(tool) {
        const size = 66; // 比按钮稍大一点
        
        this.selectionIndicator.clear();
        this.selectionIndicator.strokeRect(-size/2, -size/2, size, size);
        this.selectionIndicator.setPosition(tool.x, tool.y);
        this.selectionIndicator.setVisible(true);

        // 添加闪烁效果
        this.scene.tweens.add({
            targets: this.selectionIndicator,
            alpha: { from: 1, to: 0.3 },
            duration: 800,
            yoyo: true,
            repeat: -1
        });
    }

    showToolTooltip(toolData, x, y) {
        this.hideToolTooltip(); // 先隐藏之前的提示

        const tooltipText = `${toolData.name}\n价格: ${toolData.price}⚡`;
        
        this.tooltip = this.scene.add.text(x, y - 80, tooltipText, {
            fontFamily: 'Arial',
            fontSize: '14px',
            color: '#ffffff',
            backgroundColor: '#000000',
            padding: { x: 10, y: 6 },
            align: 'center'
        }).setOrigin(0.5);

        this.container.add(this.tooltip);
    }

    hideToolTooltip() {
        if (this.tooltip) {
            this.tooltip.destroy();
            this.tooltip = null;
        }
    }

    getSelectedTool() {
        return this.selectedTool;
    }

    clearSelection() {
        this.selectedTool = null;
        this.selectionIndicator.setVisible(false);
        
        // 停止闪烁动画
        this.scene.tweens.killTweensOf(this.selectionIndicator);
        this.selectionIndicator.setAlpha(1);
    }

    updateToolAvailability() {
        // 根据当前能量更新工具可用性
        const currentEnergy = this.scene.hud ? this.scene.hud.currentEnergy : 0;
        
        this.tools.forEach((tool) => {
            const canAfford = currentEnergy >= tool.price;
            const alpha = canAfford ? 0.8 : 0.4;
            
            tool.button.background.setAlpha(alpha);
            
            if (!canAfford) {
                tool.button.background.setTint(0x666666); // 变灰
            } else {
                tool.button.background.clearTint();
            }
        });
    }

    addTool(toolData) {
        // 动态添加新工具
        const toolCount = this.tools.size;
        const { width, height } = this.scene.cameras.main;
        const buttonSpacing = 80; // 增加间距适应更大按钮
        const startX = 320; // 向右移动避免重叠
        const x = startX + toolCount * buttonSpacing;
        const y = 70; // 与更高的HUD中心对齐
        
        const button = this.createToolButton(x, y, 70, toolData); // 使用更大的按钮尺寸
        this.tools.set(toolData.id, { ...toolData, button, x, y });
    }

    resize(width, height) {
        // 重新定位所有工具按钮到顶部HUD区域
        const buttonSpacing = 80; // 增加间距适应更大按钮
        const startX = 320; // 向右移动避免重叠
        const buttonY = 70; // 与更高的HUD中心对齐
        
        let index = 0;
        this.tools.forEach((tool) => {
            const x = startX + index * buttonSpacing;
            tool.button.container.setPosition(x, buttonY);
            tool.x = x;
            tool.y = buttonY;
            index++;
        });

        // 更新选中指示器位置
        if (this.selectedTool) {
            const selectedTool = this.tools.get(this.selectedTool);
            if (selectedTool) {
                this.selectionIndicator.setPosition(selectedTool.x, selectedTool.y);
            }
        }
    }

    destroy() {
        this.hideToolTooltip();
        if (this.container) {
            this.container.destroy();
        }
    }
} 