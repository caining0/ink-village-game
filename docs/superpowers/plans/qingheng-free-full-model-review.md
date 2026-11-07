# 青蘅：免费完整模型检查

用户要求优先免费方案，并追问能否自行制作角色。停止把购买 MoonCat 模型当作继续工作的前提；保留此前成果，寻找合法、完整、可改造的免费整模。

## 最新结论

用户已明确否决 Xiaohua 的外观，当前文件与试色页面只作为历史记录保留，不继续用作青蘅制作基底。路线已改为官方 Blender MCP 自行制作；当前 v2 头肩稿与待评审状态见 [Blender 头脸制作记录](qingheng-blender-head-study.md)。下文是当时取得与检查免费候选的历史过程，不代表当前审美认可。

## 已取得的免费资产

- 作品：Xiaohua；原作者：bettycolors。
- 原作者模型：https://sketchfab.com/3d-models/c7075dc4ef584b47b82b1618bf2043f0
- 原作者实时 API：https://api.sketchfab.com/v3/models/c7075dc4ef584b47b82b1618bf2043f0
- API 确认名称、作者、中式服装描述、可下载及 CC BY 4.0；明确允许商用并要求署名。
- 实际 GLB 从 Objaverse 的公开再分发取得，按原作者 UID 精确匹配；未使用其他上传者的同名模型，也没有绕过 Sketchfab 登录下载接口。
- 地址：https://huggingface.co/datasets/allenai/objaverse/resolve/main/glbs/000-079/c7075dc4ef584b47b82b1618bf2043f0.glb
- 本地：`dist/assets/characters/xiaohua.glb`，9,682,800 字节。
- SHA256：`89f593f8cbd149a971ed98787b7209693e36fc80dcb2d99ca846ae05bddfa34a`。
- 署名、来源、完整许可链接、改动范围：`dist/assets/characters/XIAOHUA-NOTICE.txt`。

实际检查：六个网格、三个材质、282,516 个三角形；身体与五官贴图、服装贴图均为 1024×1024 的内嵌 PNG。身体、头发、服装来自同一作者整模，原文件不作修改。

**这份 GLB 没有 skeleton、joint weights 或 animation clips。** CGTrader 页面检索结果虽然标注原始 Blender 包 rigged/animated，但不能据此声称当前下载的 GLB 已绑定。该角色尚未进入游戏，需完成合适的骨骼绑定和动作适配。

## 本地可审阅结果

- `http://127.0.0.1:8765/free-model.html`：独立完整三维查看，支持全身、近景、侧面、背面、拖动、缩放、自动旋转和手机布局。
- `http://127.0.0.1:8765/free-model.html?palette=jade`：青绿衣料试色，只重着色原有服装贴图的彩色部分，保留明暗及低饱和细节；可切回原作者配色。
- `dist/model-review.html` 已将免费整模放到付费记录之前；README 与 credits 添加来源。
- 不是本项目从零雕刻的原创角色，不能据此声称已还原青蘅参考图或已满足用户审美。

## 验证

`node --check dist/free-model-preview.js` 通过。

Chrome/Playwright 实测通过：整模和两张纹理加载、六网格及三角形计数、四视角按钮、试色与恢复、自动旋转、390px 手机布局、近景/试色 URL。试色改变 1,016,330 个服装贴图像素，并使用独立贴图，保留原图。无页面、资源或 WebGL 错误。该测试只验证本次查看页，不代表新角色动作或游戏战斗通过。

实际截图保存在 `docs/visual-review/free-xiaohua/`：`full-original.png`、`face-original.png`、`full-jade.png`、`mobile.png`。

再次尝试读取图片时工具仍返回 `Current model does not support images`，无法进行视觉质量评估。不能声称已看过这些截图、已判断颜值合适或完成美术验收。浏览器检查使用 SwiftShader，不代表真实 GPU 性能。

## 制作范围与后续

可以实际完成资产转换、贴图改色、服装与配饰建模、骨骼和动作接入；此前程序化角色并没有达到用户要求，从零生成职业角色艺术家级别的脸部与造型目前没有可靠交付结果，不能只用能力承诺代替成果。

当前已解除“没有钱买角色就无法继续”的限制。免费资产已经完整落盘，后续仍需先验证五官和整体造型是否适合作为基底，再按绿白金、侧分刘海、半束发、利落袖形、明确腰线、简化裙摆与短靴的目标改造，并绑定和适配动作。不要盲目细化已被否决的旧拼接外观。

本阶段实际使用 `agent-reach` 的 Exa 网页搜索与原始页面/API 核验。CGTrader 原始 HTML 请求为空，未把其搜索片段当作成功下载；许可采用原作者 Sketchfab 实时记录。Agent Reach 更新检查显示本地 v1.5.0、最新 v1.6.1，未改动工具环境。
