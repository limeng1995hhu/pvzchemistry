<script setup>
import { onMounted, onUnmounted, ref } from 'vue';
import { EventBus } from './game/EventBus';
import StartGame from './game/main';

// Save the current scene instance
const scene = ref();
const game = ref();

const emit = defineEmits(['current-active-scene']);

onMounted(() => {

    game.value = StartGame('game-container');

    EventBus.on('current-scene-ready', (currentScene) => {

        emit('current-active-scene', currentScene);

        scene.value = currentScene;

    });

    // 处理页面可见性变化（用户切换标签页时暂停/恢复游戏）
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // 防止触摸设备上的拖拽和缩放
    document.addEventListener('touchstart', preventTouch, { passive: false });
    document.addEventListener('touchmove', preventTouch, { passive: false });
});

onUnmounted(() => {

    if (game.value)
    {
        game.value.destroy(true);
        game.value = null;
    }

    // 清理事件监听器
    document.removeEventListener('visibilitychange', handleVisibilityChange);
    document.removeEventListener('touchstart', preventTouch);
    document.removeEventListener('touchmove', preventTouch);
    
});

// 处理页面可见性变化
const handleVisibilityChange = () => {
    if (game.value) {
        if (document.hidden) {
            game.value.pause();
        } else {
            game.value.resume();
        }
    }
};

// 防止移动设备上的默认触摸行为（如滚动、缩放）
const preventTouch = (e) => {
    // 防止页面滚动和缩放
    if (e.touches.length > 1) {
        e.preventDefault();
    }
};

defineExpose({ scene, game });
</script>

<template>
    <div id="game-container"></div>
</template>

<style scoped>
#game-container {
    width: 100vw;
    height: 100vh;
    overflow: hidden;
    display: block;
    position: relative;
    touch-action: manipulation; /* 防止双击缩放等手势 */
    user-select: none; /* 防止文本选择 */
    -webkit-user-select: none;
    -moz-user-select: none;
    -ms-user-select: none;
}
</style>