/* GRIT — creature.js  (gesplitst uit index.html, gedrag ongewijzigd) */
/* =====================================================
   PIXEL ENGINE — 160x144, 4 tinten, deep space
===================================================== */
/* STAR PUP — zwevend zero-g wezentje, 3 fases
   . transparant, 0..3 palettint, E oog */

const SC={cv:null,ctx:null,t:0,raf:null,comet:null};
function px(x,y,w,h,c){SC.ctx.fillStyle=c;SC.ctx.fillRect(x|0,y|0,w,h)}
/* Scenepalet per thema: dezelfde sprites, ander 'lab-milieu'.
   tama = speelse kleurvarianten, dmg = originele groenen (uit creature.json),
   bw = grijstinten, hyrox = neutraal + accent. Zo hertekenen we niets. */
const THEME_SCENE={
  tama:[['#3a2e58','#5a4a8c','#9d8ad1','#ffd9f0'],
        ['#4a2d14','#8a5a24','#d19a4a','#ffe9b0'],
        ['#1e3a52','#3a6a8c','#6fb3d1','#d9f2ff']],
  bw:  [['#1c1c1c','#3d3d3d','#8a8a8a','#e8e8e8'],
        ['#1c1c1c','#3d3d3d','#8a8a8a','#e8e8e8'],
        ['#1c1c1c','#3d3d3d','#8a8a8a','#e8e8e8']],
  hyrox:[['#15171c','#2b2f38','#6a7180','#ffd21f'],
         ['#15171c','#2b2f38','#6a7180','#ffd21f'],
         ['#15171c','#2b2f38','#6a7180','#ffd21f']]
};
function palFor(variant){
  const th=(S&&S.theme)||'tama';
  return (THEME_SCENE[th]&&THEME_SCENE[th][variant])||PALETTES[variant];
}
function pal(){return palFor(S?S.creature.variant:0)}
function drawSprite(grid,ox,oy,P,blink){
  grid.forEach((row,y)=>{[...row].forEach((ch,x)=>{
    if(ch==='.')return;
    let c;
    if(ch==='E')c=blink?P[2]:P[0];
    else if(ch==='M')c=P[0];
    else c=P[+ch];
    px(ox+x,oy+y,1,1,c);
  })});
}
function drawItems(ox,oy,w,P,eq){
  eq.forEach(id=>{
    switch(id){
      case 'antenne':
        px(ox+w/2|0,oy-4,1,4,P[1]); px(ox+(w/2|0)-1,oy-6,3,2,P[3]); break;
      case 'visor':{
        const ey=oy+(w>=20?5:w>=14?4:4);
        px(ox+2,ey,w-4,2,P[0]); px(ox+3,ey,2,2,P[2]); px(ox+w-6,ey,2,2,P[2]); break;}
      case 'tank':
        px(ox-4,oy+(w/2|0),3,7,P[1]); px(ox-3,oy+(w/2|0)-2,1,2,P[3]); break;
      case 'band':
        px(ox+2,oy+2,w-4,2,P[1]); px(ox+3,oy+2,2,2,P[3]); break;
      case 'jet':
        px(ox-6,oy+(w/2|0)-2,4,9,P[1]); px(ox-5,oy+(w/2|0)-3,2,1,P[2]);
        px(ox-5,oy+(w/2|0)+7,2,2,P[3]); break;
      case 'halo':
        px(ox+3,oy-5,w-6,1,P[3]); px(ox+2,oy-4,1,1,P[3]); px(ox+w-3,oy-4,1,1,P[3]); break;
      case 'medal':
        px(ox+(w/2|0),oy+(w>=20?11:9),1,2,P[1]);
        px(ox+(w/2|0)-1,oy+(w>=20?13:11),3,3,P[3]); break;
    }
  });
}
/* ---- MOOD ----
   Het wezen reageert nu op je gedrag, niet alleen op XP:
   happy  = net gelogd (60s venster) -> hogere bob + sparkles
   sleepy = recovery < 40            -> trage bob, ogen vaker dicht
   focus  = taper actief (race <10d) -> race-blik, strakke houding
   Responsiviteit is de kern van het Tamagotchi-effect: jouw actie moet
   ZICHTBAAR iets veranderen bij het wezen. */
function mood(){
  if(!S) return 'ok';
  if(S.lastLogAt && Date.now()-S.lastLogAt<60000) return 'happy';
  if(typeof raceCountdown==='function'){
    const d=raceCountdown();
    if(d!==null && d>=0 && d<=10) return 'focus';
  }
  if(S.recovery<40) return 'sleepy';
  return 'ok';
}

/* ---- SPACESHIP INTERIEUR ---- */
function drawScene(){
  const P=pal(), t=SC.t;
  const W=160,H=144;
  SC.ctx.clearRect(0,0,W,H);
  /* == groot venster met de ruimte (y 6..62) == */
  px(0,0,W,H,P[1]);                       /* romp-basis */
  px(6,6,W-12,58,P[0]);                   /* venster: diepe ruimte */
  /* sterren (twinkelend) */
  [[16,14],[34,42],[52,20],[70,50],[88,12],[104,34],[122,46],[138,18],[26,28],[118,24],[62,36],[146,40]].forEach(([x,y],i)=>{
    if(((t>>5)+i)%6!==0)px(x,y,1,1,P[3]);
  });
  /* planeet rechts met ring */
  px(120,26,14,3,P[2]);px(118,29,18,3,P[2]);px(120,32,14,3,P[2]);
  px(122,24,10,2,P[1]);px(122,35,10,2,P[1]);
  px(112,30,6,1,P[1]);px(138,30,6,1,P[1]); /* ring */
  /* komeet: passeert af en toe */
  if(!motionOff()){
    if(!SC.comet&&t%420===0)SC.comet={x:W,y:12+Math.random()*30};
    if(SC.comet){
      SC.comet.x-=1.4; SC.comet.y+=.3;
      px(SC.comet.x,SC.comet.y,2,2,P[3]);
      px(SC.comet.x+3,SC.comet.y,4,1,P[2]);px(SC.comet.x+8,SC.comet.y,3,1,P[1]);
      if(SC.comet.x<0)SC.comet=null;
    }
  }
  /* vensterframe met klinknagels */
  px(0,0,W,6,P[1]);px(0,62,W,4,P[1]);px(0,0,6,66,P[1]);px(W-6,0,6,66,P[1]);
  px(2,2,2,2,P[2]);px(W-4,2,2,2,P[2]);px(2,62,2,2,P[2]);px(W-4,62,2,2,P[2]);
  for(let x=20;x<W-10;x+=24)px(x,63,2,2,P[2]);
  /* == romp-wand (y 66..H-16): panelen + leidingen == */
  px(0,66,W,H-66,P[1]);
  for(let x=0;x<W;x+=32)px(x,66,2,H-82,P[0]);       /* paneelnaden */
  px(0,74,W,2,P[0]);                                 /* leiding */
  for(let x=8;x<W;x+=32){px(x,70,2,2,P[2]);px(x+16,78,2,2,P[0])} /* klinknagels */
  /* console links */
  px(10,92,26,36,P[0]);
  px(13,96,20,10,P[1]);                              /* schermpje */
  px(15,98,(t>>3)%14+2,2,P[2]);                      /* lopende data */
  px(15,102,10,1,P[2]);
  const bl=(t>>4)%3;                                 /* knipperlichtjes */
  px(14,112,3,3,bl===0?P[3]:P[1]);px(20,112,3,3,bl===1?P[3]:P[1]);px(26,112,3,3,bl===2?P[3]:P[1]);
  px(14,120,16,2,P[1]);
  /* cryo-pod rechts */
  px(126,84,24,44,P[0]);
  px(129,88,18,28,P[1]);px(132,92,12,18,P[2]);       /* venster met gloed */
  px(135,96,4,6,P[3]);
  px(129,120,18,4,(t>>4)%2?P[2]:P[1]);               /* statusbalk pod */
  /* holo-flora item naast console */
  if(S&&S.equipped.includes('plant')){
    const fl=(t>>4)%2?P[3]:P[2];
    px(42,116,2,10,P[2]);px(39,118,8,2,fl);px(41,112,4,4,fl);
  }
  /* CORP-vlag: scene-item bij de cryo-pod */
  if(S&&S.equipped.includes('flag')){
    px(116,96,1,32,P[2]);
    const wv=motionOff()?0:(t>>4)%2;
    px(117,96+wv,7,4,P[3]);px(117,100+wv,5,2,P[2]);
  }
  /* == vloer: grating == */
  px(0,H-16,W,16,P[0]);
  for(let x=2;x<W;x+=10)px(x,H-14,6,2,P[1]);
  for(let x=6;x<W;x+=10)px(x,H-8,6,2,P[1]);
  /* anti-grav pad midden */
  px(58,H-16,44,3,P[2]);px(62,H-13,36,2,P[1]);
  /* == specimen: zweeft boven het pad == */
  const st=S?stage():1;
  const grid=SPRITES[st-1];
  const gw=grid[0].length, gh=grid.length;
  const md=mood();
  const bobAmp=md==='happy'?5:md==='sleepy'?1.5:3;
  const bobSpd=md==='happy'?14:md==='sleepy'?40:24;
  const bob=motionOff()?0:Math.round(Math.sin(t/bobSpd)*bobAmp);
  const gap=S&&S.lastActive?Math.floor((new Date(todayStr())-new Date(S.lastActive))/DAY):0;
  const blink=gap>=3||md==='sleepy'&&(t>>3)%8<3||((t>>3)%28===0);
  const ox=(W-gw)/2|0, oy=H-26-gh+bob;
  /* anti-grav gloed onder wezen */
  SC.ctx.globalAlpha=.5;
  const gl=(t>>3)%2?P[3]:P[2];
  px(ox+2,H-18,gw-4,2,gl);
  SC.ctx.globalAlpha=.25;
  px(ox+gw/2-3|0,H-24+bob/2,6,8,P[2]);
  SC.ctx.globalAlpha=1;
  drawSprite(grid,ox,oy,P,blink);
  if(S)drawItems(ox,oy,gw,P,S.equipped.filter(i=>i!=='flag'));
  /* happy: sparkles rond het wezen — de zichtbare beloning direct na loggen */
  if(md==='happy'&&!motionOff()){
    [[ox-6,oy+2],[ox+gw+4,oy+6],[ox-4,oy+gh-4],[ox+gw+6,oy-3]].forEach(([sx,sy],i)=>{
      if(((t>>3)+i)%3!==0)px(sx,sy+((t>>4)%2),1,1,P[3]);
    });
  }
  /* focus: race-glint in de ogen tijdens de taper */
  if(md==='focus'&&!blink){
    px(ox+(gw/2|0)-4,oy+(gh>=16?5:4),1,1,P[3]);
  }
  /* mini-drone companion */
  if(S&&S.equipped.includes('drone')){
    const dx=ox+gw+8, dy=oy+4+(motionOff()?0:Math.round(Math.sin(t/16)*3));
    px(dx,dy,6,4,P[2]);px(dx+2,dy-2,2,2,P[3]);px(dx+1,dy+1,1,1,P[0]);
  }
  SC.t++;
  SC.raf=requestAnimationFrame(drawScene);
}
function mountScene(){
  SC.cv=$('#scene'); if(!SC.cv)return;
  SC.cv.width=160;SC.cv.height=144;
  SC.ctx=SC.cv.getContext('2d');
  cancelAnimationFrame(SC.raf);
  if(motionOff()){drawScene();cancelAnimationFrame(SC.raf);}
  else drawScene();
}
function drawPreview(cv,variant,st,eq=[]){
  const ctx=cv.getContext('2d');cv.width=40;cv.height=40;
  const P=palFor(variant);
  const grid=SPRITES[st-1];
  const gw=grid[0].length,gh=grid.length;
  const old=SC.ctx;SC.ctx=ctx;
  ctx.fillStyle=P[1];ctx.fillRect(0,0,40,40);
  drawSprite(grid,(40-gw)/2|0,(40-gh)/2|0,P,false);
  drawItems((40-gw)/2|0,(40-gh)/2|0,gw,P,eq.filter(i=>i!=='plant'&&i!=='drone'&&i!=='flag'));
  if(eq.includes('drone')){ctx.fillStyle=P[2];ctx.fillRect(32,6,6,4);ctx.fillStyle=P[3];ctx.fillRect(34,4,2,2)}
  if(eq.includes('plant')){ctx.fillStyle=P[2];ctx.fillRect(4,30,2,8);ctx.fillRect(1,34,8,2)}
  SC.ctx=old;
}
function drawNavIcon(cv,key,active){
  const ctx=cv.getContext('2d');cv.width=7;cv.height=7;
  const c=active?'#cfe8a9':'#6fae5c';
  NAVICONS[key].forEach((row,y)=>[...row].forEach((ch,x)=>{if(ch!=='.'){ctx.fillStyle=c;ctx.fillRect(x,y,1,1)}}));
}

/* =====================================================
   OEFENBIBLIOTHEEK — volledig, met cues + prog/reg
===================================================== */
