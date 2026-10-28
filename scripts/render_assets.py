"""Render the original, local demo visuals. No external asset requests are needed."""
from pathlib import Path
import math
import subprocess
import sys
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'public' / 'images'
OUT.mkdir(parents=True, exist_ok=True)
W, H = 1100, 980
S = 1.25

def rotation(x, y, z):
    cx, sx, cy, sy, cz, sz = math.cos(x), math.sin(x), math.cos(y), math.sin(y), math.cos(z), math.sin(z)
    return np.array([[cz,-sz,0],[sz,cz,0],[0,0,1]]) @ np.array([[cy,0,sy],[0,1,0],[-sy,0,cy]]) @ np.array([[1,0,0],[0,cx,-sx],[0,sx,cx]])

def curve(t):
    return np.stack(((2+np.cos(3*t))*np.cos(2*t), (2+np.cos(3*t))*np.sin(2*t), np.sin(3*t)), axis=-1)

N, M = 320, 128
t = np.arange(N) * 2*math.pi/N
center = curve(t)
tangent = curve(t+.001)-curve(t-.001)
tangent /= np.linalg.norm(tangent,axis=1)[:,None]
up = np.cross(tangent, np.array([0,0,1]))
up /= np.linalg.norm(up,axis=1)[:,None]
side = np.cross(tangent, up)
a = np.arange(M)*2*math.pi/M
normals = up[:,None,:]*np.cos(a)[None,:,None]+side[:,None,:]*np.sin(a)[None,:,None]
vertices = center[:,None,:]+.47*normals
faces = np.array([[i*M+j,((i+1)%N)*M+j,((i+1)%N)*M+(j+1)%M,i*M+(j+1)%M] for i in range(N) for j in range(M)])

def frame(phase):
    matrix = rotation(.8+.08*math.sin(phase), -.45+.2*math.cos(phase), -.45+.08*math.sin(phase))
    points = vertices.reshape(-1,3) @ matrix.T
    norms = normals.reshape(-1,3) @ matrix.T
    camera = np.array([0,0,10]) - points
    camera /= np.linalg.norm(camera,axis=1)[:,None]
    reflection = 2*np.sum(norms*camera,axis=1)[:,None]*norms-camera
    rx,ry,rz = reflection.T
    studio = .045 + 1.15*np.exp(-((ry-.50)/.26)**6) + .75*np.exp(-((rx+.55)/.13)**4) + .42*np.exp(-((ry+.62)/.085)**2)
    fresnel = (1-np.clip(np.sum(norms*camera,axis=1),0,1))**3
    light = np.clip(studio + .16*fresnel,0,1)
    colors = np.clip(np.stack((light*.95, light*.98, light*1.03),axis=1)*255,0,255)
    scale = 132*9/(9-points[:,2])
    xy = np.stack((W*.5+points[:,0]*scale,H*.5-points[:,1]*scale),axis=1)*S
    face_z = points[faces,2].mean(axis=1)
    face_n = norms[faces].mean(axis=1)
    face_c = colors[faces].mean(axis=1).astype(np.uint8)
    img = Image.new('RGB',(int(W*S),int(H*S)),(16,17,16))
    draw=ImageDraw.Draw(img)
    for k in np.argsort(face_z):
        if face_n[k,2] > -.2:
            draw.polygon([tuple(p) for p in xy[faces[k]]],fill=tuple(face_c[k]))
    return img.resize((W,H),Image.Resampling.LANCZOS)

poster = frame(0)
poster.save(OUT/'chrome-knot.webp',quality=94)
print('Poster created.',flush=True)
if len(sys.argv)>1:
    video = ROOT/'public'/'video'
    video.mkdir(exist_ok=True)
    proc = subprocess.Popen([sys.argv[1],'-loglevel','error','-y','-f','rawvideo','-pixel_format','rgb24','-video_size',f'{W}x{H}','-framerate','24','-i','-','-an','-c:v','libx264','-preset','fast','-crf','23','-pix_fmt','yuv420p','-movflags','+faststart',str(video/'chrome-loop.mp4')],stdin=subprocess.PIPE,stdout=subprocess.DEVNULL,stderr=subprocess.PIPE)
    for f in range(120):
        proc.stdin.write(frame(2*math.pi*f/120).tobytes())
        if f%24==0: print(f'Rendered {f}/120 frames.',flush=True)
    proc.stdin.close()
    error = proc.stderr.read().decode(errors='replace')
    result=proc.wait()
    if result: raise RuntimeError(error)
    print('Video created.',flush=True)

# An abstract, locally rendered scene for the AI art demo project.
AW,AH = 1400,1050
xx,yy=np.meshgrid(np.linspace(0,1,AW),np.linspace(0,1,AH))
base=np.zeros((AH,AW,3))
glow=np.exp(-((xx-.6)**2/.12+(yy-.50)**2/.13))
base[:]=np.array([17,23,26])[None,None,:]+glow[:,:,None]*np.array([51,61,63])
scene=Image.fromarray(np.uint8(np.clip(base,0,255)))
d=ImageDraw.Draw(scene)
for i in range(32):
    x=400+i*17
    y=190+i*9
    shade=int(200-i*3)
    d.rounded_rectangle((x,y,x+280,y+510),radius=140,outline=(shade,int(shade*1.02),min(255,int(shade*1.05))),width=6)
    d.line((x+140,y+510,x+140,y+720),fill=(35,43,44),width=1)
for i in range(20):
    y=720+i*i*.75
    d.line((0,y,AW,y),fill=(41,48,49),width=1)
scene.save(OUT/'liminal.webp',quality=94)
print('Scene created.',flush=True)
