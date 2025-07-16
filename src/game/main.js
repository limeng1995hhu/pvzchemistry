import { Boot } from './scenes/Boot';
import { Game } from './scenes/Game';
import { GamePlay } from './scenes/GamePlay';
import { GameOver } from './scenes/GameOver';
import { MainMenu } from './scenes/MainMenu';
import Phaser from 'phaser';
import { Preloader } from './scenes/Preloader';
import { PauseUI } from './scenes/PauseUI';

// Find out more information about the Game Config at:
// https://docs.phaser.io/api-documentation/typedef/types-core#gameconfig
const config = {
    type: Phaser.AUTO,
    width: window.innerWidth,
    height: window.innerHeight,
    parent: 'game-container',
    backgroundColor: '#028af8',
    scale: {
        mode: Phaser.Scale.RESIZE,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        width: window.innerWidth,
        height: window.innerHeight,
        resolution: Math.min(window.devicePixelRatio || 1, 2), // 限制最大分辨率为2x，避免过度渲染
        zoom: 1 / Math.min(window.devicePixelRatio || 1, 2) // 相应调整缩放
    },
    render: {
        antialias: true,
        pixelArt: false,
        roundPixels: true, // 启用像素对齐，提高文字清晰度
        powerPreference: 'high-performance',
        transparent: false,
        clearBeforeRender: true,
        premultipliedAlpha: false
    },
    scene: [
        Boot,
        Preloader,
        MainMenu,
        Game,
        GamePlay,
        PauseUI,
        GameOver
    ]
};

const StartGame = (parent) => {
    const game = new Phaser.Game({ ...config, parent });
    
    // 监听窗口大小变化
    window.addEventListener('resize', () => {
        game.scale.resize(window.innerWidth, window.innerHeight);
    });
    
    return game;
}

export default StartGame;
