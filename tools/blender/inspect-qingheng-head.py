import bpy
import math
import json
from pathlib import Path
from mathutils import Vector
scene=bpy.data.scenes['Qingheng_Head_Study_v2']
bpy.context.window.scene=scene
depsgraph=bpy.context.evaluated_depsgraph_get()
rays={}
for name,x,z in [('left_pupil',-.212,2.107),('right_pupil',.212,2.107),('nose_tip',0,1.922),('mouth',0,1.737)]:
    hit,loc,normal,index,obj,matrix=scene.ray_cast(depsgraph,Vector((x,-6,z)),Vector((0,1,0)))
    rays[name]={'hit':hit,'object':obj.name if obj else None,'point':list(loc)}
head=bpy.data.objects['QH2_Face_continuous_sculpt']
assert all(all(math.isfinite(value) for value in vertex.co) for vertex in head.data.vertices)
original=[ob.name for ob in bpy.data.scenes['Scene'].objects]
assert set(original)=={'Cube','Light','Camera'}
result={'original_objects':original,'rays':rays,'face_vertices':len(head.data.vertices),'saved_file':bpy.data.filepath,'scene':scene.name}
output=Path(scene['review_output'])/'geometry-verification.json'
output.write_text(json.dumps(result,indent=2))
