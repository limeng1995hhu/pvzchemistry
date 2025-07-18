import { EventBus } from '../EventBus';
import { Scene } from 'phaser';

export class MainMenu extends Scene
{
    logoTween;

    constructor ()
    {
        super('MainMenu');
    }

    create ()
    {
        const { width, height } = this.cameras.main;

        this.cameras.main.setBackgroundColor(0x1a1a2e);

        // 游戏标题
        this.add.text(width / 2, height / 2 - 150, 'PVZ Chemistry', {
            fontFamily: 'Arial Black',
            fontSize: 64,
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 8,
            align: 'center'
        }).setOrigin(0.5);

        // 按钮样式
        const buttonStyle = {
            fontFamily: 'Arial',
            fontSize: '24px',
            color: '#ffffff',
            backgroundColor: '#16213e',
            padding: { x: 20, y: 10 }
        };

        // 关卡选择按钮
        const levelSelectButton = this.add.text(width / 2, height / 2 + 20, '选择关卡', buttonStyle)
            .setOrigin(0.5)
            .setInteractive()
            .on('pointerover', () => {
                levelSelectButton.setStyle({ backgroundColor: '#e94560' });
                levelSelectButton.setScale(1.05);
            })
            .on('pointerout', () => {
                levelSelectButton.setStyle({ backgroundColor: '#16213e' });
                levelSelectButton.setScale(1.0);
            })
            .on('pointerdown', () => {
                this.scene.start('LevelSelect');
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
                if (child.text === 'PVZ Chemistry') {
                    // 标题文字
                    child.setPosition(centerX, centerY - 150);
                    const titleFontSize = Math.min(gameSize.width, gameSize.height) * 0.08;
                    child.setFontSize(Math.max(titleFontSize, 32));
                } else if (child.text === '选择关卡') {
                    // 关卡选择按钮
                    child.setPosition(centerX, centerY + 20);
                }
            }
        });
    }

    changeScene ()
    {
        this.scene.start('GamePlay');
    }
}
