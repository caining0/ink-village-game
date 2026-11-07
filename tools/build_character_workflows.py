import json
from pathlib import Path
import urllib.request
ROOT=Path('/Users/cn/Projects/ink-village/character-resources/workflows')
UIROOT=Path('/Users/cn/ComfyUI/user/default/workflows')
INFO=json.load(open('/tmp/yunqi-comfy-nodes.json'))
def n(kind,**inputs):return {'class_type':kind,'inputs':inputs}
def ui_graph(api,title):
 nodes=[];links=[];lid=0;byid={}
 for order,(id,data) in enumerate(api.items()):
  kind=data['class_type'];definition=INFO[kind];widgets=[];ins=[]
  ordered={**definition['input'].get('required',{}),**definition['input'].get('optional',{})}
  for name,spec in ordered.items():
   if name not in data['inputs']:continue
   value=data['inputs'][name]
   if isinstance(value,list) and len(value)==2 and isinstance(value[0],str) and value[0] in api:
    src=api[value[0]]['class_type'];typ=INFO[src]['output'][value[1]];lid+=1;ins.append({'name':name,'type':typ,'link':lid});links.append([lid,int(value[0]),value[1],int(id),len(ins)-1,typ])
   else:
    widgets.append(value)
    if name in ('seed','noise_seed'):widgets.append('fixed')
  if kind=='LoadImage':widgets.append('image')
  outs=[{'name':str(name),'type':typ,'links':[]} for name,typ in zip(definition.get('output_name',definition['output']),definition['output'])]
  node={'id':int(id),'type':kind,'pos':[(order%5)*340,(order//5)*420],'size':[310,310 if kind=='CLIPTextEncode' else 180],'flags':{},'order':order,'mode':0,'inputs':ins,'outputs':outs,'properties':{'Node name for S&R':kind},'widgets_values':widgets}
  nodes.append(node);byid[int(id)]=node
 for link,src,slot,*_ in links:byid[src]['outputs'][slot]['links'].append(link)
 return {'last_node_id':max(map(int,api)),'last_link_id':lid,'nodes':nodes,'links':links,'groups':[],'config':{},'extra':{'ds':{'scale':.7,'offset':[20,20]},'yunqi_title':title},'version':.4}
def save(name,api):
 ROOT.mkdir(parents=True,exist_ok=True);UIROOT.mkdir(parents=True,exist_ok=True)
 (ROOT/(name+'.api.json')).write_text(json.dumps(api,ensure_ascii=False,indent=2))
 data=json.dumps(ui_graph(api,name),ensure_ascii=False,indent=2)
 (ROOT/(name+'.json')).write_text(data);(UIROOT/(name+'.json')).write_text(data)
# A model-free local run validates the server and prepares square, named character references.
ref={}
for i,view in enumerate(['front','left','back','right']):
 a,b,c=map(str,[i*3+1,i*3+2,i*3+3]);ref[a]=n('LoadImage',image=f'yunqi-heroine-{view}.png');ref[b]=n('ImageScale',image=[a,0],upscale_method='lanczos',width=1024,height=1024,crop='disabled');ref[c]=n('SaveImage',images=[b,0],filename_prefix=f'Yunqi_Heroine/reference_{view}')
save('云栖女主_01_四视图资源整理',ref)
# Native FLUX.2 Klein 4B distilled instruction editing; the reference is carried in conditioning.
for view,instruction in {
 'front':'front view, neutral symmetrical A-pose, both feet parallel and shoulder-width, full body',
 'left':'exact left profile view, face and body looking left, neutral A-pose, full body',
 'back':'exact rear view, show back of costume and high ponytail, neutral A-pose, full body',
 'right':'exact right profile view, face and body looking right, neutral A-pose, full body',
}.items():
 prompt=('Create a production 3D game character reference of the SAME ADULT WOMAN from the reference image. '+instruction+'. Preserve her face, green eyes, long brown high ponytail, gold floral hair ornaments, jade green Chinese stand-collar frog-button embroidered top, ivory layered skirt, green and gold side panels and tassels, ivory embroidered ankle boots. Chinese wuxia heroine, elegant athletic anatomy, consistent exact costume and proportions, realistic stylized 3D rendering, fine gold embroidery and satin fabric. Plain white background, soft neutral studio light, no dramatic shadows, no props, no weapons, no text, no Japanese clothing, no hat. Entire character visible with ample margin, suitable for mesh reconstruction.')
 g={'1':n('LoadImage',image='yunqi-heroine-reference.png'),'2':n('ImageScaleToTotalPixels',image=['1',0],upscale_method='lanczos',megapixels=.6,resolution_steps=16),'3':n('UNETLoader',unet_name='flux-2-klein-4b-fp8.safetensors',weight_dtype='default'),'4':n('CLIPLoader',clip_name='qwen_3_4b_fp8_mixed.safetensors',type='flux2',device='default'),'5':n('VAELoader',vae_name='flux2-vae.safetensors'),'6':n('CLIPTextEncode',clip=['4',0],text=prompt),'7':n('CLIPTextEncode',clip=['4',0],text=''),'8':n('VAEEncode',pixels=['2',0],vae=['5',0]),'9':n('ReferenceLatent',conditioning=['6',0],latent=['8',0]),'10':n('ReferenceLatent',conditioning=['7',0],latent=['8',0]),'11':n('RandomNoise',noise_seed=726521),'12':n('KSamplerSelect',sampler_name='euler'),'13':n('Flux2Scheduler',steps=4,width=768,height=1344),'14':n('CFGGuider',model=['3',0],positive=['9',0],negative=['10',0],cfg=1.0),'15':n('EmptyFlux2LatentImage',width=768,height=1344,batch_size=1),'16':n('SamplerCustomAdvanced',noise=['11',0],guider=['14',0],sampler=['12',0],sigmas=['13',0],latent_image=['15',0]),'17':n('VAEDecode',samples=['16',0],vae=['5',0]),'18':n('SaveImage',images=['17',0],filename_prefix=f'Yunqi_Heroine/flux_{view}')}
 save('云栖女主_02_参考图编辑_'+view,g)
# Native image-to-shape, separate from texturing and rigging. Preview settings first, then raise resolution.
g={'1':n('ImageOnlyCheckpointLoader',ckpt_name='hunyuan3d-dit-v2.safetensors'),'2':n('LoadImage',image='yunqi-heroine-front.png'),'3':n('CLIPVisionEncode',clip_vision=['1',1],image=['2',0],crop='none'),'4':n('Hunyuan3Dv2Conditioning',clip_vision_output=['3',0]),'5':n('EmptyLatentHunyuan3Dv2',resolution=3072,batch_size=1),'6':n('ModelSamplingAuraFlow',model=['1',0],shift=1.0,sampling='flow'),'7':n('KSampler',model=['6',0],seed=726521,steps=24,cfg=5.0,sampler_name='euler',scheduler='normal',positive=['4',0],negative=['4',1],latent_image=['5',0],denoise=1.0),'8':n('VAEDecodeHunyuan3D',samples=['7',0],vae=['1',2],num_chunks=8000,octree_resolution=192),'9':n('VoxelToMesh',voxel=['8',0],algorithm='surface net',threshold=.6),'10':n('MeshSmoothNormals',mesh=['9',0],crease_angle=120.0),'11':n('SaveGLB',mesh=['10',0],filename_prefix='Yunqi_Heroine/heroine_shape')}
save('云栖女主_03_图生3D白模',g)
# Submit only the model-free preparation graph now; model workflows run after complete, verified downloads.
req=urllib.request.Request('http://127.0.0.1:8188/prompt',data=json.dumps({'prompt':ref,'client_id':'yunqi-character-local','extra_data':{'extra_pnginfo':{'workflow':ui_graph(ref,'云栖女主四视图整理')}}}).encode(),headers={'Content-Type':'application/json'})
result=json.load(urllib.request.urlopen(req));(ROOT/'reference-run.json').write_text(json.dumps(result,indent=2));print(json.dumps(result))
