# Blender 资源与本机接入

## 当前状态

用户已否决青蘅 v2 头肩稿的外观并暂停细化，随后要求启动项目、使用新资源。现已将其头脸、头发和饰件接入游戏作临时外观；工程、脚本和渲染保留。该接入不代表美术验收通过，未继续制作全身或新增骨骼。

游戏资源：`dist/assets/characters/qingheng-game-head-v2.glb`（16网格，3,616,564字节）。导出脚本：`tools/blender/export-qingheng-game-head.py`，排除肩颈和展示衣领、调整尺寸与头骨锚点，保留原始工程和完整头肩预览。游戏启动入口：`http://127.0.0.1:8765/?play=1`。

## 项目内资源

| 资源 | 路径（相对项目根目录） |
| --- | --- |
| v2 可编辑工程 | `character-resources/blender/qingheng-head-v2/qingheng-head-v2.blend` |
| v1 内部比例稿 | `character-resources/blender/qingheng-head-v1/qingheng-head-v1.blend` |
| 三角度 Blender 渲染与报告 | `character-resources/blender/qingheng-head-v2/` |
| 网页 GLB | `dist/assets/characters/qingheng-head-study-v2.glb` |
| 网页渲染图 | `dist/assets/characters/qingheng-head-v2/` |
| 建模源码 | `tools/blender/build-qingheng-head-v1.py`、`build-qingheng-head-v2.py` |
| 导出与渲染 | `tools/blender/export-render-qingheng-head.py` |
| 几何检查 | `tools/blender/inspect-qingheng-head.py` |
| 项目内官方 MCP 调用入口 | `tools/blender/mcp_call.py` |
| Pi MCP 配置示例 | `character-resources/blender/mcp.example.json` |
| 浏览器检查 | `tools/verify-qingheng-head.mjs` |
| 制作、反馈与验证记录 | `docs/superpowers/plans/qingheng-blender-head-study.md` |

本地查看：`http://127.0.0.1:8765/qingheng-head.html`。先从项目根目录运行 `node tools/serve.mjs`。

## 本机已安装的软件

- Blender **5.1.2 / macOS arm64**：`/Users/cnn/Applications/Blender.app`。
- Blender 可执行文件：`/Users/cnn/Applications/Blender.app/Contents/MacOS/Blender`。
- 官方插件 **1.0.3**：模块 `bl_ext.user_default.mcp`；保存为自动启动，仅监听 `127.0.0.1:9876`。
- 官方 MCP 服务端 Python 包 **1.0.2**：`/Users/cnn/.local/share/blender-mcp-official/`，源码提交 `dbbf836`。
- 独立 Python：`/Users/cnn/.local/share/blender-mcp-official/.venv/bin/python`。
- 服务端命令：`/Users/cnn/.local/share/blender-mcp-official/.venv/bin/blender-mcp`。
- Pi 全局配置：`/Users/cnn/.pi/agent/mcp.json`，服务名 `blender-official`，26个工具，deferred exposure，超时300秒。
- 安装与原始验证：`/Users/cnn/.local/share/blender-mcp-official/installation/`；含安装说明、校验记录、验证脚本、官方插件ZIP。该目录最后一句“角色尚未制作”是安装时状态，当前角色进度以本项目记录为准。

Blender 应用、官方服务端源码及虚拟环境保留在安装位置；项目保存工程、素材、工具入口和配置说明，不复制整套应用或平台专用虚拟环境。

## 启动与使用

打开应用：

```sh
open -a /Users/cnn/Applications/Blender.app
lsof -nP -iTCP:9876 -sTCP:LISTEN
```

在项目根目录使用本项目内的调用脚本：

```sh
/Users/cnn/.local/share/blender-mcp-official/.venv/bin/python \
  tools/blender/mcp_call.py --list-tools

/Users/cnn/.local/share/blender-mcp-official/.venv/bin/python \
  tools/blender/mcp_call.py --code-file /absolute/path/blender_script.py
```

Blender 脚本以 `result = {...}` 返回 JSON；也支持 `--tool TOOL --arguments-file /absolute/path/args.json`。不需要等待 Pi 交互会话重载即可调用。Pi 使用全局配置时，必要时执行 `/reload`；配置示例只供合并参考，不覆盖已有其他 MCP 服务。

调用脚本默认使用本机已有安装，支持 `BLENDER_MCP_HOME`、`BLENDER_PATH`、`BLENDER_MCP_HOST`、`BLENDER_MCP_PORT` 环境变量。更换机器时先安装对应平台的 Blender、官方插件及服务端，再调整这些路径；资源目录不代表软件已随项目打包安装。

构建脚本会创建新场景并保存工程，不应当作连接检查运行。现阶段按用户要求暂停制作；后续用户明确要求继续时再使用新的版本目录。
