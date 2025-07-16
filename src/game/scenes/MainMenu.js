import { EventBus } from '../EventBus';
import { Scene } from 'phaser';

export class MainMenu extends Scene
{
    constructor ()
    {
        super('MainMenu');
    }

    create ()
    {
        // 获取屏幕中心点和尺寸
        const centerX = this.cameras.main.width / 2;
        const centerY = this.cameras.main.height / 2;
        const screenWidth = this.cameras.main.width;
        const screenHeight = this.cameras.main.height;

        // 设置深蓝色背景
        this.cameras.main.setBackgroundColor(0x1a1a2e);

        // 游戏标题 "Elemental Shoot（元素射击）"
        const titleFontSize = Math.min(screenWidth, screenHeight) * 0.12; // 更大的标题字体
        
        const titleText = this.add.text(centerX, centerY - screenHeight * 0.1, 'Elemental Shoot', {
            fontFamily: 'Arial Black', 
            fontSize: titleFontSize, 
            color: '#ffffff',
            stroke: '#0f3460', 
            strokeThickness: Math.max(4, titleFontSize * 0.08),
            align: 'center'
        }).setOrigin(0.5).setDepth(100);

        // 点击提示文字
        const promptFontSize = Math.min(screenWidth, screenHeight) * 0.04;
        
        const promptText = this.add.text(centerX, centerY + screenHeight * 0.15, '点击任意位置进入游戏', {
            fontFamily: 'Arial', 
            fontSize: promptFontSize, 
            color: '#cccccc',
            align: 'center'
        }).setOrigin(0.5).setDepth(100);

        // 添加点击提示的闪烁效果
        this.tweens.add({
            targets: promptText,
            alpha: { from: 1, to: 0.3 },
            duration: 1000,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        // 设置点击事件监听
        this.input.on('pointerdown', () => {
            this.changeScene();
        });

        // 监听屏幕尺寸变化
        this.scale.on('resize', this.handleResize, this);
        
        EventBus.emit('current-scene-ready', this);
    }

    handleResize(gameSize)
    {
        // 当屏幕尺寸改变时重新布局
        const centerX = gameSize.width / 2;
        const centerY = gameSize.height / 2;
        
        // 重新定位和缩放所有元素
        this.children.list.forEach(child => {
            if (child.type === 'Text') {
                if (child.text === 'Elemental Shoot') {
                    // 标题文字
                    child.setPosition(centerX, centerY - gameSize.height * 0.1);
                    const titleFontSize = Math.min(gameSize.width, gameSize.height) * 0.12;
                    child.setFontSize(titleFontSize);
                    child.setStroke('#0f3460', Math.max(4, titleFontSize * 0.08));
                } else {
                    // 提示文字
                    child.setPosition(centerX, centerY + gameSize.height * 0.15);
                    const promptFontSize = Math.min(gameSize.width, gameSize.height) * 0.04;
                    child.setFontSize(promptFontSize);
                }
            }
        });
    }

    changeScene ()
    {
        this.scene.start('GamePlay');
    }
}
