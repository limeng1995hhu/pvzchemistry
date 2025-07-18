#!/usr/bin/env node

/**
 * 部署验证脚本
 * 检查部署前的必要文件和配置
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

console.log('🔍 验证部署配置...\n');

// 检查必要的文件
const requiredFiles = [
    'public/assets/data/levels.json',
    'vite/config.prod.mjs',
    '.github/workflows/deploy.yml',
    'package.json'
];

let allFilesExist = true;

console.log('📁 检查必要文件:');
requiredFiles.forEach(file => {
    const filePath = path.join(projectRoot, file);
    const exists = fs.existsSync(filePath);
    console.log(`  ${exists ? '✅' : '❌'} ${file}`);
    if (!exists) allFilesExist = false;
});

if (!allFilesExist) {
    console.log('\n❌ 部分必要文件缺失，请检查！');
    process.exit(1);
}

// 检查 levels.json 文件内容
console.log('\n📄 检查 levels.json 文件:');
try {
    const levelsPath = path.join(projectRoot, 'public/assets/data/levels.json');
    const levelsContent = fs.readFileSync(levelsPath, 'utf8');
    const levelsData = JSON.parse(levelsContent);
    
    console.log(`  ✅ JSON 格式有效`);
    console.log(`  ✅ 包含 ${Object.keys(levelsData.levels || {}).length} 个关卡`);
    console.log(`  ✅ 包含 ${Object.keys(levelsData.elements || {}).length} 个元素`);
    console.log(`  ✅ 包含 ${Object.keys(levelsData.reactions || {}).length} 个反应`);
} catch (error) {
    console.log(`  ❌ levels.json 文件有问题: ${error.message}`);
    process.exit(1);
}

// 检查 Vite 配置
console.log('\n⚙️  检查 Vite 配置:');
try {
    const viteConfigPath = path.join(projectRoot, 'vite/config.prod.mjs');
    const viteConfig = fs.readFileSync(viteConfigPath, 'utf8');
    
    if (viteConfig.includes("base: '/pvzchemistry/'")) {
        console.log('  ✅ GitHub Pages 基础路径配置正确');
    } else {
        console.log('  ⚠️  请检查 base 路径配置');
    }
} catch (error) {
    console.log(`  ❌ Vite 配置检查失败: ${error.message}`);
}

// 检查 package.json 脚本
console.log('\n📦 检查 package.json 脚本:');
try {
    const packagePath = path.join(projectRoot, 'package.json');
    const packageContent = fs.readFileSync(packagePath, 'utf8');
    const packageData = JSON.parse(packageContent);
    
    if (packageData.scripts && packageData.scripts['build-nolog']) {
        console.log('  ✅ build-nolog 脚本存在');
    } else {
        console.log('  ❌ build-nolog 脚本缺失');
    }
} catch (error) {
    console.log(`  ❌ package.json 检查失败: ${error.message}`);
}

console.log('\n🚀 部署准备检查完成！');
console.log('\n📋 下一步操作:');
console.log('1. 确保您的 GitHub 仓库名为 "pvzchemistry"');
console.log('2. 在 GitHub 仓库设置中启用 Pages，选择 "GitHub Actions" 作为源');
console.log('3. 推送代码到 main 分支触发自动部署');
console.log('4. 或者在 GitHub Actions 页面手动触发 "Deploy to GitHub Pages" 工作流');
console.log('\n🌐 部署后访问地址: https://[您的用户名].github.io/pvzchemistry/');
