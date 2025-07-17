import { EventBus } from '../EventBus';
import { Scene } from 'phaser';
import { HUD } from '../ui/HUD';
import { InventoryPanel } from '../ui/InventoryPanel';
import { GridSystem } from '../systems/GridSystem';
import { BuildingPlacementSystem } from '../systems/BuildingPlacementSystem';
import { EnemyManager } from '../systems/EnemyManager';
import { CollisionSystem } from '../systems/CollisionSystem';
import { LevelManager } from '../systems/LevelManager';

export class GamePlay extends Scene
{
    constructor ()
    {
        super('GamePlay');
    }

    create (data)
    {
        console.log('GamePlay - create开始', data);

        // 获取传入的关卡数据
        this.levelData = data?.levelData || null;
        console.log('接收到的关卡数据:', this.levelData);

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
        
        // 创建敌人管理系统
        this.enemyManager = new EnemyManager(this);

        // 创建碰撞检测系统
        this.collisionSystem = new CollisionSystem(this);

        // 创建关卡管理系统
        this.levelManager = new LevelManager(this);

        // 创建UI组件
        this.hud = new HUD(this);
        this.inventoryPanel = new InventoryPanel(this);
        
        // 移除旧的setReferences调用，因为现在在构造函数中传递了引用
        // this.buildingPlacementSystem.setReferences(this.gridSystem, this.hud);
        
        // 设置网格事件监听
        this.setupGridEventHandlers();
        
        // 设置敌人测试控制
        this.setupEnemyTestControls();
        
        // 设置游戏控制（包括暂停）
        this.setupGameControls();

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

        // 重置游戏状态，确保从干净状态开始
        this.resetGameState();

        // 延迟加载关卡，确保场景完全初始化
        this.time.delayedCall(100, () => {
            this.loadLevel();
        });
    }

    // 重置游戏状态
    resetGameState() {
        console.log('重置游戏状态');

        // 重置敌人管理器状态
        if (this.enemyManager) {
            this.enemyManager.resetEnemyManager();
        }

        // 清理建筑放置系统状态
        if (this.buildingPlacementSystem) {
            // 可以添加建筑系统的重置逻辑
        }

        // 重置网格系统状态
        if (this.gridSystem) {
            // 可以添加网格系统的重置逻辑
        }

        console.log('游戏状态重置完成');
    }

    // 加载关卡
    async loadLevel() {
        console.log('加载关卡');

        try {
            // 等待关卡管理器初始化完成
            await this.levelManager.init();

            // 确定要加载的关卡ID
            let levelId = 'level_01'; // 默认关卡一
            if (this.levelData && this.levelData.id) {
                levelId = this.levelData.id;
            }

            console.log('准备加载关卡:', levelId);

            // 加载关卡配置
            if (this.levelManager.loadLevel(levelId)) {
                // 延迟启动关卡，给玩家时间阅读信息
                this.time.delayedCall(6000, () => {
                    this.levelManager.startLevel();
                });
            } else {
                console.error('关卡加载失败:', levelId);
            }
        } catch (error) {
            console.error('关卡初始化失败:', error);
        }
    }
    
    update(time, delta) {
        // 更新建筑放置系统
        if (this.buildingPlacementSystem) {
            this.buildingPlacementSystem.update(time, delta);
        }

        // 更新敌人管理系统
        if (this.enemyManager) {
            this.enemyManager.update(time, delta);
        }

        // 更新碰撞检测系统
        if (this.collisionSystem) {
            this.collisionSystem.update(time, delta);
        }

        // 更新关卡管理系统
        if (this.levelManager) {
            this.levelManager.update(time, delta);
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

    setupEnemyTestControls()
    {
        // 添加键盘控制用于测试敌人系统
        this.input.keyboard.on('keydown-SPACE', () => {
            if (this.enemyManager) {
                // 空格键：生成随机敌人
                this.enemyManager.spawnEnemy();
                console.log('手动生成敌人 (空格键)');
            }
        });
        
        this.input.keyboard.on('keydown-ONE', () => {
            if (this.enemyManager) {
                // 数字1：生成氢气
                this.enemyManager.spawnEnemy('H2');
                console.log('生成氢气 (数字1)');
            }
        });
        
        this.input.keyboard.on('keydown-TWO', () => {
            if (this.enemyManager) {
                // 数字2：生成水
                this.enemyManager.spawnEnemy('H2O');
                console.log('生成水 (数字2)');
            }
        });
        
        this.input.keyboard.on('keydown-THREE', () => {
            if (this.enemyManager) {
                // 数字3：生成氯化钠
                this.enemyManager.spawnEnemy('NaCl');
                console.log('生成氯化钠 (数字3)');
            }
        });
        
        this.input.keyboard.on('keydown-S', () => {
            if (this.enemyManager) {
                // S键：停止/开始自动生成
                if (this.enemyManager.isSpawning) {
                    this.enemyManager.stopSpawning();
                    console.log('停止自动生成敌人 (S键)');
                } else {
                    this.enemyManager.startTestSpawning();
                    console.log('开始自动生成敌人 (S键)');
                }
            }
        });
        
        this.input.keyboard.on('keydown-C', () => {
            if (this.enemyManager) {
                // C键：清除所有敌人
                this.enemyManager.clearAllEnemies();
                console.log('清除所有敌人 (C键)');
            }
        });
        
        // 显示控制提示
        console.log('敌人系统测试控制：');
        console.log('空格键：生成随机敌人');
        console.log('数字1：生成氢气');
        console.log('数字2：生成水');
        console.log('数字3：生成氯化钠');
        console.log('S键：切换自动生成');
        console.log('C键：清除所有敌人');
    }
    
    setupGameControls()
    {
        // ESC键：切换暂停状态
        this.input.keyboard.on('keydown-ESC', () => {
            if (this.hud) {
                this.hud.togglePause();
                console.log('ESC键切换暂停状态');
            }
        });
        
        // P键：备用暂停键
        this.input.keyboard.on('keydown-P', () => {
            if (this.hud) {
                this.hud.togglePause();
                console.log('P键切换暂停状态');
            }
        });
        
        console.log('游戏控制设置完成：');
        console.log('ESC/P键：暂停/恢复游戏');
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
        
        // 敌人管理系统不需要resize，因为它使用网格系统的坐标
        
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
        if (this.enemyManager) {
            this.enemyManager.destroy();
        }
        if (this.collisionSystem) {
            this.collisionSystem.destroy();
        }
        if (this.levelManager) {
            this.levelManager.destroy();
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