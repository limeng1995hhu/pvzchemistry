import { EventBus } from '../EventBus';
import { Scene } from 'phaser';

export class Game extends Scene
{
    constructor ()
    {
        super('Game');
    }

    create ()
    {
        // 获取屏幕中心点
        const centerX = this.cameras.main.worldView.x + this.cameras.main.width / 2;
        const centerY = this.cameras.main.worldView.y + this.cameras.main.height / 2;

        this.cameras.main.setBackgroundColor(0x00ff00);

        // 背景图片适应屏幕尺寸
        const bg = this.add.image(centerX, centerY, 'background').setAlpha(0.5);
        
        // 根据屏幕尺寸调整背景图片大小
        const scaleX = this.cameras.main.width / bg.width;
        const scaleY = this.cameras.main.height / bg.height;
        const scale = Math.max(scaleX, scaleY); // 使用较大的缩放比例以填充屏幕
        bg.setScale(scale);

        // 响应式文字大小
        const fontSize = Math.min(this.cameras.main.width, this.cameras.main.height) * 0.05; // 屏幕尺寸的5%
        
        this.add.text(centerX, centerY, 'Make something fun!\nand share it with us:\nsupport@phaser.io', {
            fontFamily: 'Arial Black', 
            fontSize: fontSize, 
            color: '#ffffff',
            stroke: '#000000', 
            strokeThickness: Math.max(2, fontSize * 0.1),
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
        
        // 这里可以添加重新定位游戏对象的逻辑
        this.children.list.forEach(child => {
            if (child.texture && child.texture.key === 'background') {
                child.setPosition(centerX, centerY);
                const scaleX = gameSize.width / child.width;
                const scaleY = gameSize.height / child.height;
                const scale = Math.max(scaleX, scaleY);
                child.setScale(scale);
            }
        });
    }

    changeScene ()
    {
        this.scene.start('GameOver');
    }
}
