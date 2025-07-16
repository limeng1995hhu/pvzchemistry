import { Scene } from 'phaser';

export class Boot extends Scene
{
    constructor ()
    {
        super('Boot');
    }

    preload ()
    {
        //  The Boot Scene is typically used to load in any assets you require for your Preloader, such as a game logo or background.
        //  The smaller the file size of the assets, the better, as the Boot Scene itself has no preloader.

        // 加载炮台PNG文件
        this.load.image('cannon', 'assets/现代炮台侧面视角.png');
    }

    create ()
    {
        this.scene.start('Preloader');
    }
}
