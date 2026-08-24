# 美食收藏与随机选择 🍜

两个吃货的收藏与随机挑选工具。记录发现的美食和好玩的地方，需要的时候随机选一个。

## 功能

- 🍜 美食收藏：记录店名、地址、城市、标签、价格、评分等
- 🎡 游玩地收藏：记录好玩地点
- 🎲 随机挑选：支持按城市、区域、标签筛选后随机选择
- 📋 链接解析：粘贴小红书/抖音/美团链接，自动提取店名和地址
- 🔄 历史记录：记录每次随机结果

## 数据存储

当前版本使用浏览器本地存储（localStorage），数据保存在本机浏览器中。
如需多设备同步，可升级到 Railway + Turso 云端方案。

## 本地运行

```bash
npm install
npm run dev
```

## 部署

### GitHub Pages（推荐）

项目已配置自动部署，每次推送到 main 分支会自动构建并部署。

部署地址：https://pgst9h8g4n-hub.github.io/food-picker/

### 手动部署

```bash
npm run build
# 将 dist/ 目录上传到 GitHub Pages
```

## 技术栈

- Vite + React + TypeScript
- TailwindCSS 4
- GitHub Pages 托管
