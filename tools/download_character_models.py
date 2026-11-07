import concurrent.futures
import os
from pathlib import Path
os.environ['HF_HUB_DISABLE_XET'] = '1'
from huggingface_hub import hf_hub_download
ROOT=Path('/Users/cn/ComfyUI/models')
MODELS=[
 ('black-forest-labs/FLUX.2-klein-4b-fp8','flux-2-klein-4b-fp8.safetensors','diffusion_models/flux-2-klein-4b-fp8.safetensors'),
 ('Comfy-Org/z_image_turbo','split_files/text_encoders/qwen_3_4b_fp8_mixed.safetensors','text_encoders/qwen_3_4b_fp8_mixed.safetensors'),
 ('Comfy-Org/flux2-dev','split_files/vae/flux2-vae.safetensors','vae/flux2-vae.safetensors'),
 ('tencent/Hunyuan3D-2','hunyuan3d-dit-v2-0/model.fp16.safetensors','checkpoints/hunyuan3d-dit-v2.safetensors'),
]
def fetch(item):
 repo,name,target=item
 print('Downloading',target,flush=True)
 path=hf_hub_download(repo_id=repo,filename=name,token=False)
 dest=ROOT/target
 dest.parent.mkdir(parents=True,exist_ok=True)
 if not dest.exists(): dest.symlink_to(path)
 print('Ready',target,Path(path).stat().st_size,flush=True)
 return str(dest)
with concurrent.futures.ThreadPoolExecutor(max_workers=3) as pool:
 for result in pool.map(fetch,MODELS): print(result,flush=True)
