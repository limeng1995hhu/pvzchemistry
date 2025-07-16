import { Scene } from 'phaser';

export class PauseUI extends Scene {
    constructor() {
        super({ key: 'PauseUI' });
    }

    create() {
        const { width, height } = this.cameras.main;
        // 半透明遮罩
        this.bg = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.7)
            .setInteractive();

        // 菜单面板
        const panelWidth = Math.min(600, width * 0.8);
        const panelHeight = Math.min(400, height * 0.7);
        this.panel = this.add.container(width / 2, height / 2);
        const panelBg = this.add.rectangle(0, 0, panelWidth, panelHeight, 0x1a1a2e, 0.95)
            .setStrokeStyle(4, 0x87CEEB);
        this.panel.add(panelBg);

        // 标题
        const title = this.add.text(0, -panelHeight/2 + 60, '游戏已暂停', {
            fontFamily: 'Arial Bold', fontSize: '48px', color: '#ffffff', resolution: 2
        }).setOrigin(0.5);
        this.panel.add(title);

        // 统计信息
        this.statsText = this.add.text(0, -40, '', {
            fontFamily: 'Arial', fontSize: '24px', color: '#ffffff', resolution: 2, align: 'center'
        }).setOrigin(0.5);
        this.panel.add(this.statsText);
        this.updateStats();

        // 继续游戏按钮
        const continueBtn = this.add.text(0, 40, '⏵ 继续游戏', {
            fontFamily: 'Arial Bold', fontSize: '32px', color: '#ffffff', backgroundColor: '#16213e', padding: { x: 30, y: 15 }, resolution: 2
        }).setOrigin(0.5).setInteractive();
        continueBtn.on('pointerover', () => continueBtn.setStyle({ backgroundColor: '#e94560' }));
        continueBtn.on('pointerout', () => continueBtn.setStyle({ backgroundColor: '#16213e' }));
        continueBtn.on('pointerdown', () => this.resumeGame());
        this.panel.add(continueBtn);

        // 主菜单按钮
        const menuBtn = this.add.text(0, 110, '🏠 主菜单', {
            fontFamily: 'Arial Bold', fontSize: '28px', color: '#ffffff', backgroundColor: '#16213e', padding: { x: 24, y: 12 }, resolution: 2
        }).setOrigin(0.5).setInteractive();
        menuBtn.on('pointerover', () => menuBtn.setStyle({ backgroundColor: '#e94560' }));
        menuBtn.on('pointerout', () => menuBtn.setStyle({ backgroundColor: '#16213e' }));
        menuBtn.on('pointerdown', () => this.returnToMainMenu());
        this.panel.add(menuBtn);

        // 快捷键提示
        const hint = this.add.text(0, panelHeight/2 - 40, 'ESC - 继续游戏', {
            fontFamily: 'Arial', fontSize: '18px', color: '#cccccc', resolution: 2
        }).setOrigin(0.5);
        this.panel.add(hint);

        // ESC键关闭
        this.input.keyboard.on('keydown-ESC', () => this.resumeGame());
        // 点击遮罩关闭
        this.bg.on('pointerdown', () => this.resumeGame());

        // 窗口resize自适应
        this.scale.on('resize', this.handleResize, this);
    }

    updateStats() {
        // 获取主场景统计
        const game = this.scene.get('GamePlay');
        let stats = '';
        if (game && game.hud && game.enemyManager && game.buildingPlacementSystem) {
            stats += `当前能量: ${game.hud.currentEnergy}\n`;
            const estats = game.enemyManager.getStats();
            stats += `场上敌人: ${estats.currentAlive}\n`;
            stats += `总计生成: ${estats.totalSpawned}  消灭: ${estats.totalKilled}  到达终点: ${estats.totalReachedEnd}\n`;
            stats += `建筑数量: ${game.buildingPlacementSystem.buildings.size}`;
        }
        this.statsText.setText(stats);
    }

    resumeGame() {
        // 关闭自身，恢复主场景
        this.scene.stop('PauseUI');
        this.scene.resume('GamePlay');
    }

    returnToMainMenu() {
        const confirmReturn = confirm('确定要返回主菜单吗？当前进度将会丢失。');
        if (confirmReturn) {
            this.scene.stop('PauseUI');
            this.scene.stop('GamePlay');
            this.scene.start('MainMenu');
        }
    }

    handleResize(gameSize) {
        const { width, height } = gameSize;
        this.bg.setSize(width, height);
        this.bg.setPosition(width / 2, height / 2);
        this.panel.setPosition(width / 2, height / 2);
    }
} 