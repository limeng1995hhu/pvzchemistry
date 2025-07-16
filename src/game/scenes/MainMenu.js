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
        // 获取屏幕中心点和尺寸
        const centerX = this.cameras.main.width / 2;
        const centerY = this.cameras.main.height / 2;
        const screenWidth = this.cameras.main.width;
        const screenHeight = this.cameras.main.height;

        // 背景图片适应屏幕尺寸
        const bg = this.add.image(centerX, centerY, 'background');
        const scaleX = screenWidth / bg.width;
        const scaleY = screenHeight / bg.height;
        const scale = Math.max(scaleX, scaleY);
        bg.setScale(scale);

        // 响应式logo定位和大小
        this.logo = this.add.image(centerX, centerY * 0.6, 'logo').setDepth(100);
        const logoScale = Math.min(screenWidth, screenHeight) * 0.0008; // 根据屏幕尺寸调整logo大小
        this.logo.setScale(logoScale);

        // 响应式文字大小
        const fontSize = Math.min(screenWidth, screenHeight) * 0.06;
        
        this.add.text(centerX, centerY * 1.2, 'Main Menu', {
            fontFamily: 'Arial Black', 
            fontSize: fontSize, 
            color: '#ffffff',
            stroke: '#000000', 
            strokeThickness: Math.max(2, fontSize * 0.1),
            align: 'center'
        }).setDepth(100).setOrigin(0.5);

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
            if (child.texture) {
                if (child.texture.key === 'background') {
                    child.setPosition(centerX, centerY);
                    const scaleX = gameSize.width / child.width;
                    const scaleY = gameSize.height / child.height;
                    const scale = Math.max(scaleX, scaleY);
                    child.setScale(scale);
                } else if (child.texture.key === 'logo') {
                    child.setPosition(centerX, centerY * 0.6);
                    const logoScale = Math.min(gameSize.width, gameSize.height) * 0.0008;
                    child.setScale(logoScale);
                }
            } else if (child.type === 'Text') {
                child.setPosition(centerX, centerY * 1.2);
                const fontSize = Math.min(gameSize.width, gameSize.height) * 0.06;
                child.setFontSize(fontSize);
                child.setStroke('#000000', Math.max(2, fontSize * 0.1));
            }
        });
    }

    changeScene ()
    {
        if (this.logoTween)
        {
            this.logoTween.stop();
            this.logoTween = null;
        }

        this.scene.start('Game');
    }

    moveLogo (vueCallback)
    {
        if (this.logoTween)
        {
            if (this.logoTween.isPlaying())
            {
                this.logoTween.pause();
            }
            else
            {
                this.logoTween.play();
            }
        }
        else
        {
            // 响应式动画目标位置
            const screenWidth = this.cameras.main.width;
            const screenHeight = this.cameras.main.height;
            
            this.logoTween = this.tweens.add({
                targets: this.logo,
                x: { value: screenWidth * 0.75, duration: 3000, ease: 'Back.easeInOut' },
                y: { value: screenHeight * 0.1, duration: 1500, ease: 'Sine.easeOut' },
                yoyo: true,
                repeat: -1,
                onUpdate: () => {
                    vueCallback({
                        x: Math.floor(this.logo.x),
                        y: Math.floor(this.logo.y)
                    });
                }
            });
        }
    }
}
