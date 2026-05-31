import { useMemo, useState } from 'react'
import './App.css'

const navItems = [
  ['resultsNews', '成果与新闻'],
  ['overview', '翱翔之翼'],
  ['redSpirit', '红色学习'],
  ['volunteers', '志愿者管理'],
  ['activities', '活动展示'],
  ['studentWorks', '小学生成果'],
  ['competitions', '学科竞赛'],
  ['signup', '活动报名'],
  ['courses', '少儿编程'],
  ['equipment', '器材教具'],
  ['platformRoadmap', '平台建设'],
  ['recruit', '加入我们'],
]

const stats = [
  ['2019年', '团队起步'],
  ['2.4万+', '累计服务人次'],
  ['231场', '志愿服务活动'],
  ['300+', '线上课程视频'],
  ['200+', '骨干志愿者'],
  ['41项', '学生省级以上奖项'],
]

const activities = [
  {
    title: '前于居体彩“微光学堂”暑期公益班',
    tag: '少儿编程',
    date: '2025 暑期',
    image: '/media/sxx-01.jpeg',
    desc: '围绕图形化编程、无人机体验、机器人互动开展科技启蒙课程。',
  },
  {
    title: '王湾小学机器人与无人机科普课堂',
    tag: '机器人',
    date: '常态化周末',
    image: '/media/sxx-02.jpeg',
    desc: '大学生志愿者手把手指导乡村儿童完成机器人搭建与无人机操作。',
  },
  {
    title: '乡村青少年编程竞赛辅导',
    tag: '竞赛辅导',
    date: '赛前集训',
    image: '/media/sxx-03.jpeg',
    desc: '通过一对一答疑、项目打磨和模拟演练，帮助学生走向科技竞赛。',
  },
]

const courses = [
  ['编程世界初探索', '认识编程能解决生活中的真实问题，建立兴趣。'],
  ['认识图形化积木', '学习事件、运动、循环、判断等基础逻辑。'],
  ['机器人互动体验', '通过机器人动作与传感器理解程序控制。'],
  ['无人机科普实践', '了解无人机结构、安全规则和基础操控。'],
  ['AI启蒙课堂', '认识人工智能在医疗、交通、乡村生活中的应用。'],
  ['项目展示与交流', '完成小作品并进行展示、复盘和表达。'],
]

const equipment = [
  ['机器人套件', '用于动作控制、传感器实验、机器人赛事训练。', '可借用'],
  ['无人机教具', '用于飞行原理、操控体验和安全科普。', '预约中'],
  ['编程笔记本', '用于图形化编程、Python 入门和课程演示。', '可借用'],
  ['传感器模块', '用于光照、距离、声音等项目制学习。', '维护中'],
]

const redSpiritModules = [
  ['科学家精神', '学习胸怀祖国、服务人民、勇攀高峰、敢为人先的科学家精神，把科技志愿服务和专业成长结合起来。'],
  ['党团理论学习', '沉淀主题团日、党史学习、青年大学习、科协系统党建学习等内容，形成可归档的学习记录。'],
  ['乡村振兴实践', '围绕科技教育助力乡村振兴，记录团队下乡支教、科普服务、课程帮扶和长期陪伴。'],
  ['志愿服务精神', '学习奉献、友爱、互助、进步的志愿服务精神，展示优秀志愿者故事和服务心得。'],
  ['红色实践地图', '后续可按学校、社区、乡村实践点建立地图，展示服务足迹、合作单位和活动成果。'],
  ['学习成果档案', '沉淀学习笔记、心得体会、宣讲材料、活动照片和优秀案例，供成员持续学习。'],
]

const platformModules = [
  ['内容展示', '首页概览、项目介绍、团队介绍、项目历程、活动展示、成果展示、新闻动态、合作单位。', '先完善前台页面'],
  ['搜索筛选', '全站关键词搜索、栏目搜索、年份、标签、活动类型、成果类型筛选。', '需要数据结构'],
  ['成果沉淀', '活动成果、数据成果、图片墙、视频、学生作品、志愿者故事、证书、媒体报道归档。', '重点建设'],
  ['资料下载', '项目 PDF、活动总结、申报材料、媒体资料包、新闻稿模板、图片素材、Logo 下载。', '文件库功能'],
  ['新闻发布', '项目新闻、活动报道、媒体报道、通知公告、微信公众号链接收录。', '后台发布'],
  ['活动管理', '活动列表、详情页、报名入口、回顾、照片上传、总结上传、成果关联。', '连接报名系统'],
  ['合作联系', '合作申请、志愿者报名、媒体联系、学校/社区合作、联系方式展示。', '表单中心'],
  ['后台维护', '文章编辑、素材上传、活动管理、成果数据、团队成员、合作单位、首页内容管理。', '管理后台'],
  ['数据统计', '服务人数、活动场次、志愿者人数、志愿时长、覆盖学校社区、获奖报道数量。', '数据看板'],
  ['SEO传播', '页面标题关键词简介、搜索引擎收录、分享封面、网站地图、友好链接。', '上线阶段'],
  ['权限管理', '管理员、编辑、审核、只读账号、内容审核流程、操作记录留痕。', '正式运营必备'],
  ['安全稳定', '防垃圾提交、上传限制、数据备份、HTTPS、后台登录保护、访问统计。', '上线底座'],
  ['移动端适配', '手机访问、图片适配、移动菜单、手机表单、资料下载入口。', '持续检查'],
  ['可持续维护', '分类、标签、统一命名、年度归档、活动新闻成果互相关联、多人协作。', '长期规范'],
]

const roadmapSteps = [
  ['第一阶段', '前台展示原型', '先把项目概览、活动、成果、新闻、课程、器材、加入我们等页面做完整，让网站有清晰门面。'],
  ['第二阶段', '数据与搜索', '整理活动、新闻、成果、资料的统一数据格式，加入关键词搜索、年份筛选和标签筛选。'],
  ['第三阶段', '报名与证书', '把活动报名、志愿者信息、服务时长、证书生成从演示功能升级为可保存、可审核、可导出的流程。'],
  ['第四阶段', '后台与权限', '建设后台管理、内容发布审核、文件上传、账号权限、操作记录和数据备份。'],
  ['第五阶段', '上线与传播', '配置域名、HTTPS、SEO、网站地图、分享封面、访问统计，并形成持续更新机制。'],
]

const defaultForm = {
  name: '',
  college: '',
  phone: '',
  activity: '前于居体彩“微光学堂”暑期公益班',
  role: '教学志愿者',
}

const defaultAccountForm = {
  name: '',
  phone: '',
  code: '',
}

function App() {
  const [form, setForm] = useState(defaultForm)
  const [registrations, setRegistrations] = useState(() => {
    const stored = localStorage.getItem('aoxiang_registrations')
    return stored ? JSON.parse(stored) : []
  })
  const [certificate, setCertificate] = useState(null)
  const [accountForm, setAccountForm] = useState(defaultAccountForm)
  const [loginMethod, setLoginMethod] = useState('手机号')
  const [accountProfile, setAccountProfile] = useState(() => {
    const stored = localStorage.getItem('aoxiang_account')
    return stored ? JSON.parse(stored) : null
  })

  const totalHours = useMemo(() => registrations.length * 4, [registrations])

  function updateForm(event) {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
  }

  function submitRegistration(event) {
    event.preventDefault()
    if (!form.name.trim() || !form.phone.trim()) return

    const nextRegistration = {
      id: `AX-${Date.now()}`,
      ...form,
      status: '待审核',
      hours: 4,
      createdAt: new Date().toLocaleDateString('zh-CN'),
    }
    const next = [nextRegistration, ...registrations]
    setRegistrations(next)
    localStorage.setItem('aoxiang_registrations', JSON.stringify(next))
    setForm(defaultForm)
  }

  function clearRegistrations() {
    setRegistrations([])
    localStorage.removeItem('aoxiang_registrations')
    setCertificate(null)
  }

  function generateCertificate(item) {
    setCertificate({
      ...item,
      certNo: `FNU-AX-${String(item.id).slice(-6)}`,
      issuedAt: new Date().toLocaleDateString('zh-CN'),
    })
  }

  function updateAccountForm(event) {
    const { name, value } = event.target
    setAccountForm((current) => ({ ...current, [name]: value }))
  }

  function submitAccount(event) {
    event.preventDefault()
    if (!accountForm.name.trim() || !accountForm.phone.trim()) return

    const nextProfile = {
      ...accountForm,
      method: loginMethod,
      role: '志愿者',
      joinedAt: new Date().toLocaleDateString('zh-CN'),
    }
    setAccountProfile(nextProfile)
    localStorage.setItem('aoxiang_account', JSON.stringify(nextProfile))
    setAccountForm(defaultAccountForm)
  }

  function logoutAccount() {
    setAccountProfile(null)
    localStorage.removeItem('aoxiang_account')
  }

  return (
    <div className="site-shell">
      <header className="topbar">
        <a className="brand" href="#home" aria-label="返回首页">
          <span className="logo-frame">
            <img src="/media/cast-logo.png" alt="中国科学技术协会标识" />
          </span>
          <span>
            <strong>翱翔之翼</strong>
            <small>大学生志愿服务队</small>
          </span>
          <span className="brand-title">
            <small>阜阳师范大学中科协</small>
            <strong>“翱翔之翼”大学生志愿者服务项目</strong>
          </span>
        </a>
        <nav className="nav-list" aria-label="主导航">
          {navItems.map(([id, label]) => (
            <a href={`#${id}`} key={id}>
              {label}
            </a>
          ))}
        </nav>
        <a className="account-entry" href="#account" aria-label="打开个人账户登录注册页面">
          登录/注册
        </a>
      </header>

      <main id="home">
        <section className="hero-section">
          <div className="hero-copy">
            <p className="project-title">阜阳师范大学中科协“翱翔之翼”大学生志愿者服务项目</p>
            <p className="eyebrow">阜阳师范大学 · 中国科协“翱翔之翼”</p>
            <h1>科创为墨，童梦为纸</h1>
            <p className="hero-lead">
              面向乡村青少年开展编程、机器人、无人机与人工智能科普志愿服务，构建“普及兴趣、技能进阶、竞赛突破”的成长闭环。
            </p>
            <div className="hero-actions">
              <a className="primary-btn" href="#signup">
                报名活动
              </a>
              <a className="secondary-btn" href="#overview">
                了解团队
              </a>
            </div>
          </div>
          <div className="hero-photo">
            <img src="/media/sxx-04.jpeg" alt="志愿者指导小学生体验无人机" />
          </div>
        </section>

        <section className="results-news-section" id="resultsNews">
          <div className="section-heading">
            <p className="eyebrow">第二屏重点</p>
            <h2>活动成果展示与新闻报道</h2>
            <p>
              官网第二页优先呈现项目成果、典型活动和媒体报道，让搜索进入网站的人先看到真实服务场景、项目影响力和可持续更新的新闻入口。
            </p>
          </div>
          <div className="results-news-grid">
            <article className="result-feature">
              <img src="/media/sxx-10.jpeg" alt="翱翔之翼志愿服务队活动合影" />
              <div>
                <span>成果展示</span>
                <h3>乡村青少年“小小科学家”培育计划</h3>
                <p>展示少儿编程、无人机体验、机器人互动、AI 科普课堂等阶段性成果，后续可按年度、学校、课程主题持续更新。</p>
              </div>
            </article>
            <article>
              <span>新闻报道</span>
              <h3>“微光学堂”暑期公益班开班</h3>
              <p>记录活动时间、地点、主办单位、服务对象和现场亮点，未来可链接学院官网、公众号推文或校级新闻报道。</p>
            </article>
            <article>
              <span>社会反馈</span>
              <h3>校地协同与锦旗感谢</h3>
              <p>沉淀学校、社区、学生和家长反馈，形成项目公信力素材，也方便申报志愿服务项目和学科竞赛成果。</p>
            </article>
          </div>
        </section>

        <section className="stats-band" aria-label="项目核心数据">
          {stats.map(([value, label]) => (
            <div key={label}>
              <strong>{value}</strong>
              <span>{label}</span>
            </div>
          ))}
        </section>

        <section className="content-section" id="overview">
          <div className="section-heading">
            <p className="eyebrow">团队介绍</p>
            <h2>翱翔之翼信息介绍栏</h2>
            <p>
              团队依托阜阳师范大学计算机与信息工程学院，长期深耕乡村科创教育，服务内容覆盖课程、教具、师资、赛事和公益陪伴。
            </p>
          </div>
          <div className="feature-grid">
            <article>
              <h3>三级培育</h3>
              <p>从兴趣启蒙到技能进阶，再到竞赛突破，让孩子的每次学习都有清晰出口。</p>
            </article>
            <article>
              <h3>校地协同</h3>
              <p>高校专业资源与乡村学校真实需求对接，形成稳定、可复制的志愿服务机制。</p>
            </article>
            <article>
              <h3>长期运营</h3>
              <p>官网后续将接入数据库、后台管理、权限系统、证书核验和课程资源库。</p>
            </article>
          </div>
        </section>

        <section className="content-section red-spirit-section" id="redSpirit">
          <div className="section-heading">
            <p className="eyebrow">思想引领</p>
            <h2>红色精神学习模块</h2>
            <p>
              参考中国科协官网中“党建”“科协动态”“通知公告”等栏目组织方式，本站后续可以把红色学习、科学家精神、主题团日、乡村振兴实践和志愿服务心得统一归档，让项目既有科技感，也有清晰的价值引领。
            </p>
          </div>
          <div className="spirit-grid">
            {redSpiritModules.map(([title, desc], index) => (
              <article key={title}>
                <span>{String(index + 1).padStart(2, '0')}</span>
                <h3>{title}</h3>
                <p>{desc}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="content-section" id="volunteers">
          <div className="section-heading">
            <p className="eyebrow">管理中心</p>
            <h2>志愿者信息管理栏</h2>
          </div>
          <div className="dashboard-grid">
            <div className="dashboard-card">
              <span>已登记报名</span>
              <strong>{registrations.length}</strong>
            </div>
            <div className="dashboard-card">
              <span>模拟服务时长</span>
              <strong>{totalHours}</strong>
            </div>
            <div className="dashboard-card">
              <span>审核状态</span>
              <strong>待接后台</strong>
            </div>
          </div>
          <button className="text-btn clear-btn" type="button" onClick={clearRegistrations}>
            清空演示数据
          </button>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>姓名</th>
                  <th>学院/专业</th>
                  <th>报名活动</th>
                  <th>岗位</th>
                  <th>状态</th>
                  <th>证书</th>
                </tr>
              </thead>
              <tbody>
                {registrations.length === 0 ? (
                  <tr>
                    <td colSpan="6">暂无报名记录，先在“活动报名栏”提交一条试试。</td>
                  </tr>
                ) : (
                  registrations.map((item) => (
                    <tr key={item.id}>
                      <td>{item.name}</td>
                      <td>{item.college || '未填写'}</td>
                      <td>{item.activity}</td>
                      <td>{item.role}</td>
                      <td>{item.status}</td>
                      <td>
                        <button className="text-btn" onClick={() => generateCertificate(item)}>
                          生成证书
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="content-section" id="activities">
          <div className="section-heading">
            <p className="eyebrow">活动展示</p>
            <h2>活动展示栏</h2>
          </div>
          <div className="activity-grid">
            {activities.map((activity) => (
              <article className="activity-card" key={activity.title}>
                <img src={activity.image} alt={activity.title} />
                <div>
                  <span>{activity.tag}</span>
                  <h3>{activity.title}</h3>
                  <p>{activity.desc}</p>
                  <small>{activity.date}</small>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="content-section" id="studentWorks">
          <div className="section-heading">
            <p className="eyebrow">成长记录</p>
            <h2>小学生成果展示栏</h2>
          </div>
          <div className="story-grid">
            <article>
              <h3>编程作品</h3>
              <p>展示图形化编程小游戏、交互动画、校园智能照明等作品截图与说明。</p>
            </article>
            <article>
              <h3>科技竞赛</h3>
              <p>展示学生在机器人、青少年科技素养、I-code 等赛事中的获奖成果。</p>
            </article>
            <article>
              <h3>成长故事</h3>
              <p>以脱敏方式记录留守儿童、特殊儿童通过科技学习建立自信的故事。</p>
            </article>
          </div>
        </section>

        <section className="content-section" id="competitions">
          <div className="section-heading">
            <p className="eyebrow">大学生发展</p>
            <h2>大学生学科竞赛栏</h2>
          </div>
          <div className="timeline">
            <div>
              <strong>中国机器人及人工智能大赛</strong>
              <span>志愿者技术能力展示与反哺课堂教学。</span>
            </div>
            <div>
              <strong>挑战杯 / 创新创业竞赛</strong>
              <span>沉淀项目模式、商业计划、公益成果和社会价值。</span>
            </div>
            <div>
              <strong>软著、专利与课程研发</strong>
              <span>把竞赛经验转化为乡村孩子能理解、能实践的课程。</span>
            </div>
          </div>
        </section>

        <section className="signup-section" id="signup">
          <div>
            <p className="eyebrow">报名入口</p>
            <h2>活动报名栏</h2>
            <p>现在是前端演示版：信息会暂存在你浏览器的本地存储。以后接数据库后，报名会真正进入后台。</p>
          </div>
          <form className="signup-form" onSubmit={submitRegistration}>
            <label>
              姓名
              <input name="name" value={form.name} onChange={updateForm} placeholder="请输入姓名" />
            </label>
            <label>
              学院/专业
              <input name="college" value={form.college} onChange={updateForm} placeholder="例如 计算机科学与技术" />
            </label>
            <label>
              联系方式
              <input name="phone" value={form.phone} onChange={updateForm} placeholder="手机号或邮箱" />
            </label>
            <label>
              报名活动
              <select name="activity" value={form.activity} onChange={updateForm}>
                {activities.map((activity) => (
                  <option key={activity.title}>{activity.title}</option>
                ))}
              </select>
            </label>
            <label>
              志愿岗位
              <select name="role" value={form.role} onChange={updateForm}>
                <option>教学志愿者</option>
                <option>课程研发志愿者</option>
                <option>新媒体运营志愿者</option>
                <option>器材管理志愿者</option>
                <option>竞赛辅导志愿者</option>
              </select>
            </label>
            <button className="primary-btn" type="submit">
              提交报名
            </button>
          </form>
        </section>

        <section className="split-section account-section" id="account">
          <div>
            <p className="eyebrow">账户体系</p>
            <h2>个人账户注册登录</h2>
            <p>
              这一版先做前端学习原型：手机号可以模拟注册登录，微信和 QQ 先作为入口展示。正式上线时，手机号验证码、微信登录、QQ 登录都需要后端接口和第三方平台授权，不能只靠前端完成。
            </p>
            <div className="login-methods" aria-label="登录方式">
              {['手机号', '微信', 'QQ'].map((method) => (
                <button
                  className={loginMethod === method ? 'active' : ''}
                  key={method}
                  type="button"
                  onClick={() => setLoginMethod(method)}
                >
                  {method}
                </button>
              ))}
            </div>
          </div>
          <div className="account-panel">
            {accountProfile ? (
              <div className="profile-card">
                <span>已登录账户</span>
                <h3>{accountProfile.name}</h3>
                <p>手机号：{accountProfile.phone}</p>
                <p>登录方式：{accountProfile.method}</p>
                <p>身份：{accountProfile.role}</p>
                <p>加入日期：{accountProfile.joinedAt}</p>
                <button className="secondary-btn" type="button" onClick={logoutAccount}>
                  退出登录
                </button>
              </div>
            ) : (
              <form className="account-form" onSubmit={submitAccount}>
                <label>
                  姓名
                  <input name="name" value={accountForm.name} onChange={updateAccountForm} placeholder="请输入姓名" />
                </label>
                <label>
                  手机号
                  <input name="phone" value={accountForm.phone} onChange={updateAccountForm} placeholder="请输入手机号" />
                </label>
                <label>
                  验证码
                  <input name="code" value={accountForm.code} onChange={updateAccountForm} placeholder="学习阶段可填 1234" />
                </label>
                <button className="primary-btn" type="submit">
                  使用{loginMethod}登录
                </button>
                {loginMethod !== '手机号' && (
                  <p className="auth-note">当前是{loginMethod}登录入口原型，正式上线要接入{loginMethod}开放平台授权。</p>
                )}
              </form>
            )}
          </div>
        </section>

        <section className="content-section" id="courses">
          <div className="section-heading">
            <p className="eyebrow">课程资源</p>
            <h2>少儿编程学习栏</h2>
          </div>
          <div className="course-grid">
            {courses.map(([title, desc], index) => (
              <article key={title}>
                <span>{String(index + 1).padStart(2, '0')}</span>
                <h3>{title}</h3>
                <p>{desc}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="content-section" id="equipment">
          <div className="section-heading">
            <p className="eyebrow">物资保障</p>
            <h2>器材教具栏</h2>
          </div>
          <div className="equipment-list">
            {equipment.map(([name, desc, status]) => (
              <article key={name}>
                <div>
                  <h3>{name}</h3>
                  <p>{desc}</p>
                </div>
                <span>{status}</span>
              </article>
            ))}
          </div>
        </section>

        <section className="content-section roadmap-section" id="platformRoadmap">
          <div className="section-heading">
            <p className="eyebrow">可持续扩展</p>
            <h2>官网平台建设路线</h2>
            <p>
              参考中国科协官网的信息组织方式，官网不只做展示页，而是逐步建设成“新闻发布、成果沉淀、活动管理、资料下载、合作联系、后台维护、数据统计、SEO传播、安全权限”一体化平台。这里先把功能地图放出来，后续每次开发都按模块推进。
            </p>
          </div>
          <div className="roadmap-layout">
            <div className="roadmap-steps">
              {roadmapSteps.map(([phase, title, desc]) => (
                <article key={phase}>
                  <span>{phase}</span>
                  <h3>{title}</h3>
                  <p>{desc}</p>
                </article>
              ))}
            </div>
            <div className="module-grid">
              {platformModules.map(([title, desc, status], index) => (
                <article key={title}>
                  <span>{String(index + 1).padStart(2, '0')}</span>
                  <h3>{title}</h3>
                  <p>{desc}</p>
                  <strong>{status}</strong>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="split-section" id="recruit">
          <div>
            <p className="eyebrow">加入我们</p>
            <h2>加入“翱翔之翼”</h2>
            <p>
              这里是官网最后一页的组织加入入口。后续可以继续升级为正式招新系统：在线填写申请、选择部门、查看面试通知、生成志愿者档案，并与志愿者信息管理栏打通。
            </p>
          </div>
          <div className="department-grid">
            <article>
              <span>01</span>
              <h3>科普教学部</h3>
              <p>负责少儿编程、机器人、无人机、AI 科普等课堂教学与现场辅导。</p>
            </article>
            <article>
              <span>02</span>
              <h3>课程研发部</h3>
              <p>负责课程脚本、课件、教案、学习单和小学生成果展示标准建设。</p>
            </article>
            <article>
              <span>03</span>
              <h3>活动运营部</h3>
              <p>负责活动报名、志愿者排班、现场签到、服务时长和证书材料整理。</p>
            </article>
            <article>
              <span>04</span>
              <h3>器材教具部</h3>
              <p>负责机器人、无人机、编程电脑、传感器模块等器材借用与维护。</p>
            </article>
            <article>
              <span>05</span>
              <h3>宣传影像部</h3>
              <p>负责摄影摄像、新闻稿、公众号素材、官网活动展示和媒体报道整理。</p>
            </article>
            <article>
              <span>06</span>
              <h3>竞赛与项目部</h3>
              <p>负责大学生学科竞赛、项目申报、成果汇编和学生竞赛辅导。</p>
            </article>
          </div>
        </section>
      </main>

      <footer className="footer">
        <strong>阜阳师范大学中科协“翱翔之翼”大学生志愿服务队</strong>
        <span>首版为前端原型，后续可继续接入后台、数据库、登录权限、证书核验与内容管理系统。</span>
      </footer>

      {certificate && (
        <div className="modal-backdrop" role="dialog" aria-modal="true">
          <div className="certificate">
            <button className="close-btn" onClick={() => setCertificate(null)}>
              关闭
            </button>
            <p>志愿服务证书</p>
            <h2>{certificate.name}</h2>
            <span>
              参加“{certificate.activity}”，担任{certificate.role}，完成志愿服务 {certificate.hours} 小时。
            </span>
            <dl>
              <div>
                <dt>证书编号</dt>
                <dd>{certificate.certNo}</dd>
              </div>
              <div>
                <dt>发证单位</dt>
                <dd>阜阳师范大学中科协“翱翔之翼”大学生志愿服务队</dd>
              </div>
              <div>
                <dt>生成日期</dt>
                <dd>{certificate.issuedAt}</dd>
              </div>
            </dl>
          </div>
        </div>
      )}
    </div>
  )
}

export default App
