import { EventBus } from '../EventBus';
import { Scene } from 'phaser';
import { HUD } from '../ui/HUD';
import { InventoryPanel } from '../ui/InventoryPanel';
import { GridSystem } from '../systems/GridSystem';
import { BuildingPlacementSystem } from '../systems/BuildingPlacementSystem';

export class GamePlay extends Scene
{
    constructor ()
    {
        super('GamePlay');
    }

    create ()
    {
        console.log('GamePlay - create开始');
        // 获取屏幕尺寸
        const { width, height } = this.cameras.main;
        
        // 设置背景颜色为深蓝紫色
        this.cameras.main.setBackgroundColor(0x1a1a2e);

        // 创建游戏区域（6x12网格）
        this.createGameArea();
        
        // 创建网格系统（必须在createGameArea之后）
        this.gridSystem = new GridSystem(this, this.gameArea, 6, 12);
        this.gridSystem.setLayout(this.gameArea, this.gridSize);
        
        // 创建建筑放置系统 - 修复构造函数参数
        this.buildingPlacementSystem = new BuildingPlacementSystem(this, this.gridSystem, EventBus);
        
        // 创建UI组件
        this.hud = new HUD(this);
        this.inventoryPanel = new InventoryPanel(this);
        
        // 移除旧的setReferences调用，因为现在在构造函数中传递了引用
        // this.buildingPlacementSystem.setReferences(this.gridSystem, this.hud);
        
        // 设置网格事件监听
        this.setupGridEventHandlers();

        // 监听屏幕尺寸变化
        this.scale.on('resize', this.handleResize, this);

        // 定时增加能量
        this.energyTimer = this.time.addEvent({
            delay: 3000, // 每3秒
            callback: this.addPassiveEnergy,
            callbackScope: this,
            loop: true
        });

        EventBus.emit('current-scene-ready', this);
        console.log('GamePlay - create完成');
    }
    
    update(time, delta) {
        // 更新建筑放置系统
        if (this.buildingPlacementSystem) {
            this.buildingPlacementSystem.update(time, delta);
        }
    }

    createGameArea()
    {
        const { width, height } = this.cameras.main;
        
        // 游戏区域位置和尺寸（左右各留白10%）
        const sideMargin = width * 0.1; // 10%留白
        this.gameArea = {
            x: sideMargin,
            y: 140, // 调整Y位置适应更高的HUD (70+60=130 + 10像素间距)
            width: width - (sideMargin * 2),
            height: height - 260, // 相应调整高度 (140 + 120 = 260)
            rows: 6,
            cols: 12
        };

        // 计算每个网格的尺寸
        this.gridSize = {
            width: this.gameArea.width / this.gameArea.cols,
            height: this.gameArea.height / this.gameArea.rows
        };

        // 绘制路径分区标识
        this.drawLaneIndicators();
    }

    setupGridEventHandlers()
    {
        // 监听网格点击事件
        EventBus.on('grid-cell-clicked', (data) => {
            console.log('网格被点击:', `行 ${data.row}, 列 ${data.col}`, data.cell);
            
            // 这里可以添加点击网格后的逻辑
            // 例如：放置建筑、显示信息等
        });
        
        // 监听网格悬停事件
        EventBus.on('grid-cell-hover', (data) => {
            // 可以在这里添加悬停时的额外逻辑
            // 例如：显示工具提示、预览放置效果等
        });
        
        // 监听网格选择事件
        EventBus.on('grid-cell-selected', (data) => {
            // 可以在这里添加选择网格后的逻辑
            // 例如：更新UI状态、准备建筑放置等
        });
    }

    drawLaneIndicators()
    {
        const labelStyle = {
            fontFamily: 'Arial',
            fontSize: '28px', // 字体大小增加两倍 (14px -> 28px)
            color: '#ffffff',
            alpha: 0.8,
            resolution: 2 // 强制高分辨率渲染
        };

        // 计算左侧标识文字的x坐标（在左侧留白区域的中心）
        const labelX = Math.round(this.gameArea.x / 2);

        // 气态路径标识 (第1-2行)
        this.add.text(labelX, Math.round(this.gameArea.y + this.gridSize.height * 0.5), '气态', labelStyle).setOrigin(0.5);
        this.add.text(labelX, Math.round(this.gameArea.y + this.gridSize.height * 1.5), 'Gas', labelStyle).setOrigin(0.5);
        
        // 液态路径标识 (第3-4行)
        this.add.text(labelX, Math.round(this.gameArea.y + this.gridSize.height * 2.5), '液态', labelStyle).setOrigin(0.5);
        this.add.text(labelX, Math.round(this.gameArea.y + this.gridSize.height * 3.5), 'Liquid', labelStyle).setOrigin(0.5);
        
        // 固态路径标识 (第5-6行)
        this.add.text(labelX, Math.round(this.gameArea.y + this.gridSize.height * 4.5), '固态', labelStyle).setOrigin(0.5);
        this.add.text(labelX, Math.round(this.gameArea.y + this.gridSize.height * 5.5), 'Solid', labelStyle).setOrigin(0.5);

        // 绘制路径分区背景色
        const graphics = this.add.graphics();
        
        // 气态路径背景 (天蓝色)
        graphics.fillStyle(0x87CEEB, 0.1);
        graphics.fillRect(this.gameArea.x, this.gameArea.y, this.gameArea.width, this.gridSize.height * 2);
        
        // 液态路径背景 (皇室蓝)
        graphics.fillStyle(0x4169E1, 0.1);
        graphics.fillRect(this.gameArea.x, this.gameArea.y + this.gridSize.height * 2, this.gameArea.width, this.gridSize.height * 2);
        
        // 固态路径背景 (棕色)
        graphics.fillStyle(0x8B4513, 0.1);
        graphics.fillRect(this.gameArea.x, this.gameArea.y + this.gridSize.height * 4, this.gameArea.width, this.gridSize.height * 2);
    }

    addPassiveEnergy()
    {
        // 被动能量增长
        if (this.hud) {
            this.hud.addEnergy(5);
        }
    }

    handleResize(gameSize)
    {
        // 重新布局所有UI元素
        const { width, height } = gameSize;
        
        // 更新游戏区域（左右各留白10%）
        const sideMargin = width * 0.1;
        this.gameArea.x = sideMargin;
        this.gameArea.y = 140; // 适应更高的HUD
        this.gameArea.width = width - (sideMargin * 2);
        this.gameArea.height = height - 260; // 适应更高的HUD
        
        // 重新计算网格尺寸
        this.gridSize = {
            width: this.gameArea.width / this.gameArea.cols,
            height: this.gameArea.height / this.gameArea.rows
        };

        // 更新网格系统
        if (this.gridSystem) {
            this.gridSystem.resize(this.gameArea, this.gridSize);
        }
        
        // 更新建筑放置系统
        if (this.buildingPlacementSystem) {
            this.buildingPlacementSystem.resize();
        }
        
        // 更新UI组件
        if (this.hud) {
            this.hud.resize(width, height);
        }
        if (this.inventoryPanel) {
            this.inventoryPanel.resize(width, height);
        }
    }

    changeScene ()
    {
        this.scene.start('GameOver');
    }

    destroy()
    {
        // 清理资源
        if (this.energyTimer) {
            this.energyTimer.destroy();
        }
        if (this.gridSystem) {
            this.gridSystem.destroy();
        }
        if (this.buildingPlacementSystem) {
            this.buildingPlacementSystem.destroy();
        }
        if (this.hud) {
            this.hud.destroy();
        }
        if (this.inventoryPanel) {
            this.inventoryPanel.destroy();
        }
        
        // 清理事件监听器
        EventBus.off('grid-cell-clicked');
        EventBus.off('grid-cell-hover');
        EventBus.off('grid-cell-selected');
    }
}