# 云栖 · 山门初醒

中国水墨武侠浏览器 Demo。开始即可进入练武场：击退五名山匪，走到北侧右方铜钟附近按 E，完成第一回。通关后继续无限补怪（同时最多六名）。

## 运行

```sh
node tools/serve.mjs
```

或使用原有 Python 静态服务器：

```sh
python3 -m http.server 8765 --bind 127.0.0.1 --directory dist
```

青蘅头脸与发型初稿：http://127.0.0.1:8765/qingheng-head.html ，由 Blender 官方 MCP 创建，提供可旋转头肩模型、五官近景，以及正脸、四分之三侧脸、侧脸三张 Blender 实际渲染。最后实验版本为 v2，工程在 `character-resources/blender/qingheng-head-v2/qingheng-head-v2.blend`；用户已否决外观并暂停细化，随后要求使用新资源启动项目，现已将该版头脸、头发与饰件挂接到游戏现有角色头骨，保留现有身体与动作。游戏加载 `qingheng-game-head-v2.glb`，完整头肩稿仍供独立查看。制作与验证见[头肩制作记录](docs/superpowers/plans/qingheng-blender-head-study.md)。

Blender 资源与接入：[项目资源说明](character-resources/blender/README.md)，包含软件与官方 MCP 版本、安装位置、工程和素材清单、项目内调用入口及配置示例。

人物查看：http://127.0.0.1:8765/character.html ，提供同一实机模型的全身、近景、侧背面、行走和试剑。旧版拼接角色已被用户否决，目前保留作为占位，完整模型尚未替换。

免费整模历史候选：http://127.0.0.1:8765/free-model.html ，bettycolors 的 Xiaohua（CC BY 4.0）外观已被用户否决，保留实际 GLB、原色和青绿试色供历史追溯。当前文件没有骨骼与动画；来源与改动见 `dist/assets/characters/XIAOHUA-NOTICE.txt`，进度见[免费模型检查记录](docs/superpowers/plans/qingheng-free-full-model-review.md)。

完整模型候选与来源：http://127.0.0.1:8765/model-review.html 。目前转为 Blender 自行制作，页面保留免费候选和此前付费候选的作者商品图、价格与许可记录；付费模型尚未购买或接入。此前选型与渲染验证详见[记录](docs/superpowers/plans/qingheng-render-and-full-model-review.md)。

游戏默认使用按实际像素尺寸渲染的抗锯齿画面，开启跟随主角的动态阴影，关闭泛光、颗粒和降饱和。使用 `?play=1&render=direct` 可直接渲染进行对照；`?play=1&look=ink` 只增加轻微暗角。

游戏试玩：http://127.0.0.1:8765/ 。纯静态 ES modules，无需 npm 安装，也可双击 `start.command` 启动。

- WASD / 方向键：移动；Shift：奔跑。
- J / 鼠标单击：拨云 → 横江 → 回风轻击连招；收招中可预输入下一段。
- K：落雁重击。Space：闪避；闪避后短时间内 J：燕返回刺。
- F：锁定 / 解除锁定。Q：流云破阵，12 秒冷却。
- E：敲钟 / 与老人交谈并恢复气血。
- 鼠标拖动：转视角；滚轮：镜头远近。Esc：暂停。
- 触屏：屏幕按键移动与战斗。

## 项目约定与实现依据

先读 [agent.md](agent.md)；[AGENTS.md](AGENTS.md) 为代理入口。文档列出实际使用的 skills、约束和验证要求。

技术基础为 Video2Game 浏览器端的 Three.js + 分离碰撞体路线；BoxCollider 改编自其 Sketchbook 代码。村庄为原创程序化场景，没有执行 NeRF 实拍重建。角色与全身中国剑术动画复用《长风》MIT 源码，使用程序化骨骼、IK、布料与关键帧，不包含其受单独条款限制的 GLB 模型或 Mixamo 动作包。

## 检查

```sh
node --test tests/*.test.mjs
node --check dist/main.js
node --check dist/scene.js
node --check dist/fighter.js
node --check dist/art.js
node --check dist/render-pipeline.js
```

渲染浏览器回归需要已安装 Playwright 和 Chrome，先启动本地服务器，再运行 `node tools/verify-render.mjs`。也可通过 `PLAYWRIGHT_MODULE` 指定已有的 Playwright 模块路径，通过 `CHROME_BIN` 指定浏览器。1x / 2x DPR 与 WebGL2 MSAA / WebGL1 FXAA 四组颜色、尺寸和旁路检查均通过；游戏中确认实际生成阴影贴图，浏览器启动、移动、轻击、御风及暂停恢复无页面错误。自动化使用 SwiftShader，不能作为真实 GPU 性能或美术验收。

状态、动作、资源销毁、轻功、女主步态与头部模型检查共19项通过。2026-11-07 已在 Chrome 中检查新头部加载、人物视角和动作切换、开始游戏、轻击、御风开关、暂停及恢复，无页面错误；完整战斗通关、真实 GPU 性能和角色审美仍未验收。技术检查通过不代表完整角色已经好看或达到参考图标准。

青蘅头肩查看页验证：`node tools/verify-qingheng-head.mjs`，使用与渲染回归相同的 `PLAYWRIGHT_MODULE`、`CHROME_BIN`，可用 `DEMO_URL` 指定服务器。当前 v2 已通过桌面、390px 手机、四视角、近景、旋转、滚轮、自动旋转、重置、URL 参数及三张原图加载检查；无页面、资源、WebGL 错误。这些检查不能代替用户美术验收。

## 资源与许可

- Video2Game：MIT，https://github.com/video2game/video2game
- Sketchbook：MIT，Copyright (c) 2020 swift502。
- 长风 Long Wind：MIT，Copyright (c) 2026 jbang2004，来源提交 `9390889b7b293c9f983dca7e1b1ef4e629274009`；保留于 `dist/vendor/longwind/LICENSE`。
- 灰瓦纹理 ceramic_roof_01：Poly Haven，CC0；从长风的资源副本获取。
- 岩石纹理与水墨云海远景：本次使用 imagegen 生成并保存于 `dist/assets/`。
- 青蘅候选头部与头发：© 2022 pixiv Inc.，官方 VRM1_Constraint_Twist_Sample，VRM Public License 1.0；已按其内嵌授权修改、再分发，详见 `dist/assets/characters/NOTICE.txt` 与同目录完整许可。没有复制原样例衣服；中国风衣裙、兵器和骨骼动作由本项目现有系统提供。
- Xiaohua 免费完整角色候选：bettycolors，CC BY 4.0；从 Objaverse 公开再分发中按原作者 Sketchfab UID 取得 GLB。原文件未修改，查看页可选运行时青绿衣料试色，详见 `dist/assets/characters/XIAOHUA-NOTICE.txt`。尚未绑定或接入游戏。
- 青蘅 Blender 头肩稿 v2：由 `tools/blender/build-qingheng-head-v2.py` 创建几何，未导入第三方角色网格；Blender 工程与实际渲染保存在 `character-resources/blender/qingheng-head-v2/`。来源、状态及复现入口见 `dist/assets/characters/QINGHENG-HEAD-STUDY.txt`。
- Three.js / Cannon.js：MIT，详见 `dist/THIRD_PARTY_NOTICES.txt`。
- 用户链接对应视频保存在 `reference/`，仅作为本地参考，不打包发布。
