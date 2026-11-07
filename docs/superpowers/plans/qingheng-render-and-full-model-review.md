# 青蘅：渲染修正与完整模型选型

更新：用户要求免费方案后，已取得 bettycolors 的 Xiaohua 免费完整 GLB（CC BY 4.0），并完成本地实时三维查看和青绿衣料试色。它没有骨骼与动画，尚未按参考改造或进入游戏。当前进度以[免费模型检查记录](qingheng-free-full-model-review.md)为准；下文保留此前渲染工作与付费候选核查，不再将购买资产作为继续工作的前提。

## 当前结论

用户已经否决“官方样例头部 + 程序化身体服装”的旧版外观。旧资产和实现保留作为占位，不再将其作为最终美术方案。下一版需要五官、头发、身体、服装统一制作的完整角色。

本阶段实际使用 `agent-reach` 检索网络资源和原始授权；通过公开 Sketchfab API、Exa 搜索及原始商品页交叉核对。未购买或下载付费角色，未替换当前游戏角色。

## 设计目标

翡翠轻古风女剑士；绿、白、金配色；侧分刘海、半束发并露出五官；缩小泡泡袖，利落领口；明确腰线并简化裙摆；玉石发簪、腰饰和短靴协调统一。用户提供的本轮参考保存于 `character-resources/source/emerald-swordswoman-reference.png`。

当前环境不能直接读取图片视觉内容，因此这份文字需求和资源元数据不能代替外观验收。

## 已完成的渲染修正

- `dist/render-pipeline.js`：独立管理离屏渲染。目标尺寸取自 canvas 实际 drawing buffer，随窗口变化更新；WebGL2 使用最多 4x MSAA，WebGL1 使用 FXAA。
- 使用 Three.js 的输出编码函数替代手动 `pow(1/2.2)`，避免重复或不准确的颜色转换。默认关闭泛光、颗粒、降饱和及深度描边；`look=ink` 只保留轻微暗角。
- `dist/art.js`：保留场景美术，通过重新导出使用新渲染模块。
- `dist/scene.js`：DPR 上限改为 2，开启 PCF 柔和阴影；阴影相机与光照目标跟随主角；阴影覆盖从原来的 80 米收窄为主角周围 36 米。减轻灯光染黄并将曝光设为 1。
- `render=direct` 可直接渲染同一场景，作为后处理对照。

本地查看：

- 默认：<http://127.0.0.1:8765/?play=1>
- 直接渲染：<http://127.0.0.1:8765/?play=1&render=direct>
- 轻微暗角：<http://127.0.0.1:8765/?play=1&look=ink>
- 完整模型候选：<http://127.0.0.1:8765/model-review.html>

## 完整模型候选与来源

优先技术候选：**Chinese Hanfu Dress Warrior**，作者 **MoonCat / mooncat-3d-models**。

原始商品页：

- Unity：<https://assetstore.unity.com/packages/3d/characters/humanoids/humans/chinese-hanfu-dress-warrior-modular-female-character-277476>
- 作者 CGTrader：<https://www.cgtrader.com/3d-models/character/fantasy-character/chinese-hanfu-dress-warrior>
- 原作者展示视频：<https://www.youtube.com/watch?v=PnlmrhsCxgQ>

直接获取 Unity 原始 HTML，核对商品名、作者、技术说明和 JSON-LD 价格：**US$48.40**。CGTrader 检索到的作者商品说明与 Unity 技术参数一致。价格、税费以实际结账为准。

商品页声明：

- 最多 26,707 个三角形，含整套角色、服饰及武器材质。
- Epic Skeleton / Humanoid；另有头发、衣服附加骨骼。
- Apple / ARKit 面部 Blendshapes。
- 4K PBR 贴图，支持多种头发、眼睛、服装等配色。
- CGTrader 清单含 FBX、PNG/TGA 贴图、Maya 2019、Unity、UE4 工程。下载前不能确认具体网格、骨骼命名和重定向结果。

Unity 标注 Standard Unity Asset Store EULA，CGTrader 标注 Royalty Free License；两者应按实际购买渠道取得相应许可。Unity 官方说明允许将取得授权的资产嵌入具有独立原创内容的游戏，不允许将资产作为独立下载产品分发：<https://assetstore.unity.com/browse/eula-faq>。购买包不应作为可独立下载的素材包公开再分发。

`dist/model-review.html` 展示从原始商品页取得的三张作者展示图地址和来源链接，图片仍由原站提供。已在 Chrome 验证三图均成功加载，原图尺寸均为 1200×675。没有把商品展示图冒充本项目实机截图，也没有复制商用模型文件。

此候选的技术条件较合适；**是否符合用户对颜值和风格的要求尚未确认**。接入前需要取得有授权的完整模型包，再进行 GLB 转换、材质检查、骨骼和动作重定向。不能将“整模候选已找到”写成“角色升级已完成”。

另外核查了 Sketchfab 的 `Lady in red dress`（aribb / RiceBeBe，CC BY-NC 4.0，有动画）与 `Wuxia Fighter`（phamlinhlam98，CC BY 4.0，描述另引概念图）。前者非商业限制及旗袍类型未满足通用最终资产要求，后者概念图权利和外观仍待确认；均未采用。Sketchfab 官方下载接口返回 `Authentication credentials were not provided.`，未绕过登录获取文件。

## 验证结果与范围

- 19 项现有 Node 测试全部通过；修改的 JS 模块与新增验证脚本语法检查通过。
- 新增 `tools/verify-render.mjs`：真实 Chrome WebGL 输出测试。1x / 2x DPR，WebGL2 MSAA / WebGL1 FXAA 共四组均通过；灰色、翡翠绿、白色、红色的中心像素与直接渲染相比，每个颜色通道差异不超过 2/255；目标尺寸、窗口缩放、旁路和 GL 错误检查通过。
- 游戏中实测 DPR 1.5：canvas 与离屏目标均为 1920×1200，4x MSAA；缩小窗口后均为 960×720。确认阴影已启用且实际生成 shadow map，光照目标与主角位置相同，无页面或 shader 错误。用于检查的调试引用只通过浏览器网络拦截注入，没有加入产品代码。
- 游戏移动、轻击、御风、暂停和恢复的浏览器检查通过，无失败资源或页面错误。
- 同一冻结场景的默认与直接渲染截图保存为 `docs/visual-review/render-v2/game-neutral.png`、`game-direct.png`；候选展示页截图为 `model-candidate.png`。旧截图和素材保留。
- 浏览器使用 SwiftShader，以上不是实际 GPU 性能测试。尚未视觉查看截图，也未完成整模美术验收、完整通关或真实 GPU 性能验收。

复跑渲染回归需已安装 Playwright 和 Chrome：

```sh
node tools/serve.mjs
# 另开终端；如 Playwright 不在当前项目依赖中，可通过
# PLAYWRIGHT_MODULE=/absolute/path/to/playwright/index.mjs 指定已有安装。
node tools/verify-render.mjs
```
