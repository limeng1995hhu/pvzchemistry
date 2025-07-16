import { EventBus } from '../EventBus';
import { Scene } from 'phaser';

export class GameOver extends Scene
{
    constructor ()
    {
        super('GameOver');
    }

    create ()
    {
        // 获取屏幕中心点和尺寸
        const centerX = this.cameras.main.width / 2;
        const centerY = this.cameras.main.height / 2;
        const screenWidth = this.cameras.main.width;
        const screenHeight = this.cameras.main.height;

        this.cameras.main.setBackgroundColor(0xff0000);

        // 背景图片适应屏幕尺寸
        const bg = this.add.image(centerX, centerY, 'background').setAlpha(0.5);
        const scaleX = screenWidth / bg.width;
        const scaleY = screenHeight / bg.height;
        const scale = Math.max(scaleX, scaleY);
        bg.setScale(scale);

        // 响应式文字大小
        const fontSize = Math.min(screenWidth, screenHeight) * 0.08; // 比其他场景稍大一些

        this.add.text(centerX, centerY, 'Game Over', {
            fontFamily: 'Arial Black', 
            fontSize: fontSize, 
            color: '#ffffff',
            stroke: '#000000', 
            strokeThickness: Math.max(2, fontSize * 0.125),
            align: 'center'
        }).setOrigin(0.5).setDepth(100);

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
            if (child.texture && child.texture.key === 'background') {
                child.setPosition(centerX, centerY);
                const scaleX = gameSize.width / child.width;
                const scaleY = gameSize.height / child.height;
                const scale = Math.max(scaleX, scaleY);
                child.setScale(scale);
            } else if (child.type === 'Text') {
                child.setPosition(centerX, centerY);
                const fontSize = Math.min(gameSize.width, gameSize.height) * 0.08;
                child.setFontSize(fontSize);
                child.setStroke('#000000', Math.max(2, fontSize * 0.125));
            }
        });
    }

    changeScene ()
    {
        this.scene.start('MainMenu');
    }
}
