"""Call the official Blender MCP server without reloading the interactive client.

Usage:
  .venv/bin/python mcp_call.py --code-file /absolute/path/script.py
  .venv/bin/python mcp_call.py --tool get_objects_summary --arguments-file /path/args.json
  .venv/bin/python mcp_call.py --list-tools

Blender Python code returns a JSON-compatible dict in the variable `result`.
"""
import argparse
import asyncio
import json
import os
from pathlib import Path

from mcp import ClientSession, StdioServerParameters
from mcp.client.stdio import stdio_client

ROOT = Path(os.environ.get('BLENDER_MCP_HOME', str(Path.home() / '.local/share/blender-mcp-official')))

async def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--list-tools', action='store_true')
    parser.add_argument('--tool', default='execute_blender_code')
    parser.add_argument('--code-file', type=Path)
    parser.add_argument('--arguments-file', type=Path)
    args = parser.parse_args()
    if args.code_file and args.arguments_file:
        parser.error('Use --code-file or --arguments-file, one at a time')
    arguments = {}
    if args.code_file:
        arguments = {'code': args.code_file.read_text()}
    elif args.arguments_file:
        arguments = json.loads(args.arguments_file.read_text())
    env = dict(os.environ)
    env.setdefault('BLENDER_MCP_HOST', '127.0.0.1')
    env.setdefault('BLENDER_MCP_PORT', '9876')
    env.setdefault('BLENDER_PATH', str(Path.home() / 'Applications/Blender.app/Contents/MacOS/Blender'))
    params = StdioServerParameters(command=str(ROOT / '.venv/bin/blender-mcp'), env=env)
    async with stdio_client(params) as (read_stream, write_stream):
        async with ClientSession(read_stream, write_stream) as session:
            await session.initialize()
            if args.list_tools:
                response = await session.list_tools()
                print(json.dumps(response.model_dump(mode='json'), indent=2))
                return
            response = await session.call_tool(args.tool, arguments)
            print(json.dumps(response.model_dump(mode='json'), indent=2))
            if response.isError:
                raise SystemExit(1)
            for item in response.content:
                if item.type == 'text':
                    try:
                        value = json.loads(item.text)
                    except json.JSONDecodeError:
                        continue
                    if isinstance(value, dict) and value.get('status') == 'error':
                        raise SystemExit(1)

if __name__ == '__main__':
    asyncio.run(main())
