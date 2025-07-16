export class HUD {
    constructor(scene) {
        this.scene = scene;
        this.currentEnergy = 100;
        this.isPaused = false;
        
        this.create();
    }

    create() {
        const { width } = this.scene.cameras.main;
        
        // 创建HUD容器
        this.container = this.scene.add.container(0, 0);
        
        // HUD背景
        this.background = this.scene.add.rectangle(width / 2, 40, width - 20, 60, 0x0f3460, 0.8);
        this.background.setStrokeStyle(2, 0x87CEEB);
        this.container.add(this.background);

        // 能量显示
        this.energyIcon = this.scene.add.text(Math.round(30), Math.round(40), '⚡', {
            fontFamily: 'Arial',
            fontSize: '24px',
            color: '#e94560',
            resolution: 2 // 强制高分辨率渲染
        }).setOrigin(0, 0.5);
        
        this.energyText = this.scene.add.text(Math.round(60), Math.round(40), `能量: ${this.currentEnergy}`, {
            fontFamily: 'Arial Bold',
            fontSize: '20px',
            color: '#e94560',
            resolution: 2 // 强制高分辨率渲染
        }).setOrigin(0, 0.5);

        this.container.add([this.energyIcon, this.energyText]);

        // 游戏信息显示
        this.gameInfo = this.scene.add.text(Math.round(width / 2), Math.round(40), 'Lab Defenders', {
            fontFamily: 'Arial Bold',
            fontSize: '18px',
            color: '#ffffff',
            resolution: 2 // 强制高分辨率渲染
        }).setOrigin(0.5);
        this.container.add(this.gameInfo);

        // 创建按钮
        this.createButtons();
    }

    createButtons() {
        const { width } = this.scene.cameras.main;
        const buttonStyle = {
            fontFamily: 'Arial',
            fontSize: '16px',
            color: '#ffffff',
            backgroundColor: '#16213e',
            padding: { x: 12, y: 6 }
        };

        // 暂停按钮
        this.pauseButton = this.scene.add.text(width - 280, 40, '⏸ 暂停', buttonStyle)
            .setOrigin(0.5)
            .setInteractive()
            .on('pointerover', () => this.onButtonHover(this.pauseButton))
            .on('pointerout', () => this.onButtonOut(this.pauseButton))
            .on('pointerdown', () => this.togglePause());

        // 化学表按钮
        this.chemicalButton = this.scene.add.text(width - 190, 40, '🧪 化学表', buttonStyle)
            .setOrigin(0.5)
            .setInteractive()
            .on('pointerover', () => this.onButtonHover(this.chemicalButton))
            .on('pointerout', () => this.onButtonOut(this.chemicalButton))
            .on('pointerdown', () => this.openChemicalGuide());

        // 设置按钮
        this.settingsButton = this.scene.add.text(width - 100, 40, '⚙ 设置', buttonStyle)
            .setOrigin(0.5)
            .setInteractive()
            .on('pointerover', () => this.onButtonHover(this.settingsButton))
            .on('pointerout', () => this.onButtonOut(this.settingsButton))
            .on('pointerdown', () => this.openSettings());

        this.container.add([this.pauseButton, this.chemicalButton, this.settingsButton]);
    }

    onButtonHover(button) {
        button.setStyle({ backgroundColor: '#e94560' });
        button.setScale(1.05);
    }

    onButtonOut(button) {
        button.setStyle({ backgroundColor: '#16213e' });
        button.setScale(1.0);
    }

    togglePause() {
        this.isPaused = !this.isPaused;
        
        if (this.isPaused) {
            this.scene.scene.pause();
            this.pauseButton.setText('▶ 继续');
            this.showMessage('游戏已暂停');
        } else {
            this.scene.scene.resume();
            this.pauseButton.setText('⏸ 暂停');
        }
    }

    openChemicalGuide() {
        this.showMessage('化学方程表功能开发中...');
        // 后续可以启动化学方程表场景
        // this.scene.scene.launch('ChemicalGuide');
    }

    openSettings() {
        this.showMessage('设置功能开发中...');
        // 后续可以启动设置场景
        // this.scene.scene.launch('Settings');
    }

    updateEnergy(amount) {
        this.currentEnergy = Math.max(0, amount);
        this.energyText.setText(`能量: ${this.currentEnergy}`);
        
        // 能量不足时的视觉提示
        if (this.currentEnergy < 20) {
            this.energyText.setColor('#ff6b6b'); // 红色警告
            this.energyIcon.setTint(0xff6b6b);
        } else {
            this.energyText.setColor('#e94560'); // 正常颜色
            this.energyIcon.clearTint();
        }
    }

    addEnergy(amount) {
        this.updateEnergy(this.currentEnergy + amount);
        
        // 显示能量增加效果
        this.showEnergyGain(amount);
    }

    spendEnergy(amount) {
        if (this.currentEnergy >= amount) {
            this.updateEnergy(this.currentEnergy - amount);
            return true;
        }
        
        this.showMessage('能量不足！');
        return false;
    }

    showEnergyGain(amount) {
        const gainText = this.scene.add.text(
            this.energyText.x + 150, 
            this.energyText.y, 
            `+${amount}`, 
            {
                fontFamily: 'Arial Bold',
                fontSize: '18px',
                color: '#4ecdc4'
            }
        ).setOrigin(0, 0.5);

        // 动画效果
        this.scene.tweens.add({
            targets: gainText,
            y: gainText.y - 30,
            alpha: 0,
            duration: 1500,
            ease: 'Power2',
            onComplete: () => gainText.destroy()
        });
    }

    showMessage(text, color = '#ffffff') {
        // 移除之前的消息
        if (this.currentMessage) {
            this.currentMessage.destroy();
        }

        this.currentMessage = this.scene.add.text(
            this.scene.cameras.main.width / 2, 
            120, 
            text, 
            {
                fontFamily: 'Arial',
                fontSize: '16px',
                color: color,
                backgroundColor: '#000000',
                padding: { x: 15, y: 8 }
            }
        ).setOrigin(0.5);

        // 2.5秒后自动消失
        this.scene.time.delayedCall(2500, () => {
            if (this.currentMessage) {
                this.currentMessage.destroy();
                this.currentMessage = null;
            }
        });
    }

    resize(width, height) {
        // 更新HUD位置和尺寸
        this.background.setSize(width - 20, 60);
        this.background.x = width / 2;
        
        this.gameInfo.x = width / 2;
        
        // 更新按钮位置
        this.pauseButton.x = width - 280;
        this.chemicalButton.x = width - 190;
        this.settingsButton.x = width - 100;
    }

    destroy() {
        if (this.container) {
            this.container.destroy();
        }
        if (this.currentMessage) {
            this.currentMessage.destroy();
        }
    }
} 