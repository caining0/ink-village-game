"""Export and render the saved Qingheng v2 study in a separate Blender process."""
import bpy
import json
import math
from pathlib import Path

PROJECT=Path('/Users/cnn/Library/Containers/com.tencent.xinWeChat/Data/Documents/xwechat_files/wxid_pyke7g61k0h521_1066/msg/file/2026-11/ink-village')
OUT=PROJECT/'character-resources/blender/qingheng-head-v2'
WEB=PROJECT/'dist/assets/characters'
IMAGES=WEB/'qingheng-head-v2'
IMAGES.mkdir(parents=True,exist_ok=True)
scene=bpy.data.scenes['Qingheng_Head_Study_v2']
source=bpy.data.collections['QH2_Portrait']
export_scene=bpy.data.scenes.new('QH2_Export_temporary')
bpy.context.window.scene=export_scene
copies=[]
for original in source.objects:
    ob=original.copy()
    if original.type=='CURVE':
        ob.data=original.data.copy()
        ob.data.resolution_u=2
        ob.data.bevel_resolution=0
    export_scene.collection.objects.link(ob)
    copies.append(ob)
bpy.context.view_layer.update()
depsgraph=bpy.context.evaluated_depsgraph_get()
export_meshes=[]
for ob in copies:
    mesh=bpy.data.meshes.new_from_object(ob.evaluated_get(depsgraph),preserve_all_data_layers=True,depsgraph=depsgraph)
    if not mesh or not mesh.polygons:
        continue
    dest=bpy.data.objects.new(ob.name+'_web',mesh)
    export_scene.collection.objects.link(dest)
    dest.matrix_world=ob.matrix_world.copy()
    export_meshes.append(dest)
for ob in copies:
    bpy.data.objects.remove(ob,do_unlink=True)
# Join by material to reduce browser draw calls while retaining authored objects in the .blend.
groups={}
for ob in export_meshes:
    key=tuple(mat.name if mat else '' for mat in ob.data.materials)
    groups.setdefault(key,[]).append(ob)
joined=[]
for objects in groups.values():
    bpy.ops.object.select_all(action='DESELECT')
    for ob in objects:
        ob.select_set(True)
    bpy.context.view_layer.objects.active=objects[0]
    if len(objects)>1:
        bpy.ops.object.join()
    joined.append(objects[0])
bpy.ops.object.select_all(action='DESELECT')
for ob in joined:
    ob.select_set(True)
    for vertex in ob.data.vertices:
        assert all(math.isfinite(value) for value in vertex.co), ob.name
bpy.context.view_layer.objects.active=joined[0]
triangles=sum(sum(len(poly.vertices)-2 for poly in ob.data.polygons) for ob in joined)
export_path=WEB/'qingheng-head-study-v2.glb'
bpy.ops.export_scene.gltf(filepath=str(export_path),export_format='GLB',use_selection=True,
                          use_active_scene=True,export_apply=True,export_yup=True,export_extras=False)
print('QH_EXPORT_DONE '+json.dumps({'file':str(export_path),'mesh_objects':len(joined),'triangles':triangles}),flush=True)
bpy.context.window.scene=scene
bpy.data.scenes.remove(export_scene)
import sys
if '--export-only' in sys.argv:
    report=json.loads((OUT/'delivery-report.json').read_text())
    report['glb_bytes']=export_path.stat().st_size
    (OUT/'delivery-report.json').write_text(json.dumps(report,indent=2))
    print('QH_EXPORT_ONLY_DONE',flush=True)
    raise SystemExit(0)
scene.render.resolution_x=960
scene.render.resolution_y=1120
scene.render.resolution_percentage=100
scene.render.image_settings.file_format='PNG'
scene.render.image_settings.color_mode='RGBA'
outputs=[]
for view,name in [('front','Front'),('three-quarter','ThreeQuarter'),('side','Side')]:
    scene.camera=bpy.data.objects['QH2_Camera_'+name]
    scene.render.filepath=str(OUT/(view+'.png'))
    print('QH_RENDER_START '+view,flush=True)
    try:
        bpy.ops.render.render(write_still=True,scene=scene.name)
    except RuntimeError:
        scene.render.engine='CYCLES'
        scene.cycles.device='CPU'
        scene.cycles.samples=64
        scene.cycles.use_denoising=True
        bpy.ops.render.render(write_still=True,scene=scene.name)
    (IMAGES/(view+'.png')).write_bytes((OUT/(view+'.png')).read_bytes())
    outputs.append(view+'.png')
    print('QH_RENDER_DONE '+view,flush=True)
scene.camera=bpy.data.objects['QH2_Camera_ThreeQuarter']
scene.render.filepath=str(OUT/'three-quarter.png')
scene['browser_preview']='qingheng-head.html'
scene['draft_triangles']=triangles
bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'qingheng-head-v2.blend'))
report={'blend':str(OUT/'qingheng-head-v2.blend'),'glb':str(export_path),
        'glb_bytes':export_path.stat().st_size,'export_meshes':len(joined),'triangles':triangles,
        'images':outputs,'render_engine':scene.render.engine,
        'original_objects':[ob.name for ob in bpy.data.scenes['Scene'].objects],
        'visual_acceptance':'Pending user review; not asserted by geometry or loading checks',
        'rigged':False,'animations':0}
(OUT/'delivery-report.json').write_text(json.dumps(report,indent=2))
print('QH_DELIVERY_DONE '+json.dumps(report),flush=True)
