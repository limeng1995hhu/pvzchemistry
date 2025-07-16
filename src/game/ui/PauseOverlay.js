import { EventBus } from '../EventBus.js';

export class PauseOverlay {
    constructor(scene) {
        this.scene = scene;
        this.container = null;
        this.isVisible = false;
        
        this.create();
    }
    
    create() {
        const { width, height } = this.scene.cameras.main;
        
        // 创建主容器
        this.container = this.scene.add.container(0, 0);
        this.container.setDepth(1000); // 确保在最顶层
        this.container.setVisible(false);
        
        // 创建半透明背景遮罩
        this.background = this.scene.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.7);
        this.background.setInteractive(); // 阻止点击穿透
        
        // 创建暂停菜单面板
        this.createPauseMenu();
        
        // 添加到容器
        this.container.add([this.background, this.menuPanel]);
        
        // 设置输入处理
        this.setupInputHandlers();
    }
    
    createPauseMenu() {
        const { width, height } = this.scene.cameras.main;
        const centerX = width / 2;
        const centerY = height / 2;
        
        // 菜单面板背景
        const panelWidth = Math.min(600, width * 0.8);
        const panelHeight = Math.min(500, height * 0.7);
        
        this.menuPanel = this.scene.add.container(centerX, centerY);
        
        // 面板背景
        this.panelBg = this.scene.add.rectangle(0, 0, panelWidth, panelHeight, 0x1a1a2e, 0.95);
        this.panelBg.setStrokeStyle(4, 0x87CEEB);
        
        // 暂停标题
        this.titleText = this.scene.add.text(0, -panelHeight/2 + 60, '游戏已暂停', {
            fontFamily: 'Arial Bold',
            fontSize: '48px',
            color: '#ffffff',
            resolution: 2
        }).setOrigin(0.5);
        
        // 游戏统计区域
        this.createStatsSection(panelWidth, panelHeight);
        
        // 控制按钮
        this.createControlButtons(panelWidth, panelHeight);
        
        // 快捷键提示
        this.createShortcutHints(panelWidth, panelHeight);
        
        // 添加所有元素到菜单面板
        this.menuPanel.add([
            this.panelBg,
            this.titleText,
            this.statsContainer,
            this.buttonsContainer,
            this.hintsContainer
        ]);
    }
    
    createStatsSection(panelWidth, panelHeight) {
        this.statsContainer = this.scene.add.container(0, -80);
        
        const statsStyle = {
            fontFamily: 'Arial',
            fontSize: '24px',
            color: '#ffffff',
            resolution: 2
        };
        
        // 能量统计
        this.energyStatText = this.scene.add.text(-150, -40, '当前能量: 100', statsStyle).setOrigin(0, 0.5);
        
        // 敌人统计
        this.enemyStatText = this.scene.add.text(-150, 0, '场上敌人: 0', statsStyle).setOrigin(0, 0.5);
        
        // 生成统计
        this.spawnStatText = this.scene.add.text(-150, 40, '总计生成: 0', statsStyle).setOrigin(0, 0.5);
        
        // 消灭统计
        this.killStatText = this.scene.add.text(50, -40, '消灭敌人: 0', statsStyle).setOrigin(0, 0.5);
        
        // 到达终点统计
        this.reachedStatText = this.scene.add.text(50, 0, '到达终点: 0', statsStyle).setOrigin(0, 0.5);
        
        // 建筑统计
        this.buildingStatText = this.scene.add.text(50, 40, '建筑数量: 0', statsStyle).setOrigin(0, 0.5);
        
        this.statsContainer.add([
            this.energyStatText,
            this.enemyStatText,
            this.spawnStatText,
            this.killStatText,
            this.reachedStatText,
            this.buildingStatText
        ]);
    }
    
    createControlButtons(panelWidth, panelHeight) {
        this.buttonsContainer = this.scene.add.container(0, 80);
        
        const buttonStyle = {
            fontFamily: 'Arial Bold',
            fontSize: '28px',
            color: '#ffffff',
            backgroundColor: '#16213e',
            padding: { x: 30, y: 15 },
            resolution: 2
        };
        
        // 继续游戏按钮
        this.continueButton = this.scene.add.text(-120, 0, '⏵ 继续游戏', buttonStyle)
            .setOrigin(0.5)
            .setInteractive()
            .on('pointerover', () => this.onButtonHover(this.continueButton))
            .on('pointerout', () => this.onButtonOut(this.continueButton))
            .on('pointerdown', () => this.resumeGame());
            
        // 返回主菜单按钮
        this.menuButton = this.scene.add.text(120, 0, '🏠 主菜单', buttonStyle)
            .setOrigin(0.5)
            .setInteractive()
            .on('pointerover', () => this.onButtonHover(this.menuButton))
            .on('pointerout', () => this.onButtonOut(this.menuButton))
            .on('pointerdown', () => this.returnToMainMenu());
        
        this.buttonsContainer.add([this.continueButton, this.menuButton]);
    }
    
    createShortcutHints(panelWidth, panelHeight) {
        this.hintsContainer = this.scene.add.container(0, panelHeight/2 - 60);
        
        const hintStyle = {
            fontFamily: 'Arial',
            fontSize: '18px',
            color: '#cccccc',
            resolution: 2
        };
        
        const hintsText = this.scene.add.text(0, 0, 
            'ESC - 暂停/继续    空格 - 生成敌人    S - 切换自动生成    C - 清除敌人', 
            hintStyle).setOrigin(0.5);
            
        this.hintsContainer.add(hintsText);
    }
    
    setupInputHandlers() {
        // ESC键继续游戏
        this.scene.input.keyboard.on('keydown-ESC', () => {
            if (this.isVisible) {
                this.resumeGame();
            }
        });
        
        // 点击背景外区域继续游戏（可选）
        this.background.on('pointerdown', (pointer, localX, localY, event) => {
            // 检查是否点击在菜单面板外
            const bounds = this.panelBg.getBounds();
            if (!bounds.contains(pointer.x, pointer.y)) {
                this.resumeGame();
            }
        });
    }
    
    onButtonHover(button) {
        button.setStyle({ backgroundColor: '#e94560' });
        button.setScale(1.05);
    }
    
    onButtonOut(button) {
        button.setStyle({ backgroundColor: '#16213e' });
        button.setScale(1.0);
    }
    
    show() {
        if (this.isVisible) return;
        
        this.isVisible = true;
        this.container.setVisible(true);
        
        // 更新统计数据
        this.updateStats();
        
        // 播放显示动画
        this.menuPanel.setScale(0.8);
        this.menuPanel.setAlpha(0);
        
        this.scene.tweens.add({
            targets: this.menuPanel,
            scaleX: 1,
            scaleY: 1,
            alpha: 1,
            duration: 300,
            ease: 'Back.easeOut'
        });
        
        // 发送事件
        EventBus.emit('pause-menu-open');
        
        console.log('暂停菜单已显示');
    }
    
    hide() {
        if (!this.isVisible) return;
        
        // 播放隐藏动画
        this.scene.tweens.add({
            targets: this.menuPanel,
            scaleX: 0.8,
            scaleY: 0.8,
            alpha: 0,
            duration: 200,
            ease: 'Power2',
            onComplete: () => {
                this.isVisible = false;
                this.container.setVisible(false);
                
                // 发送事件
                EventBus.emit('pause-menu-close');
            }
        });
        
        console.log('暂停菜单已隐藏');
    }
    
    updateStats() {
        // 更新能量统计
        if (this.scene.hud) {
            this.energyStatText.setText(`当前能量: ${this.scene.hud.currentEnergy}`);
        }
        
        // 更新敌人统计
        if (this.scene.enemyManager) {
            const stats = this.scene.enemyManager.getStats();
            this.enemyStatText.setText(`场上敌人: ${stats.currentAlive}`);
            this.spawnStatText.setText(`总计生成: ${stats.totalSpawned}`);
            this.killStatText.setText(`消灭敌人: ${stats.totalKilled}`);
            this.reachedStatText.setText(`到达终点: ${stats.totalReachedEnd}`);
        }
        
        // 更新建筑统计
        if (this.scene.buildingPlacementSystem) {
            const buildingCount = this.scene.buildingPlacementSystem.buildings.size;
            this.buildingStatText.setText(`建筑数量: ${buildingCount}`);
        }
    }
    
    resumeGame() {
        this.hide();
        
        // 通知HUD恢复游戏
        if (this.scene.hud) {
            this.scene.hud.resumeGame();
        }
    }
    
    returnToMainMenu() {
        // 确认对话框（可选）
        const confirmReturn = confirm('确定要返回主菜单吗？当前进度将会丢失。');
        
        if (confirmReturn) {
            // 清理当前场景
            this.hide();
            
            // 切换到主菜单
            this.scene.scene.start('MainMenu');
            
            console.log('返回主菜单');
        }
    }
    
    resize(width, height) {
        // 更新背景大小
        this.background.setSize(width, height);
        this.background.setPosition(width / 2, height / 2);
        
        // 更新菜单面板位置
        this.menuPanel.setPosition(width / 2, height / 2);
        
        // 重新创建菜单内容以适应新尺寸
        this.menuPanel.removeAll(true);
        this.createPauseMenu();
    }
    
    destroy() {
        if (this.container) {
            this.container.destroy();
        }
        
        // 清理输入监听器
        this.scene.input.keyboard.off('keydown-ESC');
        
        // 清理引用
        this.scene = null;
        this.container = null;
    }
} 