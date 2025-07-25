import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue'

const phasermsg = () => {
    return {
        name: 'phasermsg',
        buildStart() {
            process.stdout.write(`Building for production...\n`);
        },
        buildEnd() {
            const line = "---------------------------------------------------------";
            const msg = `❤️❤️❤️ Tell us about your game! - games@phaser.io ❤️❤️❤️`;
            process.stdout.write(`${line}\n${msg}\n${line}\n`);

            process.stdout.write(`✨ Done ✨\n`);
        }
    }
}

export default defineConfig({
    base: '/pvzchemistry/',  // GitHub Pages 需要仓库名作为基础路径
    plugins: [
        vue(),
        phasermsg()
    ],
    resolve: {
        alias: {
          '@': fileURLToPath(new URL('../src', import.meta.url))
        }
      },
    logLevel: 'warning',
    build: {
        rollupOptions: {
            output: {
                manualChunks: {
                    phaser: ['phaser']
                }
            }
        },
        minify: 'terser',
        terserOptions: {
            compress: {
                passes: 2
            },
            mangle: true,
            format: {
                comments: false
            }
        }
    }
});
