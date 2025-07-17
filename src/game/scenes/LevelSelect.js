import { Scene } from 'phaser';
import { EventBus } from '../EventBus';
import { configManager } from '../systems/ConfigManager';

export class LevelSelect extends Scene {
    constructor() {
        super('LevelSelect');
        this.selectedLevel = null;
        this.levelButtons = [];
    }
    
    async create() {
        console.log('LevelSelect - create开始');
        
        // 加载配置
        await configManager.loadConfigs();
        console.log('LevelSelect: 配置加载完成，isLoaded:', configManager.isConfigLoaded());

        // 确保配置已加载
        if (!configManager.isConfigLoaded()) {
            console.error('LevelSelect: 配置加载失败');
            this.add.text(width / 2, height / 2, '配置加载失败', {
                fontFamily: 'Arial',
                fontSize: '24px',
                color: '#ff0000'
            }).setOrigin(0.5);
            return;
        }
        
        const { width, height } = this.cameras.main;
        
        // 背景
        this.cameras.main.setBackgroundColor(0x1a1a2e);
        
        // 标题
        this.add.text(width / 2, 80, '选择关卡', {
            fontFamily: 'Arial',
            fontSize: '48px',
            color: '#ffffff'
        }).setOrigin(0.5);
        
        // 创建关卡列表
        this.createLevelList();
        
        // 返回按钮
        this.createBackButton();
        
        EventBus.emit('current-scene-ready', this);
    }
    
    createLevelList() {
        const { width, height } = this.cameras.main;
        const levelsConfig = configManager.getAllLevelConfigs();
        console.log('LevelSelect: 获取到的关卡配置:', levelsConfig);
        const levels = Object.values(levelsConfig || {}); // 转换为数组，处理空值
        console.log('LevelSelect: 转换后的关卡数组:', levels);

        if (levels.length === 0) {
            // 如果没有关卡配置，显示提示信息
            this.add.text(width / 2, height / 2, '没有可用的关卡', {
                fontFamily: 'Arial',
                fontSize: '24px',
                color: '#ffffff'
            }).setOrigin(0.5);
            return;
        }

        const startY = 180;
        const buttonHeight = 80;
        const buttonSpacing = 20;
        const buttonWidth = Math.min(600, width - 100);

        levels.forEach((level, index) => {
            const y = startY + index * (buttonHeight + buttonSpacing);
            
            // 关卡按钮容器
            const buttonContainer = this.add.container(width / 2, y);
            
            // 按钮背景
            const buttonBg = this.add.graphics();
            buttonBg.fillStyle(0x16213e, 0.9);
            buttonBg.fillRoundedRect(-buttonWidth/2, -buttonHeight/2, buttonWidth, buttonHeight, 10);
            buttonBg.lineStyle(2, this.getDifficultyColor(level.difficulty), 1);
            buttonBg.strokeRoundedRect(-buttonWidth/2, -buttonHeight/2, buttonWidth, buttonHeight, 10);
            
            // 关卡名称
            const levelName = this.add.text(-buttonWidth/2 + 20, -15, level.name, {
                fontFamily: 'Arial',
                fontSize: '24px',
                color: '#ffffff'
            });
            
            // 关卡描述
            const levelDesc = this.add.text(-buttonWidth/2 + 20, 10, level.description, {
                fontFamily: 'Arial',
                fontSize: '14px',
                color: '#cccccc'
            });
            
            // 难度显示
            const difficultyText = this.getDifficultyText(level.difficulty);
            const difficulty = this.add.text(buttonWidth/2 - 20, -15, difficultyText, {
                fontFamily: 'Arial',
                fontSize: '18px',
                color: this.getDifficultyColor(level.difficulty)
            }).setOrigin(1, 0);
            
            // 初始能量显示
            const energyText = this.add.text(buttonWidth/2 - 20, 10, `初始能量: ${level.initialEnergy}⚡`, {
                fontFamily: 'Arial',
                fontSize: '14px',
                color: '#e94560'
            }).setOrigin(1, 0);
            
            buttonContainer.add([buttonBg, levelName, levelDesc, difficulty, energyText]);
            
            // 交互设置
            buttonBg.setInteractive(new Phaser.Geom.Rectangle(-buttonWidth/2, -buttonHeight/2, buttonWidth, buttonHeight), Phaser.Geom.Rectangle.Contains);
            
            // 悬停效果
            buttonBg.on('pointerover', () => {
                buttonBg.clear();
                buttonBg.fillStyle(0x0f3460, 0.9);
                buttonBg.fillRoundedRect(-buttonWidth/2, -buttonHeight/2, buttonWidth, buttonHeight, 10);
                buttonBg.lineStyle(3, this.getDifficultyColor(level.difficulty), 1);
                buttonBg.strokeRoundedRect(-buttonWidth/2, -buttonHeight/2, buttonWidth, buttonHeight, 10);
                buttonContainer.setScale(1.02);
            });
            
            buttonBg.on('pointerout', () => {
                buttonBg.clear();
                buttonBg.fillStyle(0x16213e, 0.9);
                buttonBg.fillRoundedRect(-buttonWidth/2, -buttonHeight/2, buttonWidth, buttonHeight, 10);
                buttonBg.lineStyle(2, this.getDifficultyColor(level.difficulty), 1);
                buttonBg.strokeRoundedRect(-buttonWidth/2, -buttonHeight/2, buttonWidth, buttonHeight, 10);
                buttonContainer.setScale(1.0);
            });
            
            // 点击事件
            buttonBg.on('pointerdown', () => {
                this.selectLevel(level);
            });
            
            this.levelButtons.push(buttonContainer);
        });
    }
    
    getDifficultyColor(difficulty) {
        const colors = {
            1: 0x6bcf7f, // 绿色 - 简单
            2: 0xffd93d, // 黄色 - 普通
            3: 0xff6b7a, // 橙色 - 困难
            4: 0xe94560, // 红色 - 很难
            5: 0x9d4edd  // 紫色 - 极难
        };
        return colors[difficulty] || 0x6bcf7f;
    }
    
    getDifficultyText(difficulty) {
        const texts = {
            1: '★☆☆☆☆ 简单',
            2: '★★☆☆☆ 普通', 
            3: '★★★☆☆ 困难',
            4: '★★★★☆ 很难',
            5: '★★★★★ 极难'
        };
        return texts[difficulty] || '★☆☆☆☆ 简单';
    }
    
    selectLevel(level) {
        console.log('选择关卡:', level.name);
        this.selectedLevel = level;
        
        // 播放选择音效
        // this.sound.play('select');
        
        // 显示确认对话框或直接进入游戏
        this.showLevelConfirm(level);
    }
    
    showLevelConfirm(level) {
        const { width, height } = this.cameras.main;
        
        // 创建确认对话框
        const overlay = this.add.graphics();
        overlay.fillStyle(0x000000, 0.7);
        overlay.fillRect(0, 0, width, height);
        overlay.setDepth(100);
        
        const dialogWidth = 400;
        const dialogHeight = 300;
        const dialog = this.add.graphics();
        dialog.fillStyle(0x16213e, 1);
        dialog.fillRoundedRect(width/2 - dialogWidth/2, height/2 - dialogHeight/2, dialogWidth, dialogHeight, 15);
        dialog.lineStyle(3, 0xe94560, 1);
        dialog.strokeRoundedRect(width/2 - dialogWidth/2, height/2 - dialogHeight/2, dialogWidth, dialogHeight, 15);
        dialog.setDepth(101);
        
        // 对话框内容
        const title = this.add.text(width/2, height/2 - 80, `确认进入关卡`, {
            fontFamily: 'Arial',
            fontSize: '24px',
            color: '#ffffff'
        }).setOrigin(0.5).setDepth(102);
        
        const levelName = this.add.text(width/2, height/2 - 40, level.name, {
            fontFamily: 'Arial',
            fontSize: '20px',
            color: '#e94560'
        }).setOrigin(0.5).setDepth(102);
        
        const description = this.add.text(width/2, height/2, level.description, {
            fontFamily: 'Arial',
            fontSize: '16px',
            color: '#cccccc',
            wordWrap: { width: dialogWidth - 40 }
        }).setOrigin(0.5).setDepth(102);
        
        // 确认按钮
        const confirmBtn = this.createDialogButton(width/2 - 80, height/2 + 60, '开始游戏', 0x6bcf7f, () => {
            this.startLevel(level);
        });
        
        // 取消按钮
        const cancelBtn = this.createDialogButton(width/2 + 80, height/2 + 60, '取消', 0xff6b7a, () => {
            overlay.destroy();
            dialog.destroy();
            title.destroy();
            levelName.destroy();
            description.destroy();
            confirmBtn.destroy();
            cancelBtn.destroy();
        });
    }
    
    createDialogButton(x, y, text, color, callback) {
        const button = this.add.container(x, y);
        button.setDepth(102);
        
        const bg = this.add.graphics();
        bg.fillStyle(color, 1);
        bg.fillRoundedRect(-60, -20, 120, 40, 8);
        
        const label = this.add.text(0, 0, text, {
            fontFamily: 'Arial',
            fontSize: '16px',
            color: '#ffffff'
        }).setOrigin(0.5);
        
        button.add([bg, label]);
        
        bg.setInteractive(new Phaser.Geom.Rectangle(-60, -20, 120, 40), Phaser.Geom.Rectangle.Contains);
        bg.on('pointerover', () => button.setScale(1.1));
        bg.on('pointerout', () => button.setScale(1.0));
        bg.on('pointerdown', callback);
        
        return button;
    }
    
    startLevel(level) {
        console.log('开始关卡:', level.id);
        
        // 将选中的关卡数据传递给游戏场景
        this.scene.start('GamePlay', { levelData: level });
    }
    
    createBackButton() {
        const { width } = this.cameras.main;
        
        const backButton = this.add.text(50, 50, '← 返回主菜单', {
            fontFamily: 'Arial',
            fontSize: '20px',
            color: '#ffffff',
            backgroundColor: '#16213e',
            padding: { x: 15, y: 8 }
        }).setInteractive();
        
        backButton.on('pointerover', () => {
            backButton.setStyle({ backgroundColor: '#e94560' });
            backButton.setScale(1.05);
        });
        
        backButton.on('pointerout', () => {
            backButton.setStyle({ backgroundColor: '#16213e' });
            backButton.setScale(1.0);
        });
        
        backButton.on('pointerdown', () => {
            this.scene.start('MainMenu');
        });
    }
}