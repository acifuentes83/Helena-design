import json,struct,os
# Minimal valid GLB: a stylized burgundy bag body (box) for Helena Design
verts=[(-.8,-.12,-.6),(.8,-.12,-.6),(.8,.12,-.6),(-.8,.12,-.6),(-.8,-.12,.6),(.8,-.12,.6),(.8,.12,.6),(-.8,.12,.6)]
idx=[0,1,2,0,2,3,4,6,5,4,7,6,0,4,5,0,5,1,3,2,6,3,6,7,1,5,6,1,6,2,0,3,7,0,7,4]
bin0=b''.join(struct.pack('<3f',*v) for v in verts)+b''.join(struct.pack('<H',i) for i in idx)
while len(bin0)%4: bin0+=b'\0'
g={"asset":{"version":"2.0","generator":"Helena Design"},"scene":0,"scenes":[{"nodes":[0]}],"nodes":[{"mesh":0}],"meshes":[{"primitives":[{"attributes":{"POSITION":0},"indices":1,"material":0}]}],"materials":[{"pbrMetallicRoughness":{"baseColorFactor":[.55,.05,.23,1],"metallicFactor":0,"roughnessFactor":.9}}],"buffers":[{"byteLength":len(bin0)}],"bufferViews":[{"buffer":0,"byteOffset":0,"byteLength":len(verts)*12,"target":34962},{"buffer":0,"byteOffset":len(verts)*12,"byteLength":len(idx)*2,"target":34963}],"accessors":[{"bufferView":0,"componentType":5126,"count":len(verts),"type":"VEC3","min":[-.8,-.12,-.6],"max":[.8,.12,.6]},{"bufferView":1,"componentType":5123,"count":len(idx),"type":"SCALAR","min":[0],"max":[7]}]}
js=json.dumps(g,separators=(',',':')).encode()
while len(js)%4: js+=b' '
total=12+8+len(js)+8+len(bin0)
out=struct.pack('<4sII',b'glTF',2,total)+struct.pack('<I4s',len(js),b'JSON')+js+struct.pack('<I4s',len(bin0),b'BIN\0')+bin0
os.makedirs('assets/models',exist_ok=True)
open('assets/models/helena-floral-approx.glb','wb').write(out)
print('GLB',len(out),'bytes')
