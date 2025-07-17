import { EventBus } from '../EventBus';
import { Scene } from 'phaser';

export class GameOver extends Scene
{
    constructor ()
    {
        super('GameOver');
    }

    create (data)
    {
        console.log('GameOver场景接收到的数据:', data);

        // 保存传入的数据
        this.gameOverData = data || {};

        // 获取屏幕中心点和尺寸
        const centerX = this.cameras.main.width / 2;
        const centerY = this.cameras.main.height / 2;
        const screenWidth = this.cameras.main.width;
        const screenHeight = this.cameras.main.height;

        this.cameras.main.setBackgroundColor(0x2c1810);

        // 背景图片适应屏幕尺寸
        const bg = this.add.image(centerX, centerY, 'background').setAlpha(0.3);
        const scaleX = screenWidth / bg.width;
        const scaleY = screenHeight / bg.height;
        const scale = Math.max(scaleX, scaleY);
        bg.setScale(scale);

        // 创建UI元素
        this.createUI();

        // 监听屏幕尺寸变化
        this.scale.on('resize', this.handleResize, this);

        EventBus.emit('current-scene-ready', this);
    }

    createUI()
    {
        const centerX = this.cameras.main.width / 2;
        const centerY = this.cameras.main.height / 2;
        const screenWidth = this.cameras.main.width;
        const screenHeight = this.cameras.main.height;

        // 响应式文字大小
        const titleFontSize = Math.min(screenWidth, screenHeight) * 0.08;
        const textFontSize = Math.min(screenWidth, screenHeight) * 0.04;
        const buttonFontSize = Math.min(screenWidth, screenHeight) * 0.035;

        // 游戏失败标题
        this.titleText = this.add.text(centerX, centerY - 150, '游戏失败', {
            fontFamily: 'Arial Black',
            fontSize: titleFontSize,
            color: '#ff4444',
            stroke: '#000000',
            strokeThickness: Math.max(2, titleFontSize * 0.1),
            align: 'center'
        }).setOrigin(0.5).setDepth(100);

        // 失败原因
        let reasonText = '游戏结束';
        if (this.gameOverData.reason === 'all-lanes-disabled') {
            const laneTypeNames = {
                'gas': '气态',
                'liquid': '液态',
                'solid': '固态'
            };
            const laneTypeName = laneTypeNames[this.gameOverData.laneType] || this.gameOverData.laneType;
            reasonText = `所有${laneTypeName}路径都已被突破！`;
        }

        this.reasonText = this.add.text(centerX, centerY - 80, reasonText, {
            fontFamily: 'Arial',
            fontSize: textFontSize,
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: Math.max(1, textFontSize * 0.05),
            align: 'center'
        }).setOrigin(0.5).setDepth(100);

        // 创建按钮
        this.createButtons();
    }

    createButtons()
    {
        const centerX = this.cameras.main.width / 2;
        const centerY = this.cameras.main.height / 2;
        const screenWidth = this.cameras.main.width;
        const buttonFontSize = Math.min(screenWidth, this.cameras.main.height) * 0.035;

        // 按钮样式
        const buttonStyle = {
            fontFamily: 'Arial',
            fontSize: buttonFontSize,
            color: '#ffffff',
            backgroundColor: '#4a4a4a',
            padding: { x: 20, y: 10 },
            stroke: '#ffffff',
            strokeThickness: 2
        };

        // 重试按钮
        this.retryButton = this.add.text(centerX - 120, centerY + 50, '重试本关', buttonStyle)
            .setOrigin(0.5)
            .setDepth(100)
            .setInteractive({ useHandCursor: true })
            .on('pointerdown', () => this.retryLevel())
            .on('pointerover', () => {
                this.retryButton.setStyle({ backgroundColor: '#666666' });
            })
            .on('pointerout', () => {
                this.retryButton.setStyle({ backgroundColor: '#4a4a4a' });
            });

        // 主菜单按钮
        this.menuButton = this.add.text(centerX + 120, centerY + 50, '回到主菜单', buttonStyle)
            .setOrigin(0.5)
            .setDepth(100)
            .setInteractive({ useHandCursor: true })
            .on('pointerdown', () => this.goToMainMenu())
            .on('pointerover', () => {
                this.menuButton.setStyle({ backgroundColor: '#666666' });
            })
            .on('pointerout', () => {
                this.menuButton.setStyle({ backgroundColor: '#4a4a4a' });
            });

        // 键盘控制提示
        this.add.text(centerX, centerY + 120, '按 R 重试 | 按 M 回到主菜单', {
            fontFamily: 'Arial',
            fontSize: buttonFontSize * 0.7,
            color: '#cccccc',
            align: 'center'
        }).setOrigin(0.5).setDepth(100);

        // 设置键盘监听
        this.setupKeyboardControls();
    }

    setupKeyboardControls()
    {
        // R键重试
        this.input.keyboard.on('keydown-R', () => {
            this.retryLevel();
        });

        // M键回到主菜单
        this.input.keyboard.on('keydown-M', () => {
            this.goToMainMenu();
        });

        // ESC键回到主菜单
        this.input.keyboard.on('keydown-ESC', () => {
            this.goToMainMenu();
        });
    }

    retryLevel()
    {
        console.log('重试关卡');

        // 如果有关卡数据，重新开始同一关卡
        if (this.gameOverData.levelData) {
            this.scene.start('GamePlay', { levelData: this.gameOverData.levelData });
        } else if (this.gameOverData.levelId) {
            // 如果只有关卡ID，传递关卡ID
            this.scene.start('GamePlay', { levelData: { id: this.gameOverData.levelId } });
        } else {
            // 默认重新开始第一关
            this.scene.start('GamePlay', { levelData: { id: 'level_01' } });
        }
    }

    goToMainMenu()
    {
        console.log('返回主菜单');
        this.scene.start('MainMenu');
    }

    handleResize(gameSize)
    {
        // 当屏幕尺寸改变时重新布局
        const centerX = gameSize.width / 2;
        const centerY = gameSize.height / 2;

        // 重新定位背景
        this.children.list.forEach(child => {
            if (child.texture && child.texture.key === 'background') {
                child.setPosition(centerX, centerY);
                const scaleX = gameSize.width / child.width;
                const scaleY = gameSize.height / child.height;
                const scale = Math.max(scaleX, scaleY);
                child.setScale(scale);
            }
        });

        // 重新计算字体大小
        const titleFontSize = Math.min(gameSize.width, gameSize.height) * 0.08;
        const textFontSize = Math.min(gameSize.width, gameSize.height) * 0.04;
        const buttonFontSize = Math.min(gameSize.width, gameSize.height) * 0.035;

        // 更新标题位置和大小
        if (this.titleText) {
            this.titleText.setPosition(centerX, centerY - 150);
            this.titleText.setFontSize(titleFontSize);
            this.titleText.setStroke('#000000', Math.max(2, titleFontSize * 0.1));
        }

        // 更新原因文本位置和大小
        if (this.reasonText) {
            this.reasonText.setPosition(centerX, centerY - 80);
            this.reasonText.setFontSize(textFontSize);
            this.reasonText.setStroke('#000000', Math.max(1, textFontSize * 0.05));
        }

        // 更新按钮位置和大小
        if (this.retryButton) {
            this.retryButton.setPosition(centerX - 120, centerY + 50);
            this.retryButton.setFontSize(buttonFontSize);
        }

        if (this.menuButton) {
            this.menuButton.setPosition(centerX + 120, centerY + 50);
            this.menuButton.setFontSize(buttonFontSize);
        }
    }

    changeScene ()
    {
        this.scene.start('MainMenu');
    }

    destroy()
    {
        // 清理键盘事件监听
        if (this.input && this.input.keyboard) {
            this.input.keyboard.off('keydown-R');
            this.input.keyboard.off('keydown-M');
            this.input.keyboard.off('keydown-ESC');
        }

        // 清理屏幕尺寸变化监听
        this.scale.off('resize', this.handleResize, this);

        super.destroy();
    }
}
