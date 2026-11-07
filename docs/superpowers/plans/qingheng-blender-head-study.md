# 青蘅：Blender 头脸与发型初稿

## 最新反馈：停止于当前实验稿

用户反馈“还是太丑了，先这样”，已明确否决 v2 外观并暂停角色制作。保留工程、GLB、渲染和脚本，不再主动细化或推进全身制作。Blender 资源与接入已整理进 [项目资源说明](../../../character-resources/blender/README.md)，并加入项目内 MCP 调用脚本与配置示例。下文制作和测试结果是历史过程，不代表美术通过。

## 当前结果

在用户要求使用 Blender 自行制作、安装官方 MCP 后，完成首份头肩实验稿。最后实验版本为 **v2**，现已被用户否决并暂停；v1 为同轮内部比例草稿，文件与场景保留。

- 本地预览：`http://127.0.0.1:8765/qingheng-head.html`。
- Blender 工程：`character-resources/blender/qingheng-head-v2/qingheng-head-v2.blend`。
- 中性柔光渲染：同目录 `front.png`、`three-quarter.png`、`side.png`，均为 960 × 1120，实际使用 Blender Eevee 渲染。
- 浏览器资产：`dist/assets/characters/qingheng-head-study-v2.glb`，4,701,080 字节，18 个按材质合并的网格、198,164 个三角形。
- 浏览器原图：`dist/assets/characters/qingheng-head-v2/`。
- 来源记录：`dist/assets/characters/QINGHENG-HEAD-STUDY.txt`。

当前是**用户已否决外观、暂停制作的头肩实验稿**，没有骨骼、蒙皮与动画，尚未接入游戏。没有交付完整人物、动作或商品级人脸的验收结论。

## 造型与制作

当前可用技能里没有适用的专门 Blender 建模技能。本阶段使用已安装的官方 Blender MCP，真实执行 Blender Python；未调用其他生成服务、未主动分派子代理。

- 连续脸部网格：以平滑插值截面构造头型，鼻梁、鼻尖、鼻翼、颧部与下巴纳入同一个面部曲面。保留分区编辑的眼睑、凸面眼白、径向虹膜、瞳孔、眉毛、唇部与细节。
- 头发：独立头皮壳、扁平发束与细发丝；侧分刘海、面侧细束、后部长发与半束结。
- 饰件：玉簪、叶形金饰、玉耳坠；交领白绿头肩服装只作造型衬托。
- v2 调整了眼睛宽度、下巴前后轮廓，并让虹膜下边界收进眼睑范围。以上只是几何设计与结构修订，不能证明五官已经自然或好看。
- 所有本次角色几何均由本项目脚本创建，没有导入 pixiv、Xiaohua 或商品角色网格。

原场景 `Scene` 的 Cube / Light / Camera 保留。新建 `Qingheng_Head_Study_v1` 和 `Qingheng_Head_Study_v2` 场景；v2 使用 `QH2_` 前缀与独立角色、摄影棚集合。原有素材、游戏实现与已否决候选均保留。

## 工具与导出入口

- `tools/blender/build-qingheng-head-v1.py`：保留的初始草稿生成脚本。
- `tools/blender/build-qingheng-head-v2.py`：当前头肩稿生成脚本，通过官方 MCP 执行。
- `tools/blender/export-render-qingheng-head.py`：用独立 Blender 后台进程加载工程，导出并渲染。支持 `-- --export-only`，只重新导出而不重复渲染。
- `tools/blender/inspect-qingheng-head.py`：原场景保护、有限坐标与正面射线可见性检查。
- `tools/verify-qingheng-head.mjs`：浏览器资源与交互回归。

构建脚本会拒绝覆盖已经存在的同名工程。制作下一版时应先保存当前工程，并使用新版本的输出位置与对象前缀，不删除当前交付。

导出时使用临时场景的评估网格副本，降低细发丝曲线采样，按材质合并为18个网格。编辑用的354个对象（79网格、275曲线）保留在 Blender 工程中。导出明确限定 `use_active_scene=True`，最终 GLB 只有一个角色场景，不含默认立方体或其他工作场景，也不带本机路径的自定义属性。检查中发现 Blender 默认会导出其他场景中的已选对象，已修正导出选项并重新验证最终文件。

Blender 皮肤的程序化微表面、次表面和摄影棚照明与 Three.js 的 PBR 表现有差异。网页单独提供同一造型的真实 Blender 渲染，未用平面美图冒充可旋转模型。

## 已执行的验证

- Blender MCP 构建、保存、后台导出与三角度 Eevee 渲染成功。
- 原场景仍含 Cube、Light、Camera；面部18,080个顶点坐标均为有限数。
- 正面射线分别先命中左右瞳孔、连续面部鼻尖与嘴部接缝，检查这些部位没有被错误遮挡；这不是美术质量判断。
- 最终 GLB：单场景、18网格、198,164三角形、无骨骼/动画；头部肤色与虹膜保留两组顶点色网格。
- Chrome / Playwright：桌面1360×1000、手机390×844；正脸、四分之三、侧脸、背面按钮、五官近景、拖动、滚轮、自动旋转、重置与 URL 参数通过；三张960×1120原图加载通过；手机无横向溢出。
- 浏览器无页面、资源、WebGL错误；预览资源全部来自本地服务器，无外部网络请求。
- 项目 `node --test tests/*.test.mjs` 19项通过；新增建模、导出、检查 Python 脚本与浏览器模块语法检查通过。游戏的完整战斗通关未在本轮重新实测。
- 浏览器报告和截图：`docs/visual-review/qingheng-blender-v2/verification.json` 及同目录PNG。
- 工程报告：`build-report.json`、`delivery-report.json`、`geometry-verification.json`，均位于当前工程目录。

浏览器检查使用 SwiftShader，不能作为真实 GPU 性能测试。图片读取工具仍明确返回 `Current model does not support images`，本会话不能独立看图判断脸型、颜值、头发是否自然或是否达到 MoonCat 参考品质，不能把技术检查通过表述为美术通过。

## 既有候选与下一步

pixiv 拼接角色和 Xiaohua 免费整模都已经被用户否决。Xiaohua 与其试色只保留作来源追溯，不继续作为制作基底。MoonCat 仍只是质量与设计参考，未购买或下载商品包。

按用户最新要求，当前先停止，不自动继续细化头脸或推进身体、服装、绑定、动作及游戏接入。只有后续用户要求继续时再确定新的制作方向。当前头肩稿的19.8万三角形也不代表最终游戏预算。
