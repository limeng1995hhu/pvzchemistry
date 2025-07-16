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
        const screenWidth = this.cameras.main.width;
        const screenHeight = this.cameras.main.height;

        // 设置黑色背景
        this.cameras.main.setBackgroundColor(0x000000);

        // 显示炮台SVG，设置为白色
        this.cannon = this.add.image(centerX, centerY + screenHeight * 0.2, 'cannon');
        this.cannon.setTint(0xffffff); // 设置为白色
        
        // 根据屏幕尺寸调整炮台大小
        const cannonScale = Math.min(screenWidth * 0.8 / this.cannon.width, screenHeight * 0.6 / this.cannon.height);
        this.cannon.setScale(cannonScale);

        // 监听屏幕尺寸变化
        this.scale.on('resize', this.handleResize, this);

        EventBus.emit('current-scene-ready', this);
    }

    handleResize(gameSize)
    {
        // 当屏幕尺寸改变时重新布局
        const centerX = gameSize.width / 2;
        const centerY = gameSize.height / 2;
        
        // 重新定位炮台
        if (this.cannon) {
            this.cannon.setPosition(centerX, centerY + gameSize.height * 0.2);
            const cannonScale = Math.min(gameSize.width * 0.8 / this.cannon.width, gameSize.height * 0.6 / this.cannon.height);
            this.cannon.setScale(cannonScale);
        }
    }

    changeScene ()
    {
        this.scene.start('GameOver');
    }
}
