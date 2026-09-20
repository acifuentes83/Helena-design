const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
let cart=JSON.parse(localStorage.getItem('helena-cart')||'[]'),stream=null,raf=null,side=1,scale=1,pose=null,visionReady=false,currentBag='assets/images/bolso-carmesi.svg';
const video=$('#video'),canvas=$('#overlay'),ctx=canvas.getContext('2d'),bagImg=new Image(); bagImg.crossOrigin='anonymous';
function renderCart(){$('#cartCount').textContent=cart.length;$('#cartItems').innerHTML=cart.length?cart.map((x,i)=>`<div class="cartItem"><b>${x}</b><button class="close" data-rm="${i}">×</button></div>`).join(''):'<p>Aún no agregas piezas.</p>';$$('[data-rm]').forEach(b=>b.onclick=()=>{cart.splice(+b.dataset.rm,1);localStorage.setItem('helena-cart',JSON.stringify(cart));renderCart()})}renderCart();
const openCart=()=>{$('#cart').classList.add('open');$('#shade').classList.add('open')},closeCart=()=>{$('#cart').classList.remove('open');$('#shade').classList.remove('open')};$$('.add').forEach(b=>b.onclick=()=>{cart.push(b.dataset.product);localStorage.setItem('helena-cart',JSON.stringify(cart));renderCart();openCart()});$('#openCart').onclick=openCart;$('#closeCart').onclick=closeCart;$('#shade').onclick=closeCart;
function setBag(src){currentBag=src||currentBag;bagImg.src=new URL(currentBag,document.baseURI).href}
setBag(currentBag);
function showAR(msg){$('#arModal').classList.add('open');document.body.classList.add('ar-open');$('#arMsg').textContent=msg}
async function ensureVision(){
 if(visionReady)return;
 $('#arMsg').textContent='Cargando seguimiento corporal…';
 const mod=await import('https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.22/+esm');
 const vision=await mod.FilesetResolver.forVisionTasks('https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.22/wasm');
 pose=await mod.PoseLandmarker.createFromOptions(vision,{baseOptions:{modelAssetPath:'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task'},runningMode:'VIDEO',numPoses:1,minPoseDetectionConfidence:.45,minTrackingConfidence:.45});
 visionReady=true;
}
async function startAR(e){
 setBag(e.currentTarget.dataset.bag);showAR('Abriendo cámara…');
 try{
  if(!window.isSecureContext)throw new Error('La cámara requiere HTTPS.');
  if(!navigator.mediaDevices?.getUserMedia)throw new Error('Este navegador no permite acceso a cámara.');
  stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:{ideal:'user'},width:{ideal:1280},height:{ideal:960}},audio:false});
  video.srcObject=stream;await video.play();$('#arMsg').textContent='Cámara activa · cargando detección…';
  try{await ensureVision();loop()}catch(err){console.error('MediaPipe',err);$('#arMsg').textContent='Cámara activa · modo manual';manualLoop()}
 }catch(err){console.error('Camera',err);$('#arMsg').textContent=(err.name==='NotAllowedError'?'Permiso de cámara bloqueado. Habilítalo en Chrome → Configuración del sitio → Cámara.':err.message||'No se pudo abrir la cámara.')}
}
function drawAt(x,y,w,angle=0){const h=w*((bagImg.naturalHeight||1)/(bagImg.naturalWidth||1));ctx.save();ctx.translate(x,y);ctx.rotate(angle);ctx.shadowColor='#0007';ctx.shadowBlur=20;ctx.shadowOffsetY=10;if(bagImg.complete&&bagImg.naturalWidth)ctx.drawImage(bagImg,-w/2,-h*.18,w,h);ctx.restore()}
function prep(){if(canvas.width!==video.videoWidth||canvas.height!==video.videoHeight){canvas.width=video.videoWidth;canvas.height=video.videoHeight}ctx.clearRect(0,0,canvas.width,canvas.height)}
function manualLoop(){if(!stream)return;prep();drawAt(canvas.width*(side>0?.68:.32),canvas.height*.48,canvas.width*.32*scale);raf=requestAnimationFrame(manualLoop)}
function loop(){if(!stream||!pose)return;prep();if(video.readyState>=2){try{const r=pose.detectForVideo(video,performance.now()),p=r.landmarks?.[0];if(p){const L=p[11],R=p[12],LH=p[23],RH=p[24],W=canvas.width,H=canvas.height,sh=Math.hypot((L.x-R.x)*W,(L.y-R.y)*H),tor=Math.hypot(((L.x+R.x-LH.x-RH.x)/2)*W,((L.y+R.y-LH.y-RH.y)/2)*H),a=side>0?L:R;drawAt(a.x*W+side*sh*.42,a.y*H+tor*.55,sh*1.22*scale,Math.atan2((L.y-R.y)*H,(L.x-R.x)*W)*.3);$('#arMsg').textContent='AR activa · bolso siguiendo tu hombro'}else $('#arMsg').textContent='Muestra hombros y cintura completos'}catch(err){console.error(err)}}raf=requestAnimationFrame(loop)}
function stopAR(){if(raf)cancelAnimationFrame(raf);raf=null;stream?.getTracks().forEach(t=>t.stop());stream=null;video.srcObject=null;ctx.clearRect(0,0,canvas.width,canvas.height);$('#arModal').classList.remove('open');document.body.classList.remove('ar-open')}
$$('[data-ar]').forEach(b=>b.addEventListener('click',startAR));$('#closeAr').onclick=stopAR;$('#stopBtn').onclick=stopAR;$('#sideBtn').onclick=()=>side*=-1;$('#sizeRange').oninput=e=>scale=+e.target.value/100;