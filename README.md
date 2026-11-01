# 艾尔德兰 · Aeldran — 界面原型（首页 / 建角 / 读取存档 / 系统设置）

一款本地运行、网页端的中世纪 CRPG 的**界面层**。当前仓库只包含界面：
Vite + Vue 3，纯前端，无任何后端依赖（除了本地 Vite 提供的 API 转发中间件）。

- 背景、徽记、标题图全部使用 `Picture/` 下的原始美术资源
- 整体为中世纪羊皮纸风格：暖黄纸面、金线描边、颗粒质感、烛光式辉光
- 首页四角布局：左上徽记 / 右上创意工坊 / 中央标题 / 左下菜单 / 右下说明
- 「开始游戏」进入全屏八步建角流程，「读取存档」是带分页的存档簿册
- 「系统设置」是完整的三标签页配置界面（API / 文生图 / 预设），带本地持久化与真实联网请求

完整的目录与逐文件说明见 **[项目结构.md](项目结构.md)**。

## 一键启动（Windows）

双击根目录的 **`启动游戏.bat`**：

1. 检查 Node / npm，缺失时提示去 nodejs.org 安装并暂停；
2. `node_modules/` 不存在则自动 `npm install`；
3. 5173 端口已在监听就跳过启动，否则最小化启动 `npm run dev`；
4. 轮询端口最多 60 秒，就绪后自动打开 `http://127.0.0.1:5173/`。

> 关闭标题为「Aeldran Dev Server」的最小化窗口即停止游戏。

## 手动运行

```bash
npm install
npm run dev        # http://127.0.0.1:5173/
npm run build      # 构建到 dist/（会把 Picture/ 与 预设/ 一并复制进去）
npm run preview    # 预览构建产物
```

> 开发时 `Picture/`、`预设/` 由 Vite 直接以站点根目录提供；构建时由 `vite.config.js`
> 里的 `aeldran-copy-assets` 插件在 `closeBundle` 阶段整体复制进 `dist/`，
> 因此 `Picture/...`、`预设/...` 的相对路径在开发与打包后保持一致。

## 首页构成

| 位置 | 内容 | 资源 / 实现 |
| --- | --- | --- |
| 背景 | 黄昏城堡全景，缓慢推近 + 夕照金光 + 暗角 + 颗粒 | `Picture/Background/front-page.png` |
| 左上 | 徽记 + 「艾尔德兰 / AELDRAN」 | `Picture/LOGO/LOGO.png` |
| 右上 | 「创意工坊」+ 书本线稿图标 | 内联 SVG |
| 中央 | 游戏标题 + 副题「以文字为墨　以抉择为刃」 | `Picture/LOGO/Title-Marker.alpha.png` |
| 左下 | 五个长方形菜单按钮（无存档时四个） | `MenuButton.vue` |
| 右下 | 离线说明 + 版本号 | — |

菜单顺序固定为：**继续上一个游戏**（存在存档时才出现）→ **开始游戏** → **读取存档** →
**世界书** → **系统设置**；罗马数字序号始终从 Ⅰ 开始自动顺延。

## 开始游戏：八步建角

点击「开始游戏」进入**全屏建角页**（`CreateView.vue`），保留左上徽记与「返回主菜单」，
顶部是三个角色存档位。第一步单独占满整屏，自第二步起左侧出现竖排步骤条，
与右侧功能区通过**同一根强调色**相连：非选中步骤为暗色，当前步骤用 `--step-accent` 点亮。

| 步骤 | 内容 | 数据来源 |
| --- | --- | --- |
| 一 · 选定难度 | 探索者 / 平衡 / 硬核，只展示一句体验描述，不列出引擎倍率（倍率仍写在 `src/data/difficulties.js`，由引擎读取） | `src/data/difficulties.js` |
| 二 · 基本资料 | 姓名、年龄、性别（9 种，取自规则书「身体与生理」）+ 外貌与身体五组字段（面部 / 头发 / 身材 / 肤色 / 生殖器官） | `GENDERS`、`APPEARANCE_GROUPS` |
| 三 · 选择种族 | 10 个种族卡片：属性调整、体型、特性；有亚种的种族提示「分为 N 个亚种」 | `RACES` |
| 四 · 选择亚种 | 仅精灵 / 半精灵 / 半兽人 / 恶魔 / 龙裔开启；展示属性调整与天赋 | `RACES[].subraces` |
| 五 · 选择职业 | 19 个职业：核心属性、护甲 / 武器 / 豁免熟练、生命骰、职业特性、战斗与非战斗定位 | `CLASSES` |
| 六 · 确定出身 | 16 个出身：专长、技能熟练、工具熟练、语言、初始金币 | `BACKGROUNDS` + `FEATS` |
| 七 · 选择熟练项 | 左栏技能（固定或择二）、右栏工具（固定 / 指定 / 择二后再选具体种类） | `BACKGROUNDS[].skills`、`tools.js` |
| 八 · 属性值 | 六维 = 12 + 种族（看亚种）+ 职业核心 + 2 点自由加点，实时算调整值 | `useCharacter.js` |

- 属性只展示力量 / 敏捷 / 体质 / 智力 / 感知 / 魅力；**性技**与**羞耻**由引擎内部计算，
  第八步底部「显示调试信息」可临时展开这两个值（魅魔亚种：性技 +70、羞耻 −80；风流客：性技 +20、羞耻 −15，均加在基础值 0 / 100 上）。
- 有亚种的种族，其属性加值**只看亚种**，不与种族叠加（种族行本身已含基础加值）。
- 右下角：`系统设置`（内嵌设置弹窗）+ 琥珀色 `开始冒险`；点后者写入自动存档并回到首页。
- 顶部三个角色槽：`保存角色`（弹出「命名该角色」）→ 命名后点击槽位可 `读取` 或红色 `删除`
  （弹出「确定删除该角色？」）。

## 读取存档

矩形羊皮纸弹窗（`LoadPanel.vue`），自上而下：

- **导入存档文件**：选择本界面「导出」生成的 JSON，落在第一个空手动位。
- **自动存档**：只有一格。创建世界、一次长休后写入，新的自动存档会覆盖旧的。
- **手动存档**：15 位，分 3 页、每页 5 位，分页器固定在弹窗页脚（左分页 + 右关闭）。
- 每个存档位显示：存档名称（单独一行、加大加粗）、角色名、等级、所在地点、
  游戏内时间（`第 N 天 · HH:MM`）；右侧四个按钮：`读取` / `改名` / `导出` / `删除`。
  空位显示「空存档位 N」并禁用按钮。
- `删除` 弹出「确定删除该存档？」（取消 / 红色确认删除）；`改名` 弹出输入框；`导出` 下载
  `名称-时间.json`，该文件可再被「导入存档文件」读回。

## 系统设置

点击「系统设置」弹出矩形羊皮纸界面（`min(1140px, 100%)` × `min(812px, 92vh)`）：

- **标题区**：左侧齿轮图标 + 「设置」，右上角叉号关闭；`Esc` 与点击遮罩同样关闭。
- **三个标签页**：`API 设置` / `文生图设置` / `预设设置`，切换只换主功能区，外壳不动。

**API 设置**（左右两栏）

- 左栏「API 预设」：当前预设下拉框（默认「未指定」）+ `+` 新建 + 垃圾箱删除（红色确认弹窗）；
  新建/选中后展开预设名称、端点（基础 URL，仅 OpenAI 兼容协议）、API KEY、模型名、
  「加载模型」按钮 + 模型下拉、「最大回复长度」（默认 60000）、「附加主体参数」（JSON）；
  底部「放弃修改」清空表单、「保存当前预设」写入并出现在下拉里。
- 右栏「功能分配」：叙事正文 / R18 场景 / 谈判对话 / 插图提示词生成，
  各自用一个下拉绑定已保存的预设，右侧一行说明该环节的用途。

**文生图设置**（单栏，分段切换）

- `NovelAI 生图`：端点、API KEY、模型、宽/高、步数、CFG、采样器、负面提示词、画风、测试提示词。
- `ComfyUI 生图`：API 地址（默认 `http://localhost:8188`）、工作流预设（新建 / 改名 / 删除）、
  工作流 JSON（粘贴后自动回填宽高、步数、CFG、采样器与负面提示词）、画风。
- 两种后端底部都有琥珀色的「生成图片」，会带上当前参数**真实请求**并显示返回的图片
  （可另存到本地）；失败时在按钮上方显示红棕色错误条。

**预设设置**（单栏，列表 ⇄ 详情）

- 首次打开会自动导入 `预设/Reborn2.4.2.json`（67 条提示词）。
- 列表一屏显示 7 条可滚动，每行是名称、提示词条数、圆形选中、导出、删除；
  右上角有「导入酒馆预设 / 导出全部」图标（悬浮显示说明）。
- 点击某条进入提示词页：每条提示词显示序号、名称、角色与删除键，
  点击展开可改角色（系统 / 用户 / 助手）与内容。

## 本地数据

| 键 | 内容 | 写入方 |
| --- | --- | --- |
| `aeldran.saves.v1` | `{ auto, manual: { 1..15 } }`，每个存档含 `name`、`character`、`world`、`playtime` 等 | `useSaves.js` |
| `aeldran.characters.v1` | 三个角色预设槽（建角页顶部的「保存角色」） | `useCharacters.js` |
| `aeldran.settings.v1` | API 预设、功能分配、文生图参数、酒馆预设与提示词 | `useSettings.js` |

存档 JSON 结构（导出文件与导出内容一致）：

```json
{
  "version": 1,
  "kind": "manual",
  "slot": 1,
  "name": "灰烬王庭 · 长夜",
  "updatedAt": 1761912345678,
  "playtime": 25920,
  "character": { "name": "灰烬旅人", "level": 6, "race": "人类", "className": "游侠", "difficulty": "冒险者" },
  "world": { "chapter": "第三章 · 灰烬王庭", "place": "灰烬王庭 · 长夜旅店", "day": 47, "hour": 6, "minute": 55 }
}
```

## 目录结构（速览）

```
启动游戏.bat             # 一键启动：检查环境 → 起 dev server → 开浏览器
项目结构.md              # 逐目录、逐文件的职责说明（详细版）
index.html
vite.config.js          # base './'、Picture/预设 复制插件、/__api/proxy 转发、文件监听容错
public/favicon.png      # 页签图标
src/
  main.js  App.vue
  styles/
    tokens.css          # 纸张 / 墨色 / 金色 / 火光色阶、字体栈、缓动、噪声
    base.css            # reset、滚动条、焦点样式、动效降级
    controls.css        # .parchment 纸面 + .btn / .input / .switch / .range / .segmented
    settings.css        # 设置弹窗的 .st-* 布局、下拉浮层、列表、确认弹窗
    create.css          # 建角页 .cv-* 与读取存档 .ld-*
  data/
    rules.generated.js  # 由规则书 xlsx 生成：属性 / 技能 / 种族 / 职业 / 专长 / 出身 / 性别 / 外貌
    difficulties.js     # 三档难度的引擎倍率
    tools.js            # 工具熟练的占位种类
  components/
    HomeView.vue        # 首页布局与舞台调度
    MenuButton.vue      # 羊皮纸菜单按钮（罗马数字铭牌、扫光、火光呼吸）
    GoldDivider.vue     # 菱形花饰分隔线
    ParchmentDialog.vue # 通用羊皮纸弹窗（Esc / 遮罩 / 关闭键 / wide / tall）
    panels/
      LoadPanel.vue           # 读取存档：导入、自动存档、手动存档分页
      CodexPanel.vue          # 世界书：人物 / 地域 / 记事
      SettingsDialog.vue      # 系统设置外壳：齿轮 + 设置 + 叉号 + 三标签页
      settings/
        ApiTab.vue            # API 预设 + 功能分配
        ImageTab.vue          # NovelAI / ComfyUI 文生图配置
        PresetTab.vue         # 酒馆预设列表与提示词详情
    create/
      CreateView.vue          # 全屏建角外壳：步骤调度、角色槽、底部导航
      StepRail.vue            # 左侧竖排步骤条
      steps/
        StepDifficulty.vue    # 一 · 难度
        StepProfile.vue       # 二 · 基本资料与外貌
        StepRace.vue          # 三 · 种族
        StepSubrace.vue       # 四 · 亚种
        StepClass.vue         # 五 · 职业
        StepOrigin.vue        # 六 · 出身
        StepProficiency.vue   # 七 · 熟练项
        StepAttributes.vue    # 八 · 属性值
    settings/
      Icon.vue              # 内联图标集
      SSelect.vue           # 下拉选择（Teleport 浮层、自动翻转）
      ConfirmModal.vue      # 红色「确认删除」弹窗
      InputModal.vue        # 单输入框弹窗（命名 / 改名）
  composables/
    useSaves.js         # 存档簿册（localStorage: aeldran.saves.v1）
    useCharacter.js     # 建角草稿与属性结算
    useCharacters.js    # 三个角色预设槽（localStorage: aeldran.characters.v1）
    useSession.js       # 首页「当前存档」视图（跟随最新自动存档）
    useSettings.js      # 设置状态（localStorage: aeldran.settings.v1）
  utils/
    format.js           # 属性缩写、加值、倍率文本
    comfy.js            # 解析 / 改写 ComfyUI API 工作流（提取与注入宽高、步数、正负提示词）
    http.js             # fetch 封装：跨域走本地代理、状态码中文提示、网络错误归一化
    imagegen.js         # NovelAI v4 与 ComfyUI 的真实出图流程（含 ZIP 解包与轮询）
  directives/
    tip.js              # 图标按钮的悬浮提示气泡（挂到 body、fixed 定位，不被滚动容器裁切）
Picture/                # 美术资源（原样保留）
预设/                    # SillyTavern 预设 JSON（示例：Reborn2.4.2.json）
规则书/                  # 艾尔德兰规则书 xlsx（建角数据的唯一来源）
tools/                  # 自检、规则生成与素材处理脚本
```

## 交互与评审参数

- 点击菜单项打开对应羊皮纸面板；`Esc`、点击遮罩、右上关闭键均可关闭，关闭带淡出。
- **开始游戏** 打开全屏建角页；顶部「返回主菜单」或 `Esc` 退出。
- 评审用参数：
  - `?preview=save` —— 伪造一份「第三章 · 灰烬王庭」存档与两份手动存档，直接看到五项菜单
  - `?panel=load|codex|settings|create` —— 直接打开某个界面
  - `?panel=create&step=8` —— 直接跳到第八步（1~8 均可用）
- 存档簿册与世界书条目中，`?preview=save` 的数据是演示数据；**模型列表与文生图是真实请求**。
- 图标按钮上的悬浮提示由 `src/directives/tip.js` 统一接管：读 `aria-label` 显示气泡，
  气泡挂在 `body` 上，因此不会被列表的滚动容器裁切。

## 真实联网请求

| 功能 | 请求 | 说明 |
| --- | --- | --- |
| 「加载模型」 | `GET {端点}/models` | 兼容 OpenAI 协议；支持 `{data:[{id}]}`、`{models:[{name}]}`、字符串数组等返回形态；没填端点会直接提示 |
| NovelAI「生成图片」 | `POST {端点}/ai/generate-image` | 走 v4 的 payload 结构；返回 JSON（base64）或 ZIP 都能解出图片，ZIP 用手写解析 + `DecompressionStream('deflate-raw')` |
| ComfyUI「生成图片」 | `POST {端点}/prompt` → 轮询 `GET /history/{id}` → `GET /view` | 先把当前填写的宽高、步数、CFG、采样器、正负提示词**注入**工作流图，再提交；最长等 300 秒 |

浏览器直接跨域请求第三方 API 会被 CORS 拦住，所以 `vite.config.js` 里注册了一个
`aeldran-api-proxy` 插件：前端以 `GET /__api/proxy?url=<编码后的目标地址>` 的形式转发，
服务端只放行 http/https，剥掉 `host`/`origin` 等头部，并回写状态码与 `content-type`。
`src/utils/http.js` 会优先走代理，探测不到代理（404/501 或没有 `x-aeldran-proxy` 响应头）时
自动退回同源直连，因此 `vite dev` 与 `vite preview` 都能用。

## 设计约定

- 字体：标题用衬线（Trajan Pro / Cinzel / Palatino / Songti），正文用 UI 衬线，
  旁注与提示用楷体（`--font-flavor`），以贴近“手抄本”的语感。
- 纸面：`.parchment` 由“左上冷光 + 右下焦边 + 纸纹噪声”三层叠加而成，
  内层 5px 细框与四角金色折线共同构成卷轴感。
- 步骤配色：八步各有一个强调色（赭金 → 陶土 → 苔绿 → 青灰 → 桐棕 → 藕紫 → 石板蓝 → 琥珀），
  步骤条、卡片选中态、圆形标记都取同一变量，切换步骤时整块功能区一起变色。
- 动效：入场为分批上浮（`--i` 控制错峰），按钮 hover 右移 9px 并扫过一道柔光，
  「继续上一个游戏」带 5.6s 的火光呼吸。`prefers-reduced-motion` 下全部停用。
- 适配：1920×1080 → 1024×640 均不裁切；窄屏隐藏副标题与徽记文字，按钮撑满宽度。

## 规则书数据管线

建角页的所有选项都来自 `规则书/艾尔德兰规则书.xlsx`，不手抄：

```bash
python tools/dump_rules.py                 # 把 10 张设计表导成 TSV，便于人工查阅
python tools/gen_rules.py                  # 生成 src/data/rules.generated.js
```

`gen_rules.py` 会做几处清洗：种族行的属性调整与特性和亚种对齐、技能名异体字归一
（`洞察→洞悉`、`体操→特技`）、以及把「背景与身份」里的技能/工具熟练拆成
`fixed` / `choose` / `pick` 三种模式供第七步渲染。

## 美术资产处理

`Picture/LOGO/Title-Marker.jpg` 本身没有透明通道，灰白棋盘格是“烤”进像素里的，
直接叠在背景上会露出格子。`tools/key_title_marker.py` 用以下方式生成透明版本
`Picture/LOGO/Title-Marker.alpha.png`（首页实际引用的是它）：

1. 按棋盘两色（237 与 195 的灰）计算到最近灰的距离与彩度，得到 `loose` / `strict` 两档掩膜；
2. 对 `strict` 做 7px 的开运算，滤掉金属高光细条、保留成片的棋盘方块；
3. 从四边在 `loose` 内做 8 邻域泛洪，得到外部背景；再与开运算结果取并集，
   吃掉被花纹包围的棋盘孤岛；
4. alpha 初值取二值结果，再用 9px 最小值滤波让轮廓外扩、吞掉 JPEG 白边，最后 1.6px 高斯柔化。

页签图标则用同一张徽记生成：`public/favicon.png`（128×128）。

## 接游戏逻辑时的接入点

- `src/composables/useSaves.js`：`writeAuto()` / `writeManual()` 换成真实存档落盘。
- `src/composables/useSession.js`：`beginJourney()` 现在只是写自动存档，接引擎后改为真正进游戏。
- `src/composables/useCharacter.js`：`snapshot()` 的输出即角色卡（含 `free` 加点与额外属性），
  直接交给引擎结算；六维最终值现在只在界面上展示，引擎里应再叠加临时加值。
- `src/composables/useSettings.js`：`saveProfile()` 里把「附加主体参数」合并进最终请求体。
- `src/components/HomeView.vue`：菜单事件目前是开面板 + 提示条，接路由后改成 `router.push()`。

## 自检工具（可选）

不需要浏览器、也不需要开发服务器：

```bash
node tools/lint-sfc.mjs     # 编译全部 .vue + 检查 import / class / 图标引用（25 个）
node tools/store-check.mjs  # 状态层自检：存档 / 角色槽 / 设置 / 预设（32 项）
node tools/ssr-check.mjs    # 用 @vue/server-renderer 渲染首页、设置、建角页，断言关键文案
```

需要浏览器（先 `npm run dev`，并以调试端口启动 Chrome）：

```bash
chrome --headless=new --remote-debugging-port=9223 --user-data-dir=tmp-inspect/chrome-profile about:blank
node tools/ui-check.mjs     # 18 项交互断言 + 过程截图（输出到 tmp-inspect/）
node tools/shots.mjs        # 1920×1080 ~ 1024×640 多分辨率截图
```

> 备注：本机的 npm / vite / 无头 Chrome 需要在**完整权限**下运行。
> 受限沙盒会拦截 npm 的缓存写入与 esbuild、Chrome 的管道子进程（EPERM）。
