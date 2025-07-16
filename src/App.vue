<script setup>
import { ref } from 'vue';
import PhaserGame from './PhaserGame.vue';

//  References to the PhaserGame component (game and scene are exposed)
const phaserRef = ref();

//  This event is emitted from the PhaserGame component:
const currentScene = (scene) => {
    // Scene change handler - can be used for future features
}
</script>

<template>
    <PhaserGame ref="phaserRef" @current-active-scene="currentScene" />
</template>
