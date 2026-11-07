"""Export only v2 head/hair/accessories, anchored for the existing game head bone.
Run with Blender --background <v2.blend> --python <this file>.
The editable study and full bust GLB remain unchanged.
"""
import bpy
import math
from pathlib import Path
from mathutils import Matrix, Vector

PROJECT = Path(__file__).resolve().parents[2]
source = bpy.data.collections['QH2_Portrait']
scene = bpy.data.scenes.new('QH2_Game_head_export')
bpy.context.window.scene = scene
excluded = ('Neck_shoulders', 'Ivory_shoulder_silk', 'Cross_collar_',
            'Collar_', 'Silk_frog_loop_', 'Frog_button_')
objects = []
for original in source.objects:
    if original.name.removeprefix('QH2_').startswith(excluded):
        continue
    copy = original.copy()
    if original.type == 'CURVE':
        copy.data = original.data.copy()
        copy.data.resolution_u = 2
        copy.data.bevel_resolution = 0
    scene.collection.objects.link(copy)
    objects.append(copy)
bpy.context.view_layer.update()
depsgraph = bpy.context.evaluated_depsgraph_get()
groups = {}
for copy in objects:
    mesh = bpy.data.meshes.new_from_object(copy.evaluated_get(depsgraph),
        preserve_all_data_layers=True, depsgraph=depsgraph)
    if not mesh or not mesh.polygons:
        continue
    # Study Z=1.75 is the lower-face anchor; glTF exporter maps -Y to +Z.
    mesh.transform(Matrix.Scale(.30, 4) @ Matrix.Translation(Vector((0, 0, -1.75))) @ copy.matrix_world)
    obj = bpy.data.objects.new(copy.name + '_game', mesh)
    scene.collection.objects.link(obj)
    groups.setdefault(tuple(m.name for m in mesh.materials), []).append(obj)
for copy in objects:
    bpy.data.objects.remove(copy, do_unlink=True)
for batch in groups.values():
    bpy.ops.object.select_all(action='DESELECT')
    for obj in batch:
        obj.select_set(True)
    bpy.context.view_layer.objects.active = batch[0]
    if len(batch) > 1:
        bpy.ops.object.join()
bpy.ops.object.select_all(action='SELECT')
for obj in scene.objects:
    assert all(math.isfinite(c) for v in obj.data.vertices for c in v.co)
output = PROJECT / 'dist/assets/characters/qingheng-game-head-v2.glb'
bpy.ops.export_scene.gltf(filepath=str(output), export_format='GLB',
    use_selection=True, use_active_scene=True, export_apply=True,
    export_yup=True, export_extras=False)
print('GAME_HEAD_EXPORTED', output, output.stat().st_size)
