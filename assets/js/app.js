import { PoseLandmarker, FilesetResolver } from 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.22/+esm';
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
let cart=JSON.parse(localStorage.getItem('helena-cart')||'[]');
function renderCart(){$('#cartCount').textContent=cart.length;$('#cartItems').innerHTML=cart.length?cart.map((x,i)=>`<div class="cartItem"><b>${x}</b><button class="close" data-rm="${i}">×</button></div>`).join(''):'<p>Aún no agregas piezas.</p>';$$('[data-rm]').forEach(b=>b.onclick=()=>{cart.splice(+b.dataset.rm,1);save()})}
function save(){localStorage.setItem('helena-cart',JSON.stringify(cart));renderCart()} renderCart();
$$('.add').forEach(b=>b.onclick=()=>{cart.push(b.dataset.product);save();openCart()});
const openCart=()=>{$('#cart').classList.add('open');$('#shade').classList.add('open')},closeCart=()=>{$('#cart').classList.remove('open');$('#shade').classList.remove('open')};
$('#openCart').onclick=openCart;$('#closeCart').onclick=closeCart;$('#shade').onclick=closeCart;

let stream,landmarker,raf,side=1,scale=1,currentBag='carmesi',lastPose=null;
const video=$('#video'),canvas=$('#overlay'),ctx=canvas.getContext('2d'),bag=$('#arBag'),msg=$('#arMsg');
const bags={carmesi:'assets/images/bolso-carmesi.svg',lavanda:'assets/images/bolso-lavanda.svg'};

async function startAR(ev){
 currentBag=ev.currentTarget.dataset.bag||'carmesi'; bag.src=bags[currentBag]; scale=1;
 $('#arModal').classList.add('open'); msg.textContent='Solicitando acceso a la cámara…';
 try{
   if(!navigator.mediaDevices?.getUserMedia) throw new Error('camera unavailable');
   stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:'user',width:{ideal:1280},height:{ideal:960}},audio:false});
   video.srcObject=stream; await video.play();
   msg.textContent='Cargando seguimiento corporal…';
   const vision=await FilesetResolver.forVisionTasks('https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.22/wasm');
   try{landmarker=await PoseLandmarker.createFromOptions(vision,{baseOptions:{modelAssetPath:'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task',delegate:'GPU'},runningMode:'VIDEO',numPoses:1,minPoseDetectionConfidence:.55,minTrackingConfidence:.55});}
   catch(e){landmarker=await PoseLandmarker.createFromOptions(vision,{baseOptions:{modelAssetPath:'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task',delegate:'CPU'},runningMode:'VIDEO',numPoses:1});}
   msg.textContent='Aléjate un poco para mostrar hombros y cintura'; loop();
 }catch(e){console.error(e);msg.textContent='No se pudo abrir la cámara. Permite el acceso en el navegador.'}
}
function mapPoint(p){return{x:(1-p.x)*video.clientWidth,y:p.y*video.clientHeight}}
function updateBag(p){
 const L=mapPoint(p[11]),R=mapPoint(p[12]),LH=mapPoint(p[23]),RH=mapPoint(p[24]);
 const shoulder=Math.hypot(L.x-R.x,L.y-R.y), torso=Math.hypot((L.x+R.x-LH.x-RH.x)/2,(L.y+R.y-LH.y-RH.y)/2);
 if(shoulder<45||torso<60)return;
 const anchor=side>0?R:L;
 const dir=side>0?1:-1;
 const w=Math.max(150,Math.min(video.clientWidth*.62,shoulder*1.62*scale));
 const h=w*1.02;
 const x=anchor.x+dir*shoulder*.42-w/2;
 const y=anchor.y+torso*.28;
 const angle=Math.atan2(R.y-L.y,R.x-L.x)*.32;
 bag.style.width=w+'px';bag.style.height=h+'px';bag.style.left=x+'px';bag.style.top=y+'px';
 bag.style.transform=`rotate(${angle}rad)`;
 bag.style.opacity='1'; msg.textContent='Muévete lentamente · el bolso sigue tu hombro';
}
async function loop(){
 if(!landmarker||video.readyState<2){raf=requestAnimationFrame(loop);return}
 canvas.width=video.clientWidth;canvas.height=video.clientHeight;ctx.clearRect(0,0,canvas.width,canvas.height);
 try{const res=landmarker.detectForVideo(video,performance.now()),p=res.landmarks?.[0];if(p){lastPose=p;updateBag(p)}else{bag.style.opacity='.15';msg.textContent='Muestra hombros y cintura frente a la cámara'}}catch(e){}
 raf=requestAnimationFrame(loop);
}
function stopAR(){cancelAnimationFrame(raf);stream?.getTracks().forEach(t=>t.stop());stream=null;landmarker?.close?.();landmarker=null;bag.style.opacity='0';$('#arModal').classList.remove('open')}
$$('[data-ar]').forEach(b=>b.onclick=startAR);
$('#closeAr').onclick=stopAR;$('#stopBtn').onclick=stopAR;
$('#sideBtn').onclick=()=>{side*=-1;if(lastPose)updateBag(lastPose)};
$('#sizeDown').onclick=()=>{scale=Math.max(.65,scale-.1);if(lastPose)updateBag(lastPose)};
$('#sizeUp').onclick=()=>{scale=Math.min(1.45,scale+.1);if(lastPose)updateBag(lastPose)};
document.addEventListener('visibilitychange',()=>{if(document.hidden&&stream)stopAR()});
