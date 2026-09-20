import { PoseLandmarker, FilesetResolver } from 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.22/+esm';
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
let cart=JSON.parse(localStorage.getItem('helena-cart')||'[]');
function renderCart(){$('#cartCount').textContent=cart.length;$('#cartItems').innerHTML=cart.length?cart.map((x,i)=>`<div class="cartItem"><b>${x}</b><button class="close" data-rm="${i}">×</button></div>`).join(''):'<p>Aún no agregas piezas.</p>';$$('[data-rm]').forEach(b=>b.onclick=()=>{cart.splice(+b.dataset.rm,1);save()})}
function save(){localStorage.setItem('helena-cart',JSON.stringify(cart));renderCart()} renderCart();
const openCart=()=>{$('#cart').classList.add('open');$('#shade').classList.add('open')},closeCart=()=>{$('#cart').classList.remove('open');$('#shade').classList.remove('open')};
$$('.add').forEach(b=>b.onclick=()=>{cart.push(b.dataset.product);save();openCart()});$('#openCart').onclick=openCart;$('#closeCart').onclick=closeCart;$('#shade').onclick=closeCart;

let stream,landmarker,raf,lastVideoTime=-1,side=1,scale=1,currentBag='assets/images/bolso-carmesi.svg';
const video=$('#video'),canvas=$('#overlay'),ctx=canvas.getContext('2d'),bagImg=new Image();
bagImg.decoding='async';
function setBag(src){currentBag=src||currentBag;bagImg.src=currentBag}
setBag(currentBag);

async function createPose(){
 const vision=await FilesetResolver.forVisionTasks('https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.22/wasm');
 const opts={baseOptions:{modelAssetPath:'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task',delegate:'GPU'},runningMode:'VIDEO',numPoses:1,minPoseDetectionConfidence:.5,minPosePresenceConfidence:.5,minTrackingConfidence:.5};
 try{return await PoseLandmarker.createFromOptions(vision,opts)}catch(e){opts.baseOptions.delegate='CPU';return await PoseLandmarker.createFromOptions(vision,opts)}
}
async function startAR(ev){
 setBag(ev?.currentTarget?.dataset?.bag);
 $('#arModal').classList.add('open');document.body.classList.add('ar-open');$('#arMsg').textContent='Solicitando permiso para la cámara…';
 try{
  if(!navigator.mediaDevices?.getUserMedia)throw new Error('camera unsupported');
  stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:'user',width:{ideal:1280},height:{ideal:960}},audio:false});
  video.srcObject=stream;await video.play();$('#arMsg').textContent='Cargando detección corporal…';landmarker=await createPose();$('#arMsg').textContent='Aléjate un poco para mostrar hombros y cintura';loop();
 }catch(e){console.error(e);$('#arMsg').textContent='No pudimos abrir la cámara. Permite Cámara para este sitio y vuelve a intentarlo.'}
}
function drawBag(p){
 const L=p[11],R=p[12],LH=p[23],RH=p[24]; if(!L||!R||!LH||!RH)return;
 const W=canvas.width,H=canvas.height;
 const shoulder=Math.hypot((L.x-R.x)*W,(L.y-R.y)*H);
 const torso=Math.hypot((((L.x+R.x)-(LH.x+RH.x))/2)*W,(((L.y+R.y)-(LH.y+RH.y))/2)*H);
 const anchor=side>0?L:R;
 const x=anchor.x*W + side*shoulder*.40;
 const y=anchor.y*H + torso*.60;
 const w=Math.max(150,shoulder*1.28*scale);
 const ratio=(bagImg.naturalHeight||1)/(bagImg.naturalWidth||1);
 const h=w*Math.min(1.35,Math.max(.75,ratio));
 const ang=Math.atan2((L.y-R.y)*H,(L.x-R.x)*W)*.38;
 ctx.save();ctx.translate(x,y);ctx.rotate(ang);ctx.globalAlpha=.97;
 ctx.shadowColor='rgba(0,0,0,.28)';ctx.shadowBlur=22;ctx.shadowOffsetY=12;
 if(bagImg.complete&&bagImg.naturalWidth)ctx.drawImage(bagImg,-w/2,-h*.18,w,h);
 ctx.restore();
}
function loop(){
 if(!landmarker||!stream)return;
 if(video.readyState>=2){
  if(canvas.width!==video.videoWidth||canvas.height!==video.videoHeight){canvas.width=video.videoWidth;canvas.height=video.videoHeight}
  ctx.clearRect(0,0,canvas.width,canvas.height);
  if(video.currentTime!==lastVideoTime){lastVideoTime=video.currentTime;const r=landmarker.detectForVideo(video,performance.now()),p=r.landmarks?.[0];if(p){drawBag(p);$('#arMsg').textContent='Bolso posicionado · muévete para verlo en tiempo real'}else $('#arMsg').textContent='Muestra hombros y cintura completos a la cámara'}
 }
 raf=requestAnimationFrame(loop);
}
function stopAR(){cancelAnimationFrame(raf);raf=null;stream?.getTracks().forEach(t=>t.stop());stream=null;try{landmarker?.close()}catch{}landmarker=null;lastVideoTime=-1;ctx.clearRect(0,0,canvas.width,canvas.height);video.srcObject=null;$('#arModal').classList.remove('open');document.body.classList.remove('ar-open')}
$$('[data-ar]').forEach(b=>b.addEventListener('click',startAR));$('#closeAr').onclick=stopAR;$('#stopBtn').onclick=stopAR;$('#sideBtn').onclick=()=>side*=-1;$('#sizeRange').oninput=e=>scale=+e.target.value/100;
document.addEventListener('visibilitychange',()=>{if(document.hidden&&stream)stopAR()});