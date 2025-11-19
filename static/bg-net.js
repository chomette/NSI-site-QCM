// Constellation 
const canvasBG = document.getElementById('net-bg');
const ctxBG = canvasBG.getContext('2d', { alpha: true });

let VW = 0, VH = 0;
let pts = [];
let mouse = { x: null, y: null, inside: false };

// ====== PARAMS ======
const BASE_POINTS      = 888;     // points init un peu partout
const POINT_RADIUS     = [1.0, 1.8];
const DRIFT_SPEED      = 0.055;   // drift doux
const MOUSE_LINK_R     = 90;      // petit rayon autour de la souris
const LINE_OPACITY_MAX = 0.65;    // opacité max des lignes (soft)
const POINT_CORE_ALPHA = 0.8;
const HALO_ALPHA       = 0.18;
// =====================

function resizeBG(){
  const dpr = window.devicePixelRatio || 1;
  VW = Math.max(document.documentElement.clientWidth, window.innerWidth || 0);
  VH = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);
  canvasBG.width  = Math.floor(VW * dpr);
  canvasBG.height = Math.floor(VH * dpr);
  canvasBG.style.width  = VW + 'px';
  canvasBG.style.height = VH + 'px';
  ctxBG.setTransform(dpr, 0, 0, dpr, 0, 0);
}
resizeBG();
window.addEventListener('resize', resizeBG);

const rand = (a,b)=> Math.random()*(b-a)+a;
const clamp = (v,a,b)=> Math.max(a, Math.min(b, v));

function seedBG(){
  pts = [];
  for (let i = 0; i < BASE_POINTS; i++){
    const ang = Math.random()*Math.PI*2;
    const spd = DRIFT_SPEED*rand(0.4,1.2);
    pts.push({
      x: rand(0, VW), y: rand(0, VH),
      vx: Math.cos(ang)*spd, vy: Math.sin(ang)*spd,
      r: rand(POINT_RADIUS[0], POINT_RADIUS[1]),
      tw: rand(0, Math.PI*2)
    });
  }
}
seedBG();

// on écoute la souris sur la fenêtre
window.addEventListener('mousemove', (e)=>{
  mouse.x = e.clientX;
  mouse.y = e.clientY;
  mouse.inside = true;
});
window.addEventListener('mouseleave', ()=>{
  mouse.inside = false; mouse.x = mouse.y = null;
});
window.addEventListener('touchmove', (e)=>{
  const t = e.touches[0];
  if (!t) return;
  mouse.x = t.clientX;
  mouse.y = t.clientY;
  mouse.inside = true;
},{passive:true});
window.addEventListener('touchend', ()=>{
  mouse.inside = false; mouse.x = mouse.y = null;
},{passive:true});

function drawPoint(p, t){
  // halo léger
  ctxBG.fillStyle = `rgba(168,199,255,${HALO_ALPHA})`;
  ctxBG.beginPath();
  ctxBG.arc(p.x, p.y, p.r*3, 0, Math.PI*2);
  ctxBG.fill();
  // noyau
  const pulse = 0.85 + 0.25*Math.sin(t*0.002 + p.tw);
  ctxBG.fillStyle = `rgba(255,255,255,${POINT_CORE_ALPHA})`;
  ctxBG.beginPath();
  ctxBG.arc(p.x, p.y, p.r*pulse, 0, Math.PI*2);
  ctxBG.fill();
}

function frame(t){
  // --- FIX couture DPR ---
  ctxBG.save();
  ctxBG.setTransform(1,0,0,1,0,0);
  ctxBG.clearRect(0,0,canvasBG.width,canvasBG.height);
  ctxBG.restore();
  // ------------------------

  // update + wrap
  for (let p of pts){
    p.x += p.vx; p.y += p.vy;
    if (p.x < -10) p.x = VW+10; else if (p.x > VW+10) p.x = -10;
    if (p.y < -10) p.y = VH+10; else if (p.y > VH+10) p.y = -10;
  }

  // lignes vers la souris uniquement (petit rayon)
  if (mouse.inside && mouse.x != null){
    ctxBG.lineWidth = 1;
    for (let p of pts){
      const dx = p.x - mouse.x, dy = p.y - mouse.y;
      const d2 = dx*dx + dy*dy;
      if (d2 < MOUSE_LINK_R*MOUSE_LINK_R){
        const d = Math.sqrt(d2);
        const a = (1 - d / MOUSE_LINK_R) * LINE_OPACITY_MAX;
        ctxBG.strokeStyle = `rgba(255,255,255,${a})`;
        ctxBG.beginPath();
        ctxBG.moveTo(p.x, p.y);
        ctxBG.lineTo(mouse.x, mouse.y);
        ctxBG.stroke();
      }
    }
  }

  // points
  for (let p of pts) drawPoint(p, t);

  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

// Perf: reseed quand on revient d'un onglet caché
document.addEventListener('visibilitychange', ()=>{
  if (!document.hidden){ resizeBG(); seedBG(); }
});
