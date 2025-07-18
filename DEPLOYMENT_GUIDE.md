# GitHub Pages 部署指南

## 🎯 快速部署步骤

### 1. 准备工作

确保您的项目已经完成以下配置：
- ✅ `public/assets/data/levels.json` 文件存在
- ✅ GitHub Actions 工作流已配置
- ✅ Vite 生产配置正确设置基础路径

### 2. GitHub 仓库设置

1. **确保仓库名称**：
   - 仓库名应为 `pvzchemistry`（与 `vite/config.prod.mjs` 中的 `base` 路径匹配）

2. **启用 GitHub Pages**：
   - 进入仓库设置：`Settings` → `Pages`
   - 在 "Source" 下拉菜单中选择 **"GitHub Actions"**
   - 保存设置

### 3. 部署方式

#### 方式一：自动部署（推荐）
```bash
# 推送到 main 分支会自动触发部署
git add .
git commit -m "部署到 GitHub Pages"
git push origin main
```

#### 方式二：手动触发
1. 进入 GitHub 仓库的 `Actions` 页面
2. 选择 "Deploy to GitHub Pages" 工作流
3. 点击 "Run workflow" 按钮
4. 选择 `main` 分支并点击 "Run workflow"

### 4. 验证部署

#### 本地验证
```bash
# 运行验证脚本
node scripts/verify-deployment.js

# 本地构建测试
npm run build-nolog
```

#### 在线验证
1. 等待 GitHub Actions 工作流完成（通常需要 2-5 分钟）
2. 访问部署地址：`https://[您的用户名].github.io/pvzchemistry/`
3. 检查浏览器开发者工具，确保没有 404 错误

## 🔧 故障排除

### 常见问题

#### 1. JSON 文件 404 错误
**症状**：浏览器控制台显示 `levels.json` 文件 404 错误

**解决方案**：
```bash
# 确保文件在正确位置
ls -la public/assets/data/levels.json

# 重新构建并检查输出
npm run build-nolog
ls -la dist/assets/data/levels.json
```

#### 2. 基础路径错误
**症状**：页面加载但资源路径不正确

**解决方案**：
1. 检查 `vite/config.prod.mjs` 中的 `base` 配置
2. 确保与 GitHub 仓库名匹配
3. 重新部署

#### 3. GitHub Actions 失败
**症状**：工作流运行失败

**解决方案**：
1. 查看 Actions 页面的错误日志
2. 检查 Node.js 版本兼容性
3. 确保所有依赖都在 `package.json` 中

### 调试步骤

1. **检查构建日志**：
   ```bash
   npm run build-nolog
   ```

2. **验证文件结构**：
   ```bash
   tree dist/assets/
   ```

3. **测试 JSON 文件**：
   ```bash
   curl -I https://[您的用户名].github.io/pvzchemistry/assets/data/levels.json
   ```

## 📊 部署状态监控

### GitHub Actions 状态
- 绿色 ✅：部署成功
- 红色 ❌：部署失败，需要检查日志
- 黄色 🟡：正在部署中

### 部署完成确认
1. GitHub Actions 工作流显示绿色勾号
2. Pages 设置页面显示绿色勾号和访问链接
3. 网站可以正常访问且功能正常

## 🚀 优化建议

### 性能优化
- 启用 Vite 的代码分割
- 压缩图片资源
- 使用 CDN 加速

### 监控和维护
- 定期检查 GitHub Actions 运行状态
- 监控网站访问性能
- 及时更新依赖版本

---

**部署成功后的访问地址**：`https://[您的用户名].github.io/pvzchemistry/`

如有问题，请检查 GitHub Actions 日志或参考故障排除部分。
