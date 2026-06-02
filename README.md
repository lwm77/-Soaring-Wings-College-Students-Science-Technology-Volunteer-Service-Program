# 阜阳师范大学中科协“翱翔之翼”大学生志愿者服务项目官网

这是一个正在逐步建设的志愿服务项目官网与管理平台。当前版本已经包含前端官网页面、活动报名演示、志愿者证书生成演示，并开始接入 Express 后端和 SQLite 数据库。

## 本地运行

先安装依赖：

```bash
npm install
```

启动后端数据库服务：

```bash
npm run server
```

后端默认运行在：

```text
http://127.0.0.1:3001
```

再打开第二个终端，启动前端页面：

```bash
npm run dev
```

前端默认运行在：

```text
http://127.0.0.1:5173
```

## 后端接口

```text
GET    /api/health          检查后端和数据库是否可用
GET    /api/registrations   获取活动报名记录
POST   /api/registrations   新增活动报名
DELETE /api/registrations   清空活动报名记录
GET    /api/activities      获取活动种子数据
GET    /api/stats           获取基础统计数据
```

## 数据库

当前使用 SQLite。第一次启动后端时，会自动创建：

```text
data/aoxiang.sqlite
```

这个数据库文件只保存在本地，不会上传到 GitHub。`.gitignore` 已经排除了 `data` 文件夹。

## 学习记录

每次开发调整都会同步更新：

```text
LEARNING_LOG.md
CHANGELOG.md
```

`LEARNING_LOG.md` 解释每一步做了什么、为什么这样做，适合从零学习网页平台开发。

`CHANGELOG.md` 记录每个版本新增和调整的功能。
