import concurrent.futures,hashlib,json,os,pathlib,shutil,time
os.environ['HF_HUB_DISABLE_XET']='1'
import requests
from huggingface_hub import get_hf_file_metadata,hf_hub_url
ROOT=pathlib.Path('/Users/cn/ComfyUI/models')
CACHE=pathlib.Path.home()/'.cache/huggingface/hub'
MODELS=[
 ('black-forest-labs/FLUX.2-klein-4b-fp8','flux-2-klein-4b-fp8.safetensors','diffusion_models/flux-2-klein-4b-fp8.safetensors'),
 ('Comfy-Org/z_image_turbo','split_files/text_encoders/qwen_3_4b_fp8_mixed.safetensors','text_encoders/qwen_3_4b_fp8_mixed.safetensors'),
 ('Comfy-Org/flux2-dev','split_files/vae/flux2-vae.safetensors','vae/flux2-vae.safetensors'),
 ('tencent/Hunyuan3D-2','hunyuan3d-dit-v2-0/model.fp16.safetensors','checkpoints/hunyuan3d-dit-v2.safetensors'),
]
files=[];jobs=[];CHUNK=32*1024*1024
for repo,name,target in MODELS:
 url=hf_hub_url(repo,name);m=get_hf_file_metadata(url,token=False);dest=ROOT/target
 entry={'repo':repo,'filename':name,'target':target,'size':m.size,'sha256':m.etag};files.append(entry)
 print('Model',target,round(m.size/1e9,2),'GB',flush=True)
 if dest.exists() and dest.stat().st_size==m.size:continue
 part=pathlib.Path(str(dest)+'.part');part.parent.mkdir(parents=True,exist_ok=True)
 if not part.exists():
  candidates=list((CACHE/('models--'+repo.replace('/','--'))/'blobs').glob('*.incomplete'))
  if candidates:shutil.copyfile(max(candidates,key=lambda p:p.stat().st_size),part)
  else:part.touch()
 start=part.stat().st_size
 chunks=pathlib.Path(str(part)+'.chunks');chunks.mkdir(exist_ok=True)
 entry.update(part=str(part),chunks=[])
 for first in range(start,m.size,CHUNK):
  last=min(first+CHUNK,m.size)-1;p=chunks/str(first);entry['chunks'].append(str(p));jobs.append((url,first,last,p))
manifest=pathlib.Path('/Users/cn/Projects/ink-village/character-resources/models-manifest.json');manifest.write_text(json.dumps(files,indent=2))
def download(job):
 url,first,last,p=job;expected=last-first+1
 url=url.replace('https://huggingface.co/tencent/Hunyuan3D-2/resolve/main/','https://modelscope.cn/models/Tencent-Hunyuan/Hunyuan3D-2/resolve/master/').replace('https://huggingface.co/','https://modelscope.cn/models/').replace('/resolve/main/','/resolve/master/')
 if p.exists() and p.stat().st_size==expected:return expected
 for retry in range(4):
  try:
   session=requests.Session();session.trust_env=False
   with session.get(url,headers={'Range':f'bytes={first}-{last}'},stream=True,timeout=(25,90)) as r:
    r.raise_for_status()
    if r.status_code!=206 or not r.headers.get('Content-Range','').startswith(f'bytes {first}-{last}/'):raise RuntimeError('Server did not honor requested range')
    with p.open('wb') as out:
     for data in r.iter_content(1024*1024):out.write(data)
   if p.stat().st_size!=expected:raise RuntimeError('Incomplete range')
   return expected
  except Exception:
   if retry==3:raise
   time.sleep(retry+1)
completed=0;t0=time.time()
with concurrent.futures.ThreadPoolExecutor(max_workers=6) as pool:
 for f in concurrent.futures.as_completed([pool.submit(download,j) for j in jobs]):
  completed+=f.result();print('Transferred %.2f GB at %.1f MB/s'%(completed/1e9,completed/1e6/max(time.time()-t0,1)),flush=True)
for f in files:
 dest=ROOT/f['target']
 if 'part' in f:
  p=pathlib.Path(f['part'])
  with p.open('ab') as out:
   for c in f['chunks']:
    with open(c,'rb') as src:shutil.copyfileobj(src,out,4*1024*1024)
  if p.stat().st_size!=f['size']:raise RuntimeError('Bad assembled size '+f['target'])
  sha=hashlib.sha256()
  with p.open('rb') as src:
   for b in iter(lambda:src.read(8*1024*1024),b''):sha.update(b)
  if sha.hexdigest()!=f['sha256']:raise RuntimeError('Bad SHA256 '+f['target'])
  os.replace(p,dest)
  for c in f['chunks']:pathlib.Path(c).unlink()
 print('Verified',f['target'],flush=True)
