# Ubuntu 服务器部署记录

本文记录“翱翔之翼”官网平台部署到阿里云 Ubuntu ECS 的基础流程。它既是部署说明，也是以后排错和复盘的参考。

## 当前服务器

- 公网 IP：`121.40.156.210`
- 系统：Ubuntu 26.04 LTS
- 登录方式：`ssh root@121.40.156.210`
- 项目目录：`/opt/aoxiang`
- 前端发布目录：`/var/www/aoxiang`
- 后端端口：`3001`
- 数据库：PostgreSQL
- 进程管理：PM2
- 对外访问：Nginx 监听 `80` 端口，并把 `/api` 转发到 `127.0.0.1:3001`

## 1. 更新代码

```bash
cd /opt/aoxiang
git pull
npm install
```

含义：

- `git pull`：从 GitHub 拉取最新代码。
- `npm install`：根据 `package-lock.json` 安装或同步依赖。

如果 `git pull` 提示本地文件会被覆盖，先不要乱删。常见原因是服务器上改过 `package-lock.json` 或其他文件，可以先执行：

```bash
git status
```

确认哪些文件被改动后再处理。

## 2. 配置后端环境变量

编辑服务器上的 `.env`：

```bash
cd /opt/aoxiang
nano .env
```

推荐内容：

```env
DATABASE_CLIENT=postgresql
DATABASE_URL=postgresql://aoxiang_user:Aoxiang_2026_db!@127.0.0.1:5432/aoxiang
DATABASE_SSL=false
PORT=3001
ADMIN_API_TOKEN=请换成你自己的长随机管理密码
```

说明：

- `DATABASE_CLIENT=postgresql`：使用 PostgreSQL，而不是本地 SQLite。
- `DATABASE_URL`：数据库连接地址。
- `DATABASE_SSL=false`：同一台服务器本机连接数据库，不需要 SSL。
- `PORT=3001`：后端服务运行端口。
- `ADMIN_API_TOKEN`：管理后台接口令牌。它相当于后台接口钥匙，正式上线必须换成别人猜不到的长字符串。

## 3. 构建并发布前端

```bash
npm run build
rm -rf /var/www/aoxiang/*
cp -r dist/* /var/www/aoxiang/
```

含义：

- `npm run build`：把 React/Vite 项目打包成浏览器可以直接访问的静态文件。
- `rm -rf /var/www/aoxiang/*`：清空旧的前端文件。
- `cp -r dist/* /var/www/aoxiang/`：把新前端文件复制给 Nginx 发布。

## 4. 重启后端

如果 PM2 已经有 `aoxiang-api`：

```bash
pm2 restart aoxiang-api --update-env
pm2 save
```

如果第一次启动：

```bash
pm2 start server/index.js --name aoxiang-api
pm2 startup
pm2 save
```

含义：

- `pm2 restart ... --update-env`：重启后端，并读取新的 `.env`。
- `pm2 save`：保存当前进程列表，服务器重启后可以自动恢复。

## 5. 验证网站和数据库

验证后端健康：

```bash
curl http://121.40.156.210/api/health
```

成功时应看到类似：

```json
{
  "ok": true,
  "service": "aoxiang-api",
  "database": {
    "type": "PostgreSQL",
    "host": "127.0.0.1:5432"
  }
}
```

验证前端页面：

```text
http://121.40.156.210
```

能打开首页，说明 Nginx 前端发布正常。

## 6. 验证审计日志和管理接口

先确认管理统计接口能访问。把下面的 `你的管理员令牌` 换成 `.env` 里的 `ADMIN_API_TOKEN`：

```bash
curl -H "X-Admin-Token: 你的管理员令牌" http://121.40.156.210/api/admin/audit-stats
```

成功时会返回类似：

```json
{
  "total": 3,
  "pending": 1,
  "approved": 1,
  "needsReview": 1,
  "rejected": 0
}
```

新增一条测试报名，这会自动生成审计日志：

```bash
curl -X POST http://121.40.156.210/api/registrations \
  -H "Content-Type: application/json" \
  -d '{"name":"测试志愿者","college":"计算机与信息工程学院","phone":"13800000000","activity":"接口验证活动","role":"教学志愿者"}'
```

查询这条审计日志：

```bash
curl -H "X-Admin-Token: 你的管理员令牌" "http://121.40.156.210/api/admin/audit-logs?keyword=测试志愿者"
```

如果看到 `registration.create`，说明“用户操作被记录”已经成功。

审阅某条日志，把 `1` 换成实际日志 ID：

```bash
curl -X PATCH http://121.40.156.210/api/admin/audit-logs/1/review \
  -H "Content-Type: application/json" \
  -H "X-Admin-Token: 你的管理员令牌" \
  -H "X-Admin-Name: 管理员" \
  -d '{"reviewStatus":"已通过","reviewComment":"验证通过"}'
```

如果返回 `reviewStatus: "已通过"`，说明审阅流程成功。

## 7. 常见问题

如果访问 `/api/admin/audit-stats` 返回 `401`：

- 检查请求头有没有写 `X-Admin-Token`。
- 检查 token 是否和服务器 `.env` 里的 `ADMIN_API_TOKEN` 一样。
- 修改 `.env` 后要执行 `pm2 restart aoxiang-api --update-env`。

如果 `/api/health` 显示 SQLite：

- 检查 `.env` 里的 `DATABASE_CLIENT` 和 `DATABASE_URL`。
- 重启后端时必须带 `--update-env`。

如果前端能打开但接口不通：

- 检查 Nginx 是否把 `/api` 转发到 `127.0.0.1:3001`。
- 检查 PM2 里的 `aoxiang-api` 是否 `online`：

```bash
pm2 list
```
