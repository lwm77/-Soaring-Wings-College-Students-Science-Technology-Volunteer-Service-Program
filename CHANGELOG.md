# 版本记录

## v0.3.2 - 2026-06-03

### 新增

- 新增“操作审阅 / 审计日志 / 管理后台”后端机制。
- 新增 `audit_logs` 数据表，用来记录报名、清空报名、审阅操作等关键行为。
- 新增管理后台接口：
  - `GET /api/admin/audit-logs`：查看和筛选操作日志。
  - `GET /api/admin/audit-stats`：查看待审阅、已通过、需复核、已驳回等统计。
  - `PATCH /api/admin/audit-logs/:id/review`：管理员审阅某条操作记录。
- 新增 `ADMIN_API_TOKEN` 环境变量，用来保护管理后台接口。

### 调整

- 清空报名数据接口 `DELETE /api/registrations` 改为需要管理员令牌。
- 志愿者报名成功后，后端会同时生成一条 `registration.create` 审计日志。
- 前端接口工具 `src/api.js` 新增审计日志相关请求方法，为后续管理后台页面做准备。
- 修复并重写部分中文说明文档，避免乱码影响学习和部署。

### 验证

- `npm run lint`
- `npm run build`
- 本地接口验证：
  - `GET /api/health`
  - `POST /api/registrations`
  - `GET /api/admin/audit-stats`
  - `GET /api/admin/audit-logs`
  - `PATCH /api/admin/audit-logs/:id/review`

## v0.3.1 - 2026-06-03

### 调整

- 前端默认接口地址从 `http://127.0.0.1:3001/api` 调整为 `/api`，适配公网部署和域名访问。
- 保留 `VITE_API_BASE_URL` 环境变量，方便特殊部署场景覆盖接口地址。
- 修复前端接口请求失败时的中文提示乱码。
- 整理 `.env.example`，恢复正常中文说明。

### 新增

- 新增 `DEPLOY_UBUNTU.md`，记录阿里云 Ubuntu 服务器部署步骤。
- 更新 `LEARNING_LOG.md`，补充 SSH 登录、Node.js、PostgreSQL、Nginx、前端公网访问和同域 API 的学习说明。

### 验证

- `npm run lint`
- `npm run build`
- 已验证 `http://121.40.156.210/api/health` 返回 PostgreSQL 状态。
- 已验证 `http://121.40.156.210` 可以打开官网首页。

## v0.3.0 - 2026-06-02

### 新增

- 新增 PostgreSQL 数据库支持，配置 `DATABASE_URL` 后后端会自动切换到 PostgreSQL。
- 新增 `.env.example`，说明本地端口、数据库类型、PostgreSQL 连接串和 SSL 配置。
- 新增数据库初始化流程 `initializeDatabase()`，后端启动时自动创建数据表并写入活动种子数据。

### 调整

- 将数据库访问层改为可切换结构：默认 SQLite，正式部署可使用 PostgreSQL。
- 将后端接口改为异步处理，适配 PostgreSQL 网络数据库连接。
- 前端数据库状态不再写死为 SQLite，而是根据后端返回的数据库类型显示。

### 验证

- `npm run lint`
- `npm run build`
- SQLite 模式下访问 `GET http://127.0.0.1:3001/api/health`
- SQLite 模式下测试 `POST /api/registrations`

## v0.2.0 - 2026-06-02

### 新增

- 新增 Express 后端服务，接口入口为 `server/index.js`。
- 新增 SQLite 本地数据库，数据初始化与读写逻辑在 `server/database.js`。
- 新增活动报名接口：`GET /api/registrations`、`POST /api/registrations`、`DELETE /api/registrations`。
- 新增健康检查接口：`GET /api/health`。
- 新增活动种子数据接口：`GET /api/activities`。
- 新增前端接口工具文件 `src/api.js`。

### 调整

- 前端报名栏优先写入后端数据库；如果后端未启动，会自动回到浏览器本地演示模式。
- 志愿者管理栏的“审核状态”改为显示当前后端连接状态。
- `.gitignore` 新增 `data` 和 `.env`，避免上传本地数据库和环境变量。

## v0.1.1 - 2026-06-02

### 调整

- 参考中国科协官网首页的信息门户思路，把组织动态、成果新闻、项目介绍和合作宣传放在网站前半段。
- 首页新增新闻动态面板和项目亮点入口。
- 平台建设页将多个后续功能合并为“内容宣传、成果资料、报名服务、后台管理、课程资源”五类入口。
- 增加平台功能详情页。

## v0.1.0 - 2026-06-01

### 新增

- 建立“阜阳师范大学中科协‘翱翔之翼’大学生志愿者服务项目”官网原型。
- 增加项目介绍、团队介绍、红色精神学习、志愿者管理、活动展示、小学生成果、学科竞赛、活动报名、少儿编程、器材教具、平台建设、加入我们等栏目。
- 增加活动报名表单和志愿者证书生成按钮。
- 增加个人账户注册登录原型。
- 增加 `LEARNING_LOG.md` 学习记录文档。
