# 云栖新手村 Demo — 项目代理约定

本文件是项目实现前必须优先读取的工作约定。后续代理开始工作时，先读取根目录 `AGENTS.md` 和本文件，再检查当前代码、计划和用户最新要求。用户的明确指令以及系统、开发者指令优先于本文。

## 目标与已确认要求

- 基于 Video2Game 的实时三维场景与物理交互路线，制作可在浏览器试玩的第一集新手村。
- 美术参考用户提供的九宫格图片：水墨武侠、纸色雾气、墨色山石、赭红天空、朱红山门、斗笠游侠。
- 必须包含可打斗的小怪，小怪无限刷新。无限指持续补充，总存活数量可以设上限以保证性能。
- 当前拟定流程：入村、守村人对话、击败五名山匪、敲钟完成第一集；完成后继续无尽战斗。
- 提供移动、挥剑、闪避、生命值、倒地重生、暂停和重开；适配触屏操作。
- 无用户指令不得擅自删除已有视频、参考素材或其他工作成果。

## 开工时必须告知使用什么 skill

每次开始一个新的工作阶段，先用简洁中文说明：准备做什么、使用哪些 skills、它们分别负责什么。不能只写“按最佳实践实现”，也不能声称使用了未读取或未执行的 skill。

### 本次已经读取并使用的 skills

| Skill | 在本项目中的用途 | 指令来源 |
| --- | --- | --- |
| `superpowers:using-superpowers` | 识别适用技能和工作流程 | `/Users/cn/.codex/plugins/cache/openai-curated-remote/superpowers/7.0.1/skills/using-superpowers/SKILL.md` |
| `superpowers:brainstorming` | 明确新手村范围，结合参考图和无限刷新要求形成设计 | `/Users/cn/.codex/plugins/cache/openai-curated-remote/superpowers/7.0.1/skills/brainstorming/SKILL.md` |
| `superpowers:writing-plans` | 将设计落为可执行的实现与验证计划 | `/Users/cn/.codex/plugins/cache/openai-curated-remote/superpowers/7.0.1/skills/writing-plans/SKILL.md` |
| `superpowers:executing-plans` | 在当前会话逐项实现与记录结果 | `/Users/cn/.codex/plugins/cache/openai-curated-remote/superpowers/7.0.1/skills/executing-plans/SKILL.md` |
| `superpowers:test-driven-development` | 先验证战斗状态、无限补怪、无敌帧和重置逻辑 | `/Users/cn/.codex/plugins/cache/openai-curated-remote/superpowers/7.0.1/skills/test-driven-development/SKILL.md` |
| `sites:sites` | 浏览器游戏静态站点的准备、打包与私有发布 | `/Users/cn/.codex/plugins/cache/openai-curated-remote/sites/1.1.3/skills/sites/SKILL.md` |

### 后续阶段与补充技能

- `superpowers:systematic-debugging`：出现错误、测试失败或异常行为时，先定位原因。
- `superpowers:verification-before-completion`：交付前运行检查并依据输出报告完成状态。
- `superpowers:requesting-code-review`：重大实现完成时按适用指令组织评审。
- `imagegen`：确需生成或编辑位图素材时使用；程序化三维建模和 CSS 视觉无需冒称使用它。

技能安装路径可能变化；若路径失效，从当前会话的可用技能目录定位，不要凭记忆编造指令。技能要求与高优先级指令冲突时遵守高优先级指令。未经用户或适用指令授权，不主动分派子代理。

## 技术基础与溯源

- 上游研究项目：<https://github.com/video2game/video2game>，MIT 许可。
- 上游浏览器端使用 Three.js、Cannon.js，并把渲染网格与物理碰撞体分开处理。
- 本 Demo 当前采用自托管 Three.js 0.140.0、Cannon.js 0.6.2 和浏览器原生 ES modules。
- 当前是新建 Demo，只改编 Video2Game 的 BoxCollider，未整合其完整训练管线。后续已复用长风 MIT 程序化角色、骨骼、IK 与动作模块，不包含其限制资源。不得声称已执行 NeRF 训练或实拍重建。
- 村庄拟采用原创程序化几何；用户尚未提供可训练视频对应的相机位姿或完整重建资产。
- 如复制或改编上游代码，保留相应 MIT 版权声明，并在资源说明中记录实际改编的文件。
- 参考 MP4 只是视频，不等同于 GLB/FBX 模型、动画或可直接使用的布料物理资源；不得虚称已经转换或导入。
- 默认新站点私有发布，保留 `.openai/hosting.json` 中现有项目身份，禁止重复创建站点或擅自扩大访问范围。
- 参考视频保存在 `reference/`，默认不纳入公开静态资源或发布包。

## 文件布局

- `agent.md`：本项目主要工作约定。
- `AGENTS.md`：代理自动发现入口，指向本文件。
- `docs/superpowers/specs/`：设计范围与技术决策。
- `docs/superpowers/plans/`：实现计划与检查项。
- `dist/index.html`、`dist/style.css`：界面与样式。
- `dist/combat.mjs`：可独立测试的战斗和刷新状态。
- `dist/vendor/`：本地浏览器依赖。
- `tests/combat.test.mjs`：战斗状态测试。
- `reference/`：用户提供链接对应的视频参考。
- `.openai/hosting.json`：Sites 项目身份与静态输出目录。

## 实现与验证要求

1. 先检查已有文件和最新用户要求，不覆盖未理解的修改。
2. 对战斗等核心逻辑先写行为测试，再实现；避免仅复制实现的无效断言。
3. 运行 `node --test tests/combat.test.mjs`。目前已有五项状态测试，但不能把它们通过等同于游戏可玩。
4. 交付前检查浏览器模块语法、资源路径、页面响应，并尽可能实测开始游戏、移动、挥剑命中、受伤、闪避、小怪持续刷新、倒地重生、暂停、重开和触屏操作。
5. 暂停、失焦和标签页切换不得造成按键卡住；长时间隐藏后避免一次补算大量伤害或生成无限实体。
6. 保证同一小怪只计一次击败；重开清除旧实体与旧定时器；通关后刷新仍继续。
7. 浏览器或预览工具不可用时，如实说明验证限制，不得声称已试玩。
8. 发布前确保源码、提交与打包内容对应；等待部署成功后才提供正式试玩链接。
9. 每次汇报说明实际完成内容、验证结果与剩余限制，避免把页面骨架说成完成的游戏。

## 当前进度快照（2026-11-06）

- 三条参考视频已下载；已使用 QuickTime 观看玩法视频。
- 已有完整 Three.js 场景、Cannon 碰撞与物理道具、低位相机、角色移动和骨骼动作。
- 角色与全身剑术动作复用长风 MIT 源码，并替换材质适配当前引擎；未下载限制 GLB 模型及 Mixamo 动作包。
- 中国式牌楼替换鸟居；岩石与云海素材使用 imagegen，瓦片材质采用 Poly Haven CC0。
- 已实现轻击三连、重击、闪避反击、锁敌、大招、受击硬直与顿帧、无限补怪、敲钟通关、倒地重生。
- 十一项状态、命中窗口与资源销毁回归测试通过。
- 已在本机浏览器查看骨骼角色并验证过移动、对话、大招输入；最后一轮完整战斗与通关尚未浏览器验收。
- 已登记私有 Sites 项目；打包与部署进行中，以部署返回状态为准。

本快照用于交接，不是验收结论；后续以实际文件与最新检查输出为准。

## 用户纠正后的画质目标

用户明确拒绝低多边形版本。目标更新为高清、唯美、水墨画质感的真实比例 3D 武侠场景。保留无限刷新战斗。停止沿用简化几何画质方向，先观看下载的参考视频，再落实材质、模型、地形和光影。新增使用 imagegen（位图材质与远景素材）、plugin-management（检查 Tripo 等三维生成能力），以及 systematic-debugging、verification-before-completion（已读取并用于本地检查）。不能用静态图片冒充可自由移动的三维世界。

## 最新美术与动作限制

必须中国风，禁止鸟居、日式服装和武士刀。动作规格见 docs/superpowers/specs/2026-11-06-combat-art-direction.md。开始直接进入练武场并接下试炼，老人对话改为可选的恢复气血功能。最终验收不得用单元测试代替浏览器实测，也不得把当前版本说成黑神话悟空级别画质。

## 女主、轻功与本地资源工作流

- 主角按用户青绿衣裙参考改为临时程序化女侠：高马尾、青绿短袖、象牙白层裙、金饰和中式直剑。脸部并非参考图的精确重建。
- 轻功：V 起飞/切换滑翔，空中 Space 上升、C 下降、Shift 冲刺；地面 Space 保持闪避。高度上限约22米。
- ComfyUI 启动于 http://127.0.0.1:8188，原生 MPS 后端；未修改核心。
- 四视图资源与 API/UI 工作流位于 character-resources/；四个 FLUX2 Klein/Hunyuan3D 所需模型完成 SHA256 校验。参考图整理流程已实际运行成功。图生3D白模流程已进入采样，不能在产出前声称成功，也不能把白模当作已贴图绑定模型。
- 最新自动化验证为15项通过；浏览器已观察女侠起飞和9米高度，完整战斗通关尚未验收。
- 用户分享的 img2threejs/Motion2MixamoRig/dsh-blender-plugin/dioramas 已阅读 README。优先借鉴模型质量门控、骨骼动作重定向与场景表现；不把视频剪辑工具当作游戏动画生成器，不批量安装无关依赖。

## 女主审美验收纠正（用户最新反馈）

用户明确否决当前程序化女侠：要求一眼就是美女，必须实质还原所给角色参考。配色/衣裙近似不等于角色还原。当前 heroine.js 只作运动与碰撞占位，不得作为最终美术或验收通过版本。后续角色应先在中性光照下检查正脸、侧脸、全身、发丝和衣料材质；提供真实3D正侧背视图，不能用二维美图冒充游戏模型。参考脸型、眼睛、肤质、长卷高马尾、金色花饰、盘扣刺绣与修长比例为重点。当前 Hunyuan3D 工作流仅生成几何白模，不含高质量脸部贴图或骨骼，运行成功也不能据此声称女主美术达标。

## 最新失败反馈与修订状态

用户再次否决纸人脸与不协调步态。禁止继续将手工五官或照片投影作为参考美女模型已还原的证明。写实脸投影材质已撤下，生成贴图保留为实验资产。墨线几何脸仍属未通过美术验收的实验，不能称为美女还原。

步态已从硬编码4.4m/s通用男性战斗跑改为女主独立步态：默认1.8m/s行走，Shift5.2m/s；动画读取实际水平速度与相对朝向；小步幅、窄脚距、低摆臂、低起伏，日常不再一直用战斗架势。战斗与锁定时才进入战斗步法。17项测试通过；完整浏览器视觉复核尚未完成。

浏览器验收遇到当前用户持续操作导致的自动输入中断；Safari当前显卡的WebGL初始化失败（getShaderPrecisionFormat返回null）；不得虚称已检查女主正脸。ComfyUI Hunyuan3D仍无已完成模型输出。

## 官方 Blender MCP 与首份头肩稿

- 旧拼接角色和 Xiaohua 免费整模均已被用户否决，不再以改色或替换免费模型作为当前制作路线。
- 用户已授权安装官方 Blender MCP，现已完成 Blender 5.1.2、官方插件和 Pi MCP 接入，并通过真实创建/读写/清理临时对象的操作检查。安装详情在 `/Users/cnn/.local/share/blender-mcp-official/installation/README.md`。
- 已通过官方 MCP 制作头肩稿，最后实验版本为 v2：`character-resources/blender/qingheng-head-v2/qingheng-head-v2.blend`。用户已明确否决该版外观并要求先暂停；v1、v2、原始场景及既有资产保留作实验记录。
- 当前预览入口：`http://127.0.0.1:8765/qingheng-head.html`。提供三维旋转、近景、四视角，以及同一模型的正脸、四分之三、侧脸三张实际 Blender 渲染。
- 本次角色几何由项目脚本创建，没有导入第三方人物网格；未绑定、无动画，当前仍是头肩稿。进度与验证：`docs/superpowers/plans/qingheng-blender-head-study.md`。
- Chrome/Playwright 桌面与390px手机检查通过，无页面/资源/WebGL错误。使用 SwiftShader，不能代表真实GPU性能；工具仍不支持查看图片，不能声称已审美验收或达到商品品质。
- 用户先要求暂停造型制作，随后明确要求“启动项目，使用新资源”。现已按新指令把 v2 头脸、头发和饰件导出为 `dist/assets/characters/qingheng-game-head-v2.glb`，替换游戏和人物查看页加载的旧头部；肩颈与展示衣领排除，保留现有身体和动画。导出入口 `tools/blender/export-qingheng-game-head.py`。头脸通过父级头骨随动，未新增表情、头发骨骼或蒙皮。外观仍未通过用户认可，不继续细化造型。
- Chrome 实测游戏启动、移动、挥剑、御风、暂停恢复无页面/资源错误；人物页确认新 GLB HTTP 200、16网格、2组顶点色、挂于 head 骨骼。完整战斗通关及真实GPU性能未重新验收。
- Blender 资源已纳入项目说明：`character-resources/blender/README.md` 汇总本机安装、版本、官方 MCP、工程、素材、脚本及启动方式；配置示例 `character-resources/blender/mcp.example.json`，项目内调用入口 `tools/blender/mcp_call.py`。后续直接读取这些文件，无需重复询问是否已安装。
