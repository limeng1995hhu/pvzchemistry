# 🚀 GitHub Pages 部署检查清单

## 📋 部署前检查

### ✅ 文件和配置检查
- [ ] `public/assets/data/levels.json` 文件存在且格式正确
- [ ] `vite/config.prod.mjs` 中 `base: '/pvzchemistry/'` 配置正确
- [ ] `.github/workflows/deploy.yml` 工作流文件存在
- [ ] `package.json` 中包含 `build-nolog` 脚本
- [ ] 运行 `node scripts/verify-deployment.js` 全部通过

### ✅ GitHub 仓库设置
- [ ] 仓库名为 `pvzchemistry`
- [ ] 仓库设置中 Pages 源选择为 "GitHub Actions"
- [ ] 仓库具有 Pages 写入权限

### ✅ 本地测试
- [ ] `npm install` 安装依赖成功
- [ ] `npm run build-nolog` 构建成功
- [ ] `dist/assets/data/levels.json` 文件存在
- [ ] 本地预览功能正常

## 🚀 部署步骤

### 1. 提交代码
```bash
git add .
git commit -m "配置 GitHub Pages 自动部署"
git push origin main
```

### 2. 监控部署
- [ ] GitHub Actions 工作流开始运行
- [ ] 所有步骤执行成功（绿色勾号）
- [ ] 部署完成通知

### 3. 验证部署
- [ ] 访问 `https://[用户名].github.io/pvzchemistry/`
- [ ] 页面正常加载
- [ ] 游戏功能正常
- [ ] 浏览器控制台无 404 错误

## 🔍 部署后验证

### 功能测试
- [ ] 主菜单显示正常
- [ ] 关卡选择功能正常
- [ ] 游戏可以正常开始
- [ ] JSON 数据加载成功
- [ ] 游戏逻辑运行正常

### 性能检查
- [ ] 页面加载速度合理
- [ ] 资源文件正确加载
- [ ] 无明显性能问题

## 🛠️ 故障排除

### 如果遇到问题：

1. **检查 GitHub Actions 日志**
   - 进入仓库 Actions 页面
   - 查看失败的工作流详情
   - 根据错误信息进行修复

2. **验证文件路径**
   ```bash
   # 检查构建输出
   npm run build-nolog
   ls -la dist/assets/data/
   ```

3. **检查网络请求**
   - 打开浏览器开发者工具
   - 查看 Network 标签页
   - 确认所有资源请求成功

4. **重新部署**
   ```bash
   # 强制重新部署
   git commit --allow-empty -m "重新触发部署"
   git push origin main
   ```

## 📞 获取帮助

如果遇到无法解决的问题：
1. 查看 GitHub Actions 的详细日志
2. 检查 `DEPLOYMENT_GUIDE.md` 中的故障排除部分
3. 确认所有配置文件的内容正确
4. 验证 GitHub 仓库设置

---

**完成所有检查项后，您的项目就可以成功部署到 GitHub Pages！**

🌐 **访问地址**: `https://[您的用户名].github.io/pvzchemistry/`
