import { EventBus } from '../EventBus';

export class InventoryPanel {
    constructor(scene) {
        console.log('InventoryPanel - 构造函数开始');
        this.scene = scene;
        this.selectedTool = null;
        this.tools = new Map();
        
        // 拖拽相关属性
        this.isDragging = false;
        this.dragData = null;
        this.dragContainer = null;
        
        this.create();
        console.log('InventoryPanel - 构造完成');
    }

    create() {
        console.log('InventoryPanel - create开始');
        const { width, height } = this.scene.cameras.main;
        
        // 创建道具栏容器
        this.container = this.scene.add.container(0, 0);
        
        // 不再需要道具栏背景和标题，直接创建工具按钮
        this.createToolButtons();
        
        // 创建选中指示器
        this.createSelectionIndicator();
        console.log('InventoryPanel - create完成');
    }

    createToolButtons() {
        const { width, height } = this.scene.cameras.main;
        const buttonY = 70; // 与更高的HUD中心对齐
        const buttonSize = 70; // 增大按钮尺寸
        const buttonSpacing = 100; // 进一步增大间距，让道具更清晰分离
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
        console.log('创建工具按钮:', toolData.name, 'at', x, y);
        // 按钮容器
        const buttonContainer = this.scene.add.container(x, y);

        // 按钮背景
        const background = this.scene.add.rectangle(0, 0, size, size, toolData.color, 0.8);
        background.setStrokeStyle(2, 0xffffff);
        
        // 设置交互和拖拽
        background.setInteractive({ draggable: true });
        console.log('按钮交互设置完成:', toolData.name);

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

        // 悬停效果 (移除提示文字，保留视觉效果)
        background.on('pointerover', () => {
            console.log('按钮悬停:', toolData.name);
            background.setAlpha(1.0);
            buttonContainer.setScale(1.1);
        });

        background.on('pointerout', () => {
            background.setAlpha(0.8);
            buttonContainer.setScale(1.0);
        });

        // 点击事件（点击选择）
        background.on('pointerdown', (pointer) => {
            console.log('按钮点击:', toolData.name, '按钮:', pointer.button);
            if (pointer.button === 0) { // 左键点击
                this.selectTool(toolData.id);
            }
        });
        
        // 拖拽事件
        background.on('dragstart', (pointer, dragX, dragY) => {
            console.log('拖拽开始事件触发:', toolData.name, 'pointer位置:', pointer.x, pointer.y);
            this.startDrag(toolData, pointer.x, pointer.y);
        });
        
        background.on('drag', (pointer, dragX, dragY) => {
            console.log('拖拽移动事件:', pointer.x, pointer.y);
            this.updateDrag(pointer.x, pointer.y);
        });
        
        background.on('dragend', (pointer) => {
            console.log('拖拽结束事件触发:', pointer.x, pointer.y);
            this.endDrag(pointer.x, pointer.y);
        });

        this.container.add(buttonContainer);
        console.log('工具按钮创建完成:', toolData.name);
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

        // 只检查能量是否足够，不立即扣除
        if (this.scene.hud && !this.scene.hud.canAfford(tool.price)) {
            if (this.scene.hud) {
                this.scene.hud.showMessage('能量不足！', '#ff0000');
            }
            return; // 能量不足
        }

        this.selectedTool = toolId;
        this.updateSelectionIndicator(tool);
        
        // 播放选择音效（如果有的话）
        // this.scene.sound.play('select');
        
        // 显示选择消息（不显示扣除能量）
        if (this.scene.hud) {
            this.scene.hud.showMessage(`已选择: ${tool.name}`, '#4ecdc4');
        }

        console.log('选择道具:', tool.name, '需要能量:', tool.price);
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
        const buttonSpacing = 100; // 进一步增大间距，让道具更清晰分离
        const startX = 320; // 向右移动避免重叠
        const x = startX + toolCount * buttonSpacing;
        const y = 70; // 与更高的HUD中心对齐
        
        const button = this.createToolButton(x, y, 70, toolData); // 使用更大的按钮尺寸
        this.tools.set(toolData.id, { ...toolData, button, x, y });
    }

    resize(width, height) {
        // 重新定位所有工具按钮到顶部HUD区域
        const buttonSpacing = 100; // 进一步增大间距，让道具更清晰分离
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

    createDragPreview(x, y) {
        console.log('创建拖拽预览 at:', x, y, '类型:', this.dragData.id);
        
        // 创建预览容器
        this.dragContainer = this.scene.add.container(x, y);
        this.dragContainer.setDepth(1000); // 确保在最上层
        
        // 获取工具颜色
        const toolColor = typeof this.dragData.color === 'string' 
            ? parseInt(this.dragData.color.replace('#', '0x'))
            : this.dragData.color;
        
        // 创建预览背景
        const size = 60;
        const background = this.scene.add.rectangle(0, 0, size, size, toolColor, 0.8);
        background.setStrokeStyle(2, 0xffffff);
        
        // 添加符号
        let symbol = this.dragData.symbol;
        const text = this.scene.add.text(0, -5, symbol, {
            fontFamily: 'Arial Bold',
            fontSize: '24px',
            color: '#ffffff'
        }).setOrigin(0.5);
        
        // 添加名称
        const name = this.scene.add.text(0, 15, this.dragData.name, {
            fontFamily: 'Arial',
            fontSize: '10px',
            color: '#ffffff'
        }).setOrigin(0.5);
        
        // 添加价格
        const price = this.scene.add.text(0, 25, `${this.dragData.price}⚡`, {
            fontFamily: 'Arial',
            fontSize: '8px',
            color: '#e94560'
        }).setOrigin(0.5);
        
        this.dragContainer.add([background, text, name, price]);
        
        console.log('拖拽预览创建完成');
    }
    
    // 更新拖拽预览位置
    updateDragPreview(x, y) {
        if (this.dragContainer) {
            this.dragContainer.setPosition(x, y);
        }
    }
    
    // 清理拖拽预览
    cleanupDragPreview() {
        if (this.dragContainer) {
            this.dragContainer.destroy();
            this.dragContainer = null;
        }
    }

    // 开始拖拽
    startDrag(toolData, x, y) {
        console.log('InventoryPanel - 开始拖拽工具:', toolData.name, 'at', x, y);
        
        // 检查能量是否足够（但不扣除）
        if (this.scene.hud && !this.scene.hud.canAfford(toolData.price)) {
            console.log('能量不足，无法拖拽');
            if (this.scene.hud) {
                this.scene.hud.showMessage('能量不足！', '#ff0000');
            }
            return;
        }
        
        // 存储拖拽数据
        this.dragData = toolData;
        this.isDragging = true;
        
        // 创建跟随鼠标的拖拽预览
        this.createDragPreview(x, y);
        
        console.log('发送drag-start事件');
        // 发送拖拽开始事件
        EventBus.emit('drag-start', {
            type: toolData.id,
            toolData: toolData,
            x: x,
            y: y
        });
    }
    
    // 更新拖拽
    updateDrag(x, y) {
        console.log('InventoryPanel - 更新拖拽位置:', x, y);
        
        // 更新拖拽预览位置
        this.updateDragPreview(x, y);
        
        // 发送拖拽移动事件
        EventBus.emit('drag-move', {
            x: x,
            y: y
        });
    }
    
    // 结束拖拽
    endDrag(x, y) {
        console.log('InventoryPanel - 结束拖拽 at:', x, y);
        
        // 清理拖拽预览
        this.cleanupDragPreview();
        this.isDragging = false;
        this.dragData = null;
        
        // 发送拖拽结束事件
        EventBus.emit('drag-end', {
            x: x,
            y: y
        });
    }

    destroy() {
        if (this.container) {
            this.container.destroy();
        }
    }
} 