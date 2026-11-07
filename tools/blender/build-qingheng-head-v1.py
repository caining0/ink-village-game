"""青蘅头肩 v1: authored mesh study, executed inside Blender via official MCP.

All geometry is generated here; no third-party character mesh is imported.
Coordinate system: Z up, face toward -Y. Existing scenes are retained.
"""
import bpy
import math
import json
import random
from mathutils import Vector
from pathlib import Path

PROJECT = Path('/Users/cnn/Library/Containers/com.tencent.xinWeChat/Data/Documents/xwechat_files/wxid_pyke7g61k0h521_1066/msg/file/2026-11/ink-village')
OUT = PROJECT / 'character-resources/blender/qingheng-head-v1'
WEB = PROJECT / 'dist/assets/characters'
OUT.mkdir(parents=True, exist_ok=True)
WEB.mkdir(parents=True, exist_ok=True)
assert not (OUT / 'qingheng-head-v1.blend').exists(), 'Keep existing work; use a new revision directory'
random.seed(21)
PREFIX = 'QH1_'
scene = bpy.data.scenes.new('Qingheng_Head_Study_v1')
bpy.context.window.scene = scene
collection = bpy.data.collections.new(PREFIX + 'Portrait')
scene.collection.children.link(collection)
studio = bpy.data.collections.new(PREFIX + 'Studio')
scene.collection.children.link(studio)


def linear(hex_color):
    h = hex_color.lstrip('#')
    values = [int(h[i:i+2], 16) / 255 for i in (0, 2, 4)]
    return tuple(v / 12.92 if v <= .04045 else ((v + .055) / 1.055) ** 2.4 for v in values) + (1,)


def material(name, color, rough=.45, metal=0, **values):
    mat = bpy.data.materials.new(PREFIX + name)
    mat.diffuse_color = linear(color)
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get('Principled BSDF')
    bsdf.inputs['Base Color'].default_value = linear(color)
    bsdf.inputs['Roughness'].default_value = rough
    bsdf.inputs['Metallic'].default_value = metal
    for key, value in values.items():
        if key in bsdf.inputs:
            bsdf.inputs[key].default_value = value
    return mat


skin = material('Porcelain_skin', '#e4b7a1', .46, **{'Subsurface Weight': .065, 'Subsurface Scale': .065})
# Subtle vertex coloration, used by Blender and exported to the browser.
nt = skin.node_tree
attr = nt.nodes.new('ShaderNodeVertexColor')
attr.layer_name = 'Complexion'
nt.links.new(attr.outputs['Color'], nt.nodes['Principled BSDF'].inputs['Base Color'])
noise = nt.nodes.new('ShaderNodeTexNoise')
noise.inputs['Scale'].default_value = 155
bump = nt.nodes.new('ShaderNodeBump')
bump.inputs['Strength'].default_value = .08
bump.inputs['Distance'].default_value = .001
nt.links.new(noise.outputs['Fac'], bump.inputs['Height'])
nt.links.new(bump.outputs['Normal'], nt.nodes['Principled BSDF'].inputs['Normal'])
skin_plain = material('Skin_detail', '#e4b7a1', .46, **{'Subsurface Weight': .06})
skin_shadow = material('Ear_inner', '#ba8877', .58)
lip = material('Rosewood_lips', '#b67672', .34, **{'Coat Weight': .15, 'Coat Roughness': .32})
seam = material('Lip_seam', '#704f49', .58)
nostril_mat = material('Nostril_shadow', '#8c6156', .65)
liner = material('Soft_eyeliner', '#322d2b', .48)
lower_liner = material('Lower_lid_shadow', '#9f7566', .57)
white = material('Warm_sclera', '#e1dfd5', .20, **{'Coat Weight': .35, 'Coat Roughness': .12})
iris = material('Jade_hazel_iris', '#5d6d5d', .25, **{'Coat Weight': .4, 'Coat Roughness': .1})
iris_nt = iris.node_tree
iris_attr = iris_nt.nodes.new('ShaderNodeVertexColor')
iris_attr.layer_name = 'Iris'
iris_nt.links.new(iris_attr.outputs['Color'], iris_nt.nodes['Principled BSDF'].inputs['Base Color'])
limbal = material('Iris_limbal_ring', '#26362e', .3)
pupil = material('Pupils', '#141b19', .18, **{'Coat Weight': .5})
hair = [material('Hair_ink', '#171e20', .34, **{'Anisotropic IOR Level': .45}),
        material('Hair_soft_umber', '#252a2b', .36, **{'Anisotropic IOR Level': .4}),
        material('Hair_glint', '#303a3a', .34, **{'Anisotropic IOR Level': .5})]
gold = material('Brushed_gold', '#bb9656', .31, .76)
jade = material('Carved_jade', '#5e9d8a', .28, **{'Subsurface Weight': .04, 'Coat Weight': .3})
jade_dark = material('Jade_silk', '#2b6459', .55, **{'Sheen Weight': .25})
cloth = material('Ivory_silk', '#ece6d5', .57, **{'Sheen Weight': .25})
base_mat = material('Celadon_base', '#c9d3c5', .35)


def mesh_obj(name, vertices, faces, mat, target=None, subdiv=0):
    mesh = bpy.data.meshes.new(PREFIX + name)
    mesh.from_pydata(vertices, [], faces)
    mesh.update()
    ob = bpy.data.objects.new(PREFIX + name, mesh)
    (target or collection).objects.link(ob)
    if mat:
        mesh.materials.append(mat)
    for poly in mesh.polygons:
        poly.use_smooth = True
    if subdiv:
        mod = ob.modifiers.new('Surface refinement', 'SUBSURF')
        mod.levels = subdiv
        mod.render_levels = subdiv
    return ob


def curve_obj(name, points, radius, mat, target=None, cyclic=False):
    data = bpy.data.curves.new(PREFIX + name, 'CURVE')
    data.dimensions = '3D'
    data.resolution_u = 12
    data.bevel_depth = radius
    data.bevel_resolution = 2
    spline = data.splines.new('BEZIER')
    spline.bezier_points.add(len(points) - 1)
    for bp, p in zip(spline.bezier_points, points):
        bp.co = p[:3]
        bp.handle_left_type = 'AUTO'
        bp.handle_right_type = 'AUTO'
        if len(p) > 3:
            bp.radius = p[3]
    spline.use_cyclic_u = cyclic
    ob = bpy.data.objects.new(PREFIX + name, data)
    (target or collection).objects.link(ob)
    data.materials.append(mat)
    return ob


def ellipsoid(name, center, scale, mat, segments=32, rings=20):
    vertices, faces = [], []
    for j in range(rings + 1):
        phi = math.pi * j / rings
        for i in range(segments):
            a = 2 * math.pi * i / segments
            vertices.append((center[0] + scale[0]*math.sin(phi)*math.cos(a),
                             center[1] + scale[1]*math.sin(phi)*math.sin(a),
                             center[2] + scale[2]*math.cos(phi)))
    for j in range(rings):
        for i in range(segments):
            a = j*segments+i
            b = j*segments+(i+1)%segments
            faces.append((a, a+segments, b+segments, b))
    return mesh_obj(name, vertices, faces, mat)


# Continuous head surface: smooth section interpolation, anatomically placed relief.
PROFILE = [
    (1.47,.015,-.265,.025), (1.50,.135,-.323,.13),
    (1.55,.235,-.365,.23), (1.63,.325,-.395,.30),
    (1.73,.395,-.419,.35), (1.84,.447,-.438,.39),
    (1.96,.478,-.440,.421), (2.08,.49,-.427,.437),
    (2.20,.495,-.415,.433), (2.35,.485,-.402,.422),
    (2.50,.448,-.365,.38), (2.64,.355,-.275,.292),
    (2.73,.205,-.152,.17), (2.78,.008,-.008,.01),
]


def section(z):
    for k in range(len(PROFILE)-1):
        if z <= PROFILE[k+1][0]:
            p0 = PROFILE[max(0, k-1)]
            p1, p2 = PROFILE[k], PROFILE[k+1]
            p3 = PROFILE[min(len(PROFILE)-1, k+2)]
            t = max(0, min(1, (z-p1[0])/(p2[0]-p1[0])))
            values = []
            for i in (1, 2, 3):
                m1 = (p2[i]-p0[i])/(p2[0]-p0[0])*(p2[0]-p1[0])
                m2 = (p3[i]-p1[i])/(p3[0]-p1[0])*(p2[0]-p1[0])
                values.append((2*t**3-3*t*t+1)*p1[i] + (t**3-2*t*t+t)*m1
                              + (-2*t**3+3*t*t)*p2[i] + (t**3-t*t)*m2)
            return values
    return list(PROFILE[-1][1:])


def gaussian(x,z,cx,cz,sx,sz):
    return math.exp(-((x-cx)/sx)**2-((z-cz)/sz)**2)


def relief(x,z):
    # Bridge, tip and alae are part of the same surface as the cheeks.
    y = -.046*gaussian(x,z,0,2.04,.058,.17)
    y -= .122*gaussian(x,z,0,1.922,.061,.063)
    y -= .037*gaussian(abs(x),z,.067,1.89,.036,.033)
    y -= .015*gaussian(x,z,0,1.80,.040,.07)
    y -= .018*gaussian(x,z,0,1.742,.15,.07)
    y -= .025*gaussian(abs(x),z,.285,1.97,.13,.13)
    y += .024*gaussian(abs(x),z,.22,2.105,.135,.075)
    y -= .018*gaussian(abs(x),z,.23,2.22,.16,.055)
    y -= .013*gaussian(x,z,0,1.55,.14,.06)
    return y


def face_y(x,z):
    w, front, back = section(z)
    c = math.sqrt(max(0, 1-(x/max(w,.0001))**2))
    return front*c + relief(x,z)*c**6


vertices, faces = [], []
N, R = 160, 112
for j in range(R+1):
    z = 1.47 + (2.78-1.47)*j/R
    w, front, back = section(z)
    for i in range(N):
        a = 2*math.pi*i/N
        c = math.cos(a)
        x = w*math.sin(a)
        y = front*c + relief(x,z)*max(0,c)**6 if c >= 0 else -back*c
        vertices.append((x,y,z))
for j in range(R):
    for i in range(N):
        a = j*N+i
        b = j*N+(i+1)%N
        faces.append((a,b,b+N,a+N))
faces.append(tuple(reversed(range(N))))
faces.append(tuple(R*N+i for i in range(N)))
head = mesh_obj('Face_continuous_sculpt',vertices,faces,skin)
colors = head.data.color_attributes.new(name='Complexion',type='FLOAT_COLOR',domain='POINT')
base = linear('#e4b7a1')
rosy = linear('#dfa297')
for v, color in zip(head.data.vertices,colors.data):
    x,y,z = v.co
    blush = .25*gaussian(abs(x),z,.29,1.98,.13,.095) if y < 0 else 0
    color.color = tuple(base[i]*(1-blush)+rosy[i]*blush for i in range(3))+(1,)
head['construction'] = 'Continuous authored anatomical surface; no imported character mesh'

# Neck and the visible shoulders are one smoothly tapered surface.
body_sections = [(0.1,.72,.26,.12),(.35,.81,.31,.1),(.70,.86,.31,.1),
                 (.95,.83,.26,.09),(1.07,.70,.22,.10),(1.16,.43,.17,.1),
                 (1.27,.20,.15,.12),(1.40,.155,.15,.13),(1.60,.16,.17,.14),
                 (1.77,.20,.19,.15)]
verts, quads = [], []
for z, w, d, cy in body_sections:
    for i in range(96):
        a=2*math.pi*i/96
        # Rounded shoulder slope rather than a horizontal cylinder.
        verts.append((w*math.sin(a),cy-d*math.cos(a),z))
for j in range(len(body_sections)-1):
    for i in range(96):
        a=j*96+i;b=j*96+(i+1)%96
        quads.append((a,b,b+96,a+96))
mesh_obj('Neck_shoulders',verts,quads,skin_plain,subdiv=2)

# Ears: restrained helix and concha, partly covered by the temple locks.
for s in (-1,1):
    ellipsoid('Ear_'+str(s),(s*.48,.055,1.986),(.068,.083,.145),skin_plain)
    ellipsoid('Ear_concha_'+str(s),(s*.532,.025,1.988),(.011,.043,.085),skin_shadow)
    pts=[]
    for i in range(17):
        a=2*math.pi*i/17
        pts.append((s*(.531+.007*math.cos(a)),.05+.061*math.sin(a),1.995+.117*math.cos(a)))
    curve_obj('Ear_helix_'+str(s),pts,.009,skin_plain,cyclic=True)

# Eyes are convex almond surfaces with wrapped irises and sculpted eyelid rims.
EYE_Z = 2.105
EYE_X = .218
EYE_W = .146


def eye_bounds(u):
    shape=max(0,1-u*u)**.68
    tilt=.011*u
    return EYE_Z+tilt+.053*shape, EYE_Z+tilt-.039*shape


def eye_y(x,z,s):
    u=(s*x-EYE_X)/EYE_W
    norm=(z-EYE_Z-.011*u)/.059
    bulge=math.sqrt(max(0,1-u*u-norm*norm))
    return face_y(x,z)-.009-.038*bulge


for s in (-1,1):
    verts, quads=[],[]
    nx,ny=64,18
    for j in range(ny+1):
        v=j/ny
        for i in range(nx+1):
            u=-1+2*i/nx
            x=s*(EYE_X+EYE_W*u)
            upper,lower=eye_bounds(u)
            z=lower*(1-v)+upper*v
            verts.append((x,eye_y(x,z,s),z))
    for j in range(ny):
        for i in range(nx):
            a=j*(nx+1)+i
            q=(a,a+1,a+nx+2,a+nx+1)
            quads.append(q if s==1 else tuple(reversed(q)))
    mesh_obj('Sclera_almond_'+str(s),verts,quads,white)
    # Eyelid bands bridge the sclera edges into the facial surface.
    for upper_lid in (True,False):
        verts,quads=[],[]
        for j in range(5):
            t=j/4
            for i in range(nx+1):
                u=-1+2*i/nx
                x=s*(EYE_X+EYE_W*u)
                upper,lower=eye_bounds(u)
                edge=upper if upper_lid else lower
                extent=(.021 if upper_lid else .017)*max(0,1-u*u)**.5
                z=edge+(extent*t if upper_lid else -extent*t)
                yy=face_y(x,z)-.003-(.010*(1-t)+.005*math.sin(math.pi*t))*max(0,1-u*u)**.4
                verts.append((x,yy,z))
        for j in range(4):
            for i in range(nx):
                a=j*(nx+1)+i
                quads.append((a,a+1,a+nx+2,a+nx+1))
        ob=mesh_obj(('Upper_lid_' if upper_lid else 'Lower_lid_')+str(s),verts,quads,skin_plain)
        # Material is two-sided for robust mirror orientation in exported glTF.
        pts=[]
        for i in range(25):
            u=-.985+1.97*i/24
            x=s*(EYE_X+EYE_W*u)
            edge=eye_bounds(u)[0 if upper_lid else 1]
            pts.append((x,face_y(x,edge)-.014,edge,max(.1,(1-u*u)**.5)))
        curve_obj(('Upper_lash_line_' if upper_lid else 'Lower_lid_edge_')+str(s),pts,
                  .0038 if upper_lid else .0018,liner if upper_lid else lower_liner)
    crease=[]
    for i in range(23):
        u=-.85+1.7*i/22;x=s*(EYE_X+EYE_W*u)
        z=eye_bounds(u)[0]+.026*math.sqrt(1-u*u)
        crease.append((x,face_y(x,z)-.004,z,max(.1,1-u*u)))
    curve_obj('Upper_lid_crease_'+str(s),crease,.0013,lower_liner)
    # Iris disks are convex patches on the eye, with individually colored radial sectors.
    cx=s*(EYE_X-.006)
    cz=EYE_Z+.002
    iv,ifaces=[],[]
    rings,segments=7,112
    for j in range(rings+1):
        r=.0455*j/rings
        for i in range(segments):
            a=2*math.pi*i/segments
            x=cx+r*math.cos(a);z=cz+r*math.sin(a)
            iv.append((x,eye_y(x,z,s)-.0015,z))
    for j in range(rings):
        for i in range(segments):
            a=j*segments+i;b=j*segments+(i+1)%segments
            ifaces.append((a,b,b+segments,a+segments))
    iris_ob=mesh_obj('Radial_iris_'+str(s),iv,ifaces,iris)
    color=iris_ob.data.color_attributes.new(name='Iris',type='FLOAT_COLOR',domain='POINT')
    for k,datum in enumerate(color.data):
        j,i=divmod(k,segments);r=j/rings
        streak=.5+.5*math.sin(i*2.39+math.sin(i*.76)*2)
        dark=.48 if r>.84 else 1
        datum.color=(dark*(.065+.055*streak),dark*(.090+.07*streak),dark*(.062+.047*streak),1)
    pv=[(cx,eye_y(cx,cz,s)-.003,cz)]
    for i in range(segments):
        a=2*math.pi*i/segments;x=cx+.019*math.cos(a);z=cz+.019*math.sin(a)
        pv.append((x,eye_y(x,z,s)-.003,z))
    pf=[(0,i+1,(i+1)%segments+1) for i in range(segments)]
    mesh_obj('Pupil_'+str(s),pv,pf,pupil)
    # Small natural upper lashes, primarily near the outer eye corner.
    for k,u in enumerate((.35,.52,.68,.80,.9)):
        x=s*(EYE_X+EYE_W*u);z=eye_bounds(u)[0];y=face_y(x,z)-.016
        curve_obj('Lash_'+str(s)+'_'+str(k),[(x,y,z,.8),(x+s*.006,y-.006,z+.007,.5),
            (x+s*(.012+.009*u),y-.012,z+.012+.007*u,.02)],.0012,liner)
    # Tapered brows, with fine directional fibers.
    bv,bf=[],[]
    for j in range(2):
        for i in range(40):
            t=i/39;x=s*(.080+.303*t)
            z=2.215+.036*math.sin(math.pi*t*.87)-.020*t
            thickness=.018*math.sin(math.pi*(.10+.87*t))**.65
            zz=z+(j-.5)*thickness
            bv.append((x,face_y(x,zz)-.006,zz))
    for i in range(39):
        bf.append((i,i+1,41+i,40+i))
    mesh_obj('Brow_shape_'+str(s),bv,bf,hair[1])
    for i in range(27):
        t=i/26;x=s*(.085+.288*t);z=2.215+.036*math.sin(math.pi*t*.87)-.020*t
        curve_obj('Brow_fiber_'+str(s)+'_'+str(i),[(x,face_y(x,z)-.007,z-.004,.4),
            (x+s*.008,face_y(x,z+.007)-.008,z+.007,.1)],.00065,hair[0])

# Closed mouth with an explicit cupid's bow and soft upper/lower lip volume.
MOUTH_Z=1.737
for upper in (True,False):
    verts,quads=[],[]
    nx,ny=72,10
    for j in range(ny+1):
        t=j/ny
        for i in range(nx+1):
            u=-1+2*i/nx;x=.143*u
            shape=max(0,1-u*u)**.7
            center=MOUTH_Z+.008*u*u
            if upper:
                edge=center+shape*(.019+.009*math.exp(-((abs(u)-.28)/.17)**2))
            else:
                edge=center-.031*shape
            z=center*(1-t)+edge*t
            fullness=(.006+.016*math.sin(math.pi*t)**.7)*shape
            verts.append((x,face_y(x,z)-fullness,z))
    for j in range(ny):
        for i in range(nx):
            a=j*(nx+1)+i
            quads.append((a,a+1,a+nx+2,a+nx+1))
    mesh_obj('Upper_lip' if upper else 'Lower_lip',verts,quads,lip)
points=[]
for i in range(41):
    u=-1+2*i/40;x=.143*u;z=MOUTH_Z+.008*u*u
    points.append((x,face_y(x,z)-.008,z,max(.1,1-u*u)))
curve_obj('Mouth_resting_seam',points,.0017,seam)
for s in (-1,1):
    pts=[]
    for i in range(9):
        t=i/8;x=s*(.037+.044*t);z=1.869+.006*math.sin(math.pi*t)
        pts.append((x,face_y(x,z)-.002,z,max(.1,math.sin(math.pi*t))))
    curve_obj('Nostril_crease_'+str(s),pts,.0035,nostril_mat)

# Hair: a close scalp shell, continuous flattened locks, and fine directional fibers.

def hairline(theta):
    c=math.cos(theta)
    return 1.88+.49*max(0,c)**1.3-.20*max(0,-c)


def scalp_point(theta,t):
    bottom=hairline(theta)
    z=2.815-(2.815-bottom)*t
    w,front,back=section(min(2.779,max(1.471,z-.035)))
    extra=.027+.015*math.sin(math.pi*t)
    x=(w+extra)*math.sin(theta)
    c=math.cos(theta)
    y=(front-extra)*c if c>=0 else -(back+extra)*c
    return (x,y+.025,z)


verts,quads=[],[]
for j in range(49):
    for i in range(128):
        verts.append(scalp_point(2*math.pi*i/128,max(.001,j/48)))
for j in range(48):
    for i in range(128):
        a=j*128+i;b=j*128+(i+1)%128
        quads.append((a,b,b+128,a+128))
mesh_obj('Hair_scalp',verts,quads,hair[0])


def catmull(points,t):
    n=len(points)-1
    value=min(n-1e-8,max(0,t)*n)
    k=int(value);u=value-k
    p0=Vector(points[max(k-1,0)]);p1=Vector(points[k]);p2=Vector(points[k+1]);p3=Vector(points[min(k+2,n)])
    return .5*((2*p1)+(-p0+p2)*u+(2*p0-5*p1+4*p2-p3)*u*u+(-p0+3*p1-3*p2+p3)*u*u*u)


def hair_lock(name,points,width,depth,mat,fibers=3):
    verts,quads=[],[]
    frames=[]
    steps,sides=36,12
    for j in range(steps+1):
        t=j/steps
        center=catmull(points,t)
        tangent=(catmull(points,min(1,t+.005))-catmull(points,max(0,t-.005))).normalized()
        reference=Vector((0,-1,0))
        if abs(reference.dot(tangent))>.95:
            reference=Vector((1,0,0))
        across=tangent.cross(reference).normalized()
        normal=across.cross(tangent).normalized()
        taper=max(.015,(math.sin(math.pi*(.13+.87*t)))**.6)
        frames.append((center,across,normal,taper))
        for i in range(sides):
            a=2*math.pi*i/sides
            v=center+across*(math.cos(a)*width*taper)+normal*(math.sin(a)*depth*taper)
            verts.append(tuple(v))
    for j in range(steps):
        for i in range(sides):
            a=j*sides+i;b=j*sides+(i+1)%sides
            quads.append((a,b,b+sides,a+sides))
    quads.append(tuple(reversed(range(sides))))
    quads.append(tuple(steps*sides+i for i in range(sides)))
    ob=mesh_obj(name,verts,quads,mat)
    for k in range(fibers):
        frac=(k+1)/(fibers+1)*1.5-.75
        points_f=[]
        for j in range(0,steps+1,3):
            center,across,normal,taper=frames[j]
            # The front-facing surface of the lock carries soft fine strands.
            v=center+across*(width*taper*frac)+normal*(depth*taper*math.sqrt(max(0,1-frac*frac))+.0009)
            points_f.append((*v,max(.05,taper*.65)))
        curve_obj(name+'_fiber_'+str(k),points_f,.0008,hair[2])
    return ob


# Back locks fan gently from the half-up fastening. Keep the face clear.
for i in range(13):
    u=-1+2*i/12;x=.45*u
    pts=[(x*.4,.34,2.68),(x*.85,.50,2.35),(x,.51,1.95),
         (x+.035*math.sin(i),.48,1.40),(x*1.07,.41+.06*math.cos(i),.88),
         (x*.97+.03*math.sin(i),.36,.60+.09*math.cos(i*.8))]
    hair_lock('Back_hair_%02d'%i,pts,.065,.026,hair[i%2],4)
# Tucked side sections and two longer cheek-framing locks.
for s in (-1,1):
    for i in range(4):
        d=i*.023
        pts=[(s*(.31+d),-.19,2.62),(s*(.49+d*.4),-.12,2.31),
             (s*(.52+d*.3),.06,2.02),(s*(.51+d*.2),.20,1.63),
             (s*(.48+d*.4),.25,1.12),(s*(.48+d*.3),.15,.88+i*.04)]
        hair_lock('Temple_tuck_'+str(s)+'_'+str(i),pts,.047,.020,hair[i%2],2)
    pts=[(s*.43,-.26,2.43),(s*.49,-.31,2.18),(s*.50,-.24,1.93),
         (s*.47,-.15,1.60),(s*.49,-.12,1.29),(s*.43,-.09,1.16)]
    hair_lock('Face_frame_'+str(s),pts,.029,.012,hair[1],3)
# Side part, layered swept fringe: the shortest ends stay above the eyebrow.
for i in range(8):
    t=i/7
    pts=[(-.105+.025*t,-.285,2.76-.055*t),
         (.055+.07*t,-.415,2.66-.065*t),
         (.25+.075*t,-.435,2.50-.10*t),
         (.41+.04*t,-.34,2.31-.12*t),
         (.485+.012*t,-.17,2.12-.13*t)]
    hair_lock('Swept_fringe_R_%02d'%i,pts,.033+.008*t,.014,hair[i%2],3)
for i in range(5):
    t=i/4
    pts=[(-.13-.028*t,-.27,2.75-.04*t),(-.29-.04*t,-.37,2.62-.05*t),
         (-.43-.035*t,-.32,2.43-.07*t),(-.49-.025*t,-.14,2.21-.09*t),
         (-.515,-.02,2.05-.07*t)]
    hair_lock('Swept_fringe_L_%02d'%i,pts,.034,.014,hair[i%2],3)
# Directional scalp lines remain restrained, avoiding a plastic helmet surface.
for i in range(66):
    a=2*math.pi*i/66
    pts=[]
    for j in range(13):
        t=.08+.86*j/12
        x,y,z=scalp_point(a+.055*math.sin(math.pi*t),t)
        pts.append((x*1.002,y*1.002,z+.001,max(.1,math.sin(math.pi*t))))
    curve_obj('Scalp_strand_%02d'%i,pts,.00065,hair[2 if i%4==0 else 1])
# Half-up fastening on the back of the crown.
for i in range(5):
    a=2*math.pi*i/5
    pts=[(.19*math.sin(a),.37,2.59+.07*math.cos(a)),
         (.17*math.sin(a+1),.51,2.49+.08*math.cos(a+1)),
         (.12*math.sin(a+2.5),.55,2.47+.085*math.cos(a+2.5)),
         (.10*math.sin(a+4),.46,2.52+.07*math.cos(a+4))]
    hair_lock('Half_up_knot_'+str(i),pts,.045,.025,hair[1],2)

# Jade hairpin and a small ginkgo-inspired leaf ornament.
curve_obj('Hairpin_shaft',[(-.48,.46,2.50),(.12,.48,2.49),(.52,.48,2.50,.2)],.009,gold)
curve_obj('Hairpin_jade_head',[(-.52,.45,2.5),(-.59,.43,2.54),(-.61,.43,2.59),(-.57,.43,2.63),(-.51,.44,2.60)],.014,jade)


def leaf(name,center,dx,dz,mat,width=.033):
    cx,cy,cz=center
    verts,quads=[],[]
    for j in range(13):
        t=j/12
        for i in range(5):
            u=-1+2*i/4
            span=width*math.sin(math.pi*t)**.7
            verts.append((cx+dx*t+u*span,cy-.012*math.sin(math.pi*t)*(1-u*u),cz+dz*t))
    for j in range(12):
        for i in range(4):
            a=j*5+i
            quads.append((a,a+1,a+6,a+5))
    ob=mesh_obj(name,verts,quads,mat)
    mod=ob.modifiers.new('Leaf thickness','SOLIDIFY');mod.thickness=.0015
    return ob


for i in range(5):
    a=-.8+i*.39
    leaf('Gold_leaf_'+str(i),(-.46,-.035,2.40),-.055+math.sin(a)*.10,
         .07+math.cos(a)*.09,gold,.024)
leaf('Jade_leaf',(-.46,-.055,2.40),-.07,.15,jade,.035)
ellipsoid('Hair_ornament_cabochon',(-.48,-.064,2.43),(.026,.015,.035),jade)
for s in (-1,1):
    x=s*.541
    ellipsoid('Earring_stud_'+str(s),(x,-.01,1.90),(.011,.013,.011),gold,20,12)
    curve_obj('Earring_chain_'+str(s),[(x,-.01,1.89),(x+s*.006,-.02,1.84),(x,-.025,1.79)],.0025,gold)
    ellipsoid('Jade_earring_'+str(s),(x,-.027,1.755),(.021,.012,.041),jade,24,16)
    pts=[]
    for i in range(24):
        a=2*math.pi*i/24
        pts.append((x+.024*math.sin(a),-.031,1.755+.044*math.cos(a)))
    curve_obj('Earring_rim_'+str(s),pts,.002,gold,cyclic=True)

# Simple Chinese cross-collar bust; this is a shoulder study, not a full costume.
# Outer silk shell follows the shoulders but ends below the collarbones.
verts,quads=[],[]
garment_sections=[(.10,.735,.275),(.35,.83,.325),(.70,.88,.325),(.94,.86,.28),
                  (1.035,.73,.24),(1.10,.52,.20),(1.16,.28,.17)]
for z,w,d in garment_sections:
    for i in range(96):
        a=2*math.pi*i/96
        verts.append((w*math.sin(a),.10-d*math.cos(a),z))
for j in range(len(garment_sections)-1):
    for i in range(96):
        a=j*96+i;b=j*96+(i+1)%96
        quads.append((a,b,b+96,a+96))
mesh_obj('Ivory_shoulder_silk',verts,quads,cloth,subdiv=2)


def collar_strip(name,points,width,mat):
    verts,faces=[],[]
    count=48
    for j in range(count+1):
        t=j/count;p=catmull(points,t)
        tangent=(catmull(points,min(1,t+.01))-catmull(points,max(0,t-.01))).normalized()
        across=Vector((-tangent.z,0,tangent.x)).normalized()
        for side in (-1,1):
            v=p+across*width*side*.5
            verts.append(tuple(v))
    for j in range(count):
        faces.append((j*2,j*2+1,j*2+3,j*2+2))
    ob=mesh_obj(name,verts,faces,mat)
    mod=ob.modifiers.new('Silk lining','SOLIDIFY');mod.thickness=.008
    return ob


collar_strip('Cross_collar_under',[(.19,-.02,1.23),(.31,-.16,1.08),(.17,-.237,.83),(-.19,-.24,.53)],.115,jade_dark)
collar_strip('Cross_collar_over',[(-.19,-.03,1.24),(-.32,-.17,1.08),(-.16,-.258,.82),(.24,-.25,.49)],.12,jade_dark)
curve_obj('Collar_gold_piping',[(-.23,-.041,1.23),(-.36,-.18,1.07),(-.20,-.266,.81),(.21,-.263,.46)],.0028,gold)
curve_obj('Collar_ivory_piping',[(-.16,-.045,1.23),(-.28,-.181,1.08),(-.12,-.267,.83),(.28,-.263,.52)],.004,cloth)
for i in range(3):
    z=.66-i*.10
    curve_obj('Silk_frog_loop_'+str(i),[(.18,-.256,z),(.21,-.263,z+.013),(.24,-.258,z),(.21,-.263,z-.013),(.18,-.256,z)],.004,jade_dark)
    ellipsoid('Frog_button_'+str(i),(.16,-.26,z),(.009,.008,.009),gold,16,8)

# Low celadon presentation base, separate from the character export.
verts,faces=[],[]
for z,r in ((.015,.78),(.035,.80),(.075,.80),(.10,.76)):
    for i in range(96):
        a=2*math.pi*i/96
        verts.append((r*math.cos(a),r*.51*math.sin(a)+.08,z))
for j in range(3):
    for i in range(96):
        a=j*96+i;b=j*96+(i+1)%96
        faces.append((a,b,b+96,a+96))
faces.append(tuple(3*96+i for i in range(96)))
mesh_obj('Presentation_base',verts,faces,base_mat,studio)

# Neutral portrait lighting and three actual cameras.
world=bpy.data.worlds.new(PREFIX+'Neutral_world')
world.use_nodes=True
world.node_tree.nodes['Background'].inputs['Color'].default_value=(.55,.58,.56,1)
world.node_tree.nodes['Background'].inputs['Strength'].default_value=.35
scene.world=world


def area_light(name,pos,energy,size,color):
    data=bpy.data.lights.new(PREFIX+name,'AREA')
    data.energy=energy;data.shape='DISK';data.size=size;data.color=color
    ob=bpy.data.objects.new(PREFIX+name,data);studio.objects.link(ob);ob.location=pos
    ob.rotation_euler=(Vector((0,0,1.8))-ob.location).to_track_quat('-Z','Y').to_euler()
    return ob


area_light('Key_softbox',(-3.2,-4.2,5.3),460,3.0,(1,.94,.88))
area_light('Fill_softbox',(3.2,-2.2,3.0),250,3.0,(.90,.96,1))
area_light('Hair_rim',(1.0,2.7,4.3),530,2.3,(1,.97,.91))
# A very large background plane, not a painted character image.
backdrop_mat=material('Studio_backdrop','#dce0d8',1)
mesh_obj('Backdrop',[(-200,2.0,-100),(200,2.0,-100),(200,2.0,100),(-200,2.0,100)],[(0,1,2,3)],backdrop_mat,studio)
cameras={}
for name,pos in [('Front',(0,-7.5,1.73)),('ThreeQuarter',(4.5,-6.3,1.95)),('Side',(7.5,-.15,1.87))]:
    data=bpy.data.cameras.new(PREFIX+name)
    data.type='ORTHO';data.ortho_scale=3.15;data.lens=85
    ob=bpy.data.objects.new(PREFIX+'Camera_'+name,data);studio.objects.link(ob);ob.location=pos
    ob.rotation_euler=(Vector((0,0,1.47))-ob.location).to_track_quat('-Z','Y').to_euler()
    cameras[name]=ob
scene.camera=cameras['ThreeQuarter']
scene.render.engine='BLENDER_EEVEE'
scene.render.resolution_x=960;scene.render.resolution_y=1120;scene.render.resolution_percentage=100
scene.render.image_settings.file_format='PNG'
scene.render.image_settings.color_mode='RGBA'
scene.render.film_transparent=False
scene.view_settings.view_transform='AgX'
scene.render.filepath=str(OUT/'three-quarter.png')
scene['review_status']='Draft: user visual review required; not a finished or rigged game character'
scene['design']='Qingheng: side-parted half-up dark hair, ivory/jade cross collar, restrained gold and jade details'
scene['source']='Authored geometry from tools/blender/build-qingheng-head-v1.py; no imported character mesh'
scene['review_output']=str(OUT)
scene['export_path']=str(WEB/'qingheng-head-study-v1.glb')
scene['original_scene_preserved']='Scene'

# Make the Blender project open directly on the portrait without touching the original scene.
for window in bpy.context.window_manager.windows:
    if window.scene==scene:
        for area in window.screen.areas:
            if area.type=='VIEW_3D':
                space=area.spaces.active
                space.region_3d.view_perspective='CAMERA'
                space.shading.type='MATERIAL'
                space.overlay.show_overlays=False
# Save before any render/export so a later failure does not lose the editable study.
bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'qingheng-head-v1.blend'))
mesh_count=sum(1 for ob in collection.objects if ob.type=='MESH')
curve_count=sum(1 for ob in collection.objects if ob.type=='CURVE')
result={
    'scene':scene.name,'file':bpy.data.filepath,'mesh_objects':mesh_count,'curve_objects':curve_count,
    'original_scene_objects':[ob.name for ob in bpy.data.scenes['Scene'].objects],
    'cameras':{name:ob.name for name,ob in cameras.items()},
    'status':'Draft geometry saved; renders and browser export pending',
}
(OUT/'build-report.json').write_text(json.dumps(result,indent=2))
