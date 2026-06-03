# Ubuntu 服务器部署记录

本文档记录“翱翔之翼”官网平台部署到阿里云 Ubuntu ECS 的基础流程，适合作为以后重新部署、排错和学习复盘的参考。

## 当前服务器

- 公网 IP：`121.40.156.210`
- 系统：Ubuntu 26.04 LTS
- 登录方式：SSH，命令为 `ssh root@121.40.156.210`
- 后端端口：`3001`
- 数据库：PostgreSQL

## 1. 安装基础环境

```bash
apt update
apt upgrade -y
apt install -y curl git nginx postgresql postgresql-contrib
```

这些命令的作用：

- `apt update`：更新服务器的软件列表。
- `apt upgrade -y`：升级服务器已安装的软件。
- `curl`：下载 Node.js 安装脚本。
- `git`：从 GitHub 拉取项目代码。
- `nginx`：后续用于对外发布网站页面。
- `postgresql`：正式数据库，用来保存报名、活动、账号等数据。

## 2. 安装 Node.js

```bash
curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
apt install -y nodejs
node -v
npm -v
```

当前已验证版本：

```text
node v22.22.2
npm 10.9.7
```

Node.js 用来运行后端服务，npm 用来安装项目依赖。

## 3. 创建 PostgreSQL 数据库

进入 PostgreSQL 管理命令行：

```bash
sudo -u postgres psql
```

执行：

```sql
CREATE DATABASE aoxiang;
CREATE USER aoxiang_user WITH PASSWORD 'Aoxiang_2026_db!';
GRANT ALL PRIVILEGES ON DATABASE aoxiang TO aoxiang_user;
\q
```

补充 public schema 权限：

```bash
sudo -u postgres psql -d aoxiang -c "GRANT ALL ON SCHEMA public TO aoxiang_user;"
```

这一步是为了让后端可以自动创建数据表。

## 4. 拉取项目代码

```bash
cd /opt
git clone https://github.com/lwm77/-Soaring-Wings-College-Students-Science-Technology-Volunteer-Service-Program.git aoxiang
cd /opt/aoxiang
npm install
```

`/opt/aoxiang` 是服务器上的项目目录。

## 5. 配置环境变量

在 `/opt/aoxiang` 中创建 `.env`：

```bash
cat > .env <<'EOF'
DATABASE_CLIENT=postgresql
DATABASE_URL=postgresql://aoxiang_user:Aoxiang_2026_db!@127.0.0.1:5432/aoxiang
DATABASE_SSL=false
PORT=3001
EOF
```

含义：

- `DATABASE_CLIENT=postgresql`：告诉后端使用 PostgreSQL。
- `DATABASE_URL`：数据库连接地址。
- `DATABASE_SSL=false`：本机数据库连接不启用 SSL。
- `PORT=3001`：后端服务运行在 3001 端口。

## 6. 启动后端

```bash
npm run server
```

启动后看到：

```text
翱翔之翼后端服务已启动：http://127.0.0.1:3001
```

说明后端服务已经跑起来。

## 7. 验证后端和数据库

浏览器访问：

```text
http://121.40.156.210:3001/api/health
```

已验证成功返回：

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

这说明：

- 公网可以访问服务器后端。
- 后端服务已经启动。
- 后端已经连接到 PostgreSQL，而不是 SQLite。
- 阿里云安全组的 `3001` 端口已经放行成功。

## 8. 下一阶段

后续还需要继续配置：

- 用 PM2 管理后端进程，让后端关闭 SSH 后也能继续运行。
- 用 Nginx 发布前端页面。
- 用 Nginx 把 `/api` 请求转发到 `127.0.0.1:3001`。
- 开放并使用 `80` 端口访问网站。
- 后续绑定域名后配置 HTTPS。

## 9. 前端公网访问验证

已验证浏览器可以打开：

```text
http://121.40.156.210
```

页面成功显示“阜阳师范大学中科协‘翱翔之翼’大学生志愿者服务项目”官网首页。

这说明：

- 前端文件已经构建成功。
- Nginx 已经能把 `dist` 中的静态页面发布到公网。
- 阿里云安全组的 `80` 端口已经可以访问。
- 当前已经完成第一轮“前端页面 + 后端接口 + PostgreSQL 数据库”的上线闭环。

接下来建议继续检查：

```text
http://121.40.156.210/api/health
```

如果也能返回 PostgreSQL 状态，说明 Nginx 的 `/api` 反向代理也已经配置成功。

## 10. 前端接口地址修正

为了让公网网页正确调用后端接口，前端默认接口地址已经从本地开发地址：

```text
http://127.0.0.1:3001/api
```

调整为同域地址：

```text
/api
```

这样访问 `http://121.40.156.210` 时，网页里的接口请求会走：

```text
http://121.40.156.210/api/...
```

再由 Nginx 转发到后端：

```text
http://127.0.0.1:3001/api/...
```

因此下一次重新构建前端并发布 `dist` 后，需要重点验证：

```text
http://121.40.156.210/api/health
```
