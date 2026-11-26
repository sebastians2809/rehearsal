/* Rehearsal · Teclado: piano digital con perillas, sonidos, ritmos y looper (para tocar y hacer loops) */
(function(){
'use strict';
var R=window.REH,store=R.store;
var NAMES=['Do','Do♯','Re','Mi♭','Mi','Fa','Fa♯','Sol','La♭','La','Si♭','Si'];
var DR=R.inst.drums;
var SOUNDS=[
  {id:'piano',n:'Piano',e:'🎹',inst:'piano',pre:{bri:.8,eco:.2,rock:0,trem:0}},
  {id:'rhodes',n:'Piano eléctrico',e:'⚡',inst:'rhodes',pre:{bri:.7,eco:.3,rock:0,trem:.3}},
  {id:'hammond',n:'Hammond rockero',e:'🎸',inst:'organ',pre:{bri:.85,eco:.15,rock:.55,trem:.35}},
  {id:'synth',n:'Sintetizador',e:'🎛️',inst:'synth',pre:{bri:.6,eco:.25,rock:0,trem:0}},
  {id:'pad',n:'Pad',e:'☁️',inst:'pad',pre:{bri:.55,eco:.5,rock:0,trem:.1}},
  {id:'lead',n:'Lead',e:'🚀',inst:'lead',pre:{bri:.9,eco:.25,rock:.2,trem:0}},
  {id:'pluck',n:'Pluck',e:'✨',inst:'pluck',pre:{bri:.8,eco:.3,rock:0,trem:0}},
  {id:'bass',n:'Bajo',e:'🔊',inst:'sub808',pre:{bri:.45,eco:0,rock:0,trem:0},oct:-1},
  {id:'drums',n:'Batería',e:'🥁',drum:true,pre:{bri:1,eco:.15,rock:0,trem:0}}
];
var SOFT={piano:1,rhodes:1,pluck:1,guitar:1};
var RHY={
  none:['Sin ritmo',null],
  rock:['Rock',{kick:'x.......x.x.....',snare:'....x.......x...',hat:'x.x.x.x.x.x.x.x.'}],
  hiphop:['Hip hop',{kick:'x......x..x.....',snare:'....x.......x...',hat:'x.x.x.x.x.x.x.x.',ohat:'..............x.'}],
  reggaeton:['Reggaetón',{kick:'x...x...x...x...',snare:'...x..x...x..x..',hat:'..x...x...x...x.'}],
  disco:['Disco',{kick:'x...x...x...x...',clap:'....x.......x...',hat:'x.x.x.x.x.x.x.x.',ohat:'..x...x...x...x.'}],
  pop:['Pop',{kick:'x.....x.x.......',snare:'....x.......x...',clap:'....x.......x...',hat:'x.x.x.x.x.x.x.x.'}]
};
var KNOBS=[['vol','Volumen'],['bri','Brillo'],['eco','Eco'],['trem','Trémolo'],['rock','Rock']];
var BLACK={0:1,1:1,3:1,4:1,5:1};
function clamp(v,a,b){return Math.max(a,Math.min(b,v))}
function mod(a,n){return ((a%n)+n)%n}

var T=store.get('tk',null);
if(!T||!T.snd)T={snd:'piano',oct:0,vol:.8,bri:.8,eco:.2,rock:0,trem:0,bpm:96,rhy:'none',kit:'acoustic',bars:2,names:true};
function save(){store.set('tk',T)}
function snd(){return SOUNDS.filter(function(s){return s.id===T.snd})[0]||SOUNDS[0]}

/* ---------- audio ---------- */
var C={a:null};
function curve(k){var n=1024,c=new Float32Array(n);for(var i=0;i<n;i++){var x=i*2/n-1;c[i]=(3+k)*x*20*(Math.PI/180)/(Math.PI+k*Math.abs(x))}return c}
function chain(){
  var a=R.audioReady();if(!a)return null;
  if(C.a===a)return C;
  C.a=a;
  C.in=a.createGain();C.trem=a.createGain();C.lp=a.createBiquadFilter();C.lp.type='lowpass';C.lp.Q.value=.8;
  C.dry=a.createGain();C.ws=a.createWaveShaper();C.ws.curve=curve(50);C.ws.oversample='2x';C.wet=a.createGain();
  C.vol=a.createGain();C.send=a.createGain();
  var len=Math.floor(a.sampleRate*1.8),buf=a.createBuffer(2,len,a.sampleRate);
  for(var c=0;c<2;c++){var d=buf.getChannelData(c);for(var i=0;i<len;i++)d[i]=(Math.random()*2-1)*Math.pow(1-i/len,2.6)}
  C.rev=a.createConvolver();C.rev.buffer=buf;var rg=a.createGain();rg.gain.value=.6;C.rev.connect(rg);rg.connect(R.master());
  C.in.connect(C.trem);C.trem.connect(C.lp);C.lp.connect(C.dry);C.lp.connect(C.ws);C.ws.connect(C.wet);C.dry.connect(C.vol);C.wet.connect(C.vol);
  C.vol.connect(R.master());C.vol.connect(C.send);C.send.connect(C.rev);
  var lfo=a.createOscillator(),lg=a.createGain();lfo.frequency.value=5.4;lfo.connect(lg);lg.connect(C.trem.gain);lfo.start();C.lg=lg;
  C.drum=a.createGain();C.drum.gain.value=.8;C.drum.connect(R.master());var ds=a.createGain();ds.gain.value=.12;C.drum.connect(ds);ds.connect(C.rev);
  knobsApply();
  return C;
}
function knobsApply(){
  if(!C.a)return;var t=C.a.currentTime;
  C.vol.gain.setTargetAtTime(T.vol*1.15,t,.02);
  C.lp.frequency.setTargetAtTime(300*Math.pow(40,T.bri),t,.02);
  C.send.gain.setTargetAtTime(T.eco*.9,t,.03);
  C.lg.gain.setTargetAtTime(T.trem*.45,t,.03);C.trem.gain.setTargetAtTime(1-T.trem*.45,t,.03);
  C.dry.gain.setTargetAtTime(1-T.rock*.6,t,.03);C.wet.gain.setTargetAtTime(T.rock*.55,t,.03);
}

/* ---------- reloj (ritmo + looper) ---------- */
var K={on:false,gs:0,nextT:0,timer:0,raf:0,rhy:false,
  lp:{state:'idle',ev:[],start:0,t0:0,L:32}};
function sd(){return 60/T.bpm/4}
function click(t,acc){
  var a=C.a,o=a.createOscillator(),g=a.createGain();o.frequency.value=acc?1500:1000;
  g.gain.setValueAtTime(.16,t);g.gain.exponentialRampToValueAtTime(.001,t+.04);o.connect(g);g.connect(R.master());o.start(t);o.stop(t+.05);
}
function stepAt(gs,t){
  var lp=K.lp,p=K.rhy&&RHY[T.rhy][1];
  if(p){var i=gs%16;DR.forEach(function(x){if(p[x.id]&&p[x.id].charAt(i)==='x')R.inst.drum(x.id,t,x.id==='kick'?.9:.7,true,C.drum,T.kit)})}
  if((lp.state==='wait'||lp.state==='rec')&&gs%4===0)click(t,gs%16===0);
  if(lp.state==='wait'&&gs%16===0){lp.state='rec';lp.start=gs;lp.t0=t;lp.ev=[];paintLoop()}
  else if(lp.state==='rec'&&gs===lp.start+lp.L){lp.state='play';lp.start=gs;lp.t0=t;paintLoop()}
  if(lp.state==='play'||lp.state==='over'){
    var pos=(gs-lp.start)%lp.L;if(pos===0)lp.t0=t;
    lp.ev.forEach(function(e){
      if(e.p>=pos&&e.p<pos+1){
        var tt=t+(e.p-pos)*sd();
        if(e.k==='d')R.inst.drum(e.v,tt,.9,true,C.drum,T.kit);
        else R.inst.note(e.i,e.v,tt,e.d,.32,true,C.in);
      }
    });
  }
}
function tick(){
  var a=C.a;if(!a)return;
  if(K.nextT<a.currentTime-.25)K.nextT=a.currentTime+.05;
  var g=0;while(K.nextT<a.currentTime+.14&&g++<8){stepAt(K.gs,K.nextT);K.nextT+=sd();K.gs++}
}
function clockOn(){
  if(K.on)return;chain();K.on=true;K.gs=0;K.nextT=C.a.currentTime+.06;
  K.timer=setInterval(tick,25);tick();K.raf=requestAnimationFrame(frame);
}
function maybeOff(){
  var l=K.lp.state;
  if(K.rhy||l==='wait'||l==='rec'||l==='play'||l==='over')return;
  clearInterval(K.timer);cancelAnimationFrame(K.raf);K.on=false;
}
function frame(){
  if(!K.on)return;
  var lp=K.lp,f=root&&root.querySelector('.tk-lpfill');
  if(f){
    if(lp.state==='rec'||lp.state==='play'||lp.state==='over'){var pos=mod((C.a.currentTime-lp.t0)/sd(),lp.L);f.style.width=(pos/lp.L*100)+'%'}
    else f.style.width='0%';
  }
  K.raf=requestAnimationFrame(frame);
}
function loopPos(){
  var lp=K.lp;if(lp.state!=='rec'&&lp.state!=='over'&&lp.state!=='play')return null;
  var p=Math.round((C.a.currentTime-lp.t0)/sd());return mod(p,lp.L);
}

/* ---------- interfaz ---------- */
var root=null,H={};
function knobHTML(k,label){
  return '<div class="tk-knob" data-knob="'+k+'" role="slider" tabindex="0" aria-label="'+label+'" aria-valuemin="0" aria-valuemax="100" aria-valuenow="'+Math.round(T[k]*100)+'">'+knobSVG(T[k])+'<span>'+label+'</span></div>';
}
function arcPath(a0,a1,r){
  function pt(a){var x=24+r*Math.sin(a*Math.PI/180),y=24-r*Math.cos(a*Math.PI/180);return x.toFixed(2)+' '+y.toFixed(2)}
  return 'M'+pt(a0)+' A'+r+' '+r+' 0 '+((a1-a0)>180?1:0)+' 1 '+pt(a1);
}
function knobSVG(v){
  var a=-135+v*270;
  return '<svg viewBox="0 0 48 48" aria-hidden="true"><path d="'+arcPath(-135,135,19)+'" class="tk-ktrack"/>'+(v>0.01?'<path d="'+arcPath(-135,a,19)+'" class="tk-kval"/>':'')
    +'<circle cx="24" cy="24" r="13" class="tk-kcap"/><line x1="24" y1="24" x2="'+(24+11*Math.sin(a*Math.PI/180)).toFixed(2)+'" y2="'+(24-11*Math.cos(a*Math.PI/180)).toFixed(2)+'" class="tk-kind"/></svg>';
}
function keysHTML(){
  var base=48+12*(T.oct+(snd().oct||0)),h='<div class="tk-kb" data-base="'+base+'">';
  var W=15;
  for(var i=0;i<=24;i++){
    var pc=i%12,isB=[1,3,6,8,10].indexOf(pc)>=0,m=base+i;
    if(isB)continue;
    h+='<button class="tk-wk" data-m="'+m+'" style="--c:hsl('+(pc*30)+',75%,60%)" aria-label="'+NAMES[mod(m,12)]+'"><span>'+(T.names?NAMES[pc]:'')+'</span></button>';
  }
  /* negros: posición según la blanca anterior */
  var whites=0,out='';
  for(var q=0;q<=24;q++){
    var pq=q%12,b2=[1,3,6,8,10].indexOf(pq)>=0;
    if(!b2){whites++;continue}
    out+='<button class="tk-bk" data-m="'+(base+q)+'" style="left:calc('+(whites*100/W)+'% - '+(100/W*.3)+'%);width:'+(100/W*.6)+'%;--c:hsl('+(pq*30)+',75%,60%)" aria-label="'+NAMES[pq]+'"></button>';
  }
  return h+out+'</div>';
}
function padsHTML(){
  var h='<div class="tk-pads">';
  DR.forEach(function(x){h+='<button class="tk-pad" data-d="'+x.id+'" style="--c:'+x.color+'">'+x.label+'</button>'});
  return h+'</div>';
}
function loopLabel(){
  var s=K.lp.state,has=K.lp.ev.length>0;
  if(s==='wait')return '⏳ Esperando…';if(s==='rec')return '● Grabando…';
  if(s==='play'||s==='over')return '■ Parar loop';
  return has?'▶ Tocar loop':'● Grabar loop';
}
function render(el){
  root=el;
  var s=snd();
  var h='<div class="tk"><div class="tk-rot">🔄 Gira la tablet para tocar con más espacio</div>';
  h+='<div class="tk-top"><div class="tk-snds" role="group" aria-label="Sonidos">';
  SOUNDS.forEach(function(x){h+='<button class="tk-snd" data-snd="'+x.id+'" aria-pressed="'+(T.snd===x.id)+'"><i>'+x.e+'</i><b>'+x.n+'</b></button>'});
  h+='</div></div>';
  h+='<div class="tk-mid"><section class="tk-pn tk-knobs"><h4>Sonido</h4><div class="tk-krow">';
  KNOBS.forEach(function(k){h+=knobHTML(k[0],k[1])});
  h+='</div></section>';
  h+='<section class="tk-pn tk-rhy"><h4>Ritmo</h4><div class="tk-chips">';
  Object.keys(RHY).forEach(function(k){h+='<button class="tk-chip" data-rhy="'+k+'" aria-pressed="'+(T.rhy===k)+'">'+RHY[k][0]+'</button>'});
  h+='</div><div class="tk-rrow"><button class="tk-go'+(K.rhy?' on':'')+'" data-a="rhy">'+(K.rhy?'■ Parar':'▶ Ritmo')+'</button>'
    +'<div class="tk-chips">';
  R.inst.kits.forEach(function(k){h+='<button class="tk-chip" data-kit="'+k[0]+'" aria-pressed="'+(T.kit===k[0])+'">'+k[1]+'</button>'});
  h+='</div><label class="tk-tempo"><span>Tempo</span><input type="range" min="60" max="180" value="'+T.bpm+'" aria-label="Tempo"><b>'+T.bpm+'</b></label></div></section>';
  h+='<section class="tk-pn tk-loop"><h4>Looper</h4><div class="tk-lrow"><button class="tk-go lp" data-a="loop">'+loopLabel()+'</button>'
    +'<button class="tk-chipb" data-a="over"'+(K.lp.state==='play'||K.lp.state==='over'?'':' disabled')+' aria-pressed="'+(K.lp.state==='over')+'">＋ Añadir</button>'
    +'<button class="tk-chipb" data-a="lclear"'+(K.lp.ev.length?'':' disabled')+'>🗑 Borrar</button></div>'
    +'<div class="tk-chips"><span class="tk-lb">Largo</span>'+[1,2,4].map(function(b){return '<button class="tk-chip" data-bars="'+b+'" aria-pressed="'+(T.bars===b)+'"'+(K.lp.ev.length?' disabled':'')+'>'+b+(b>1?' compases':' compás')+'</button>'}).join('')+'</div>'
    +'<div class="tk-lpbar"><i class="tk-lpfill"></i></div></section></div>';
  h+='<div class="tk-play"><div class="tk-oct"><button class="tk-chipb" data-a="octd" aria-label="Octava abajo">− Octava</button><span>'+(T.oct>0?'+':'')+T.oct+'</span><button class="tk-chipb" data-a="octu" aria-label="Octava arriba">Octava +</button>'
    +'<button class="tk-chipb" data-a="names" aria-pressed="'+!!T.names+'">Nombres</button><span class="tk-now">'+s.e+' '+s.n+'</span></div>'
    +(s.drum?padsHTML():keysHTML())+'</div></div>';
  el.innerHTML=h;
  if(!el.__tk){
    el.__tk=true;
    el.addEventListener('click',onClick);
    el.addEventListener('pointerdown',onDown);
    el.addEventListener('pointermove',onMove);
    el.addEventListener('pointerup',onUp);el.addEventListener('pointercancel',onUp);
    el.addEventListener('input',function(e){if(e.target.type==='range'){T.bpm=+e.target.value;e.target.nextElementSibling.textContent=T.bpm}});
    el.addEventListener('change',function(e){if(e.target.type==='range')save()});
    el.addEventListener('keydown',onKeyKnob);
    el.addEventListener('contextmenu',function(e){if(e.target.closest('.tk'))e.preventDefault()});
    window.addEventListener('resize',fit);
  }
  fit();
}
function fit(){
  if(!root)return;var tk=root.querySelector('.tk');if(!tk)return;
  if(window.innerWidth<700||window.innerHeight>window.innerWidth){tk.style.height='';tk.classList.add('flow');return}
  tk.classList.remove('flow');
  tk.style.height=Math.max(420,window.innerHeight-(tk.getBoundingClientRect().top+window.scrollY)-10)+'px';
}
function paintLoop(){
  if(!root)return;var b=root.querySelector('[data-a=loop]');if(!b)return;
  var st=K.lp.state,pl=st==='play'||st==='over';
  b.textContent=loopLabel();b.classList.toggle('on',st!=='idle');
  var o=root.querySelector('[data-a=over]'),c=root.querySelector('[data-a=lclear]');
  if(o){o.disabled=!pl;o.setAttribute('aria-pressed',String(st==='over'))}
  if(c)c.disabled=!K.lp.ev.length;
  Array.prototype.forEach.call(root.querySelectorAll('[data-bars]'),function(x){x.disabled=!!K.lp.ev.length||st!=='idle'});
}

/* ---------- eventos ---------- */
function setSnd(id){
  var s=SOUNDS.filter(function(x){return x.id===id})[0];if(!s)return;
  T.snd=id;if(s.pre)for(var k in s.pre)T[k]=s.pre[k];
  T.oct=0;save();chain();knobsApply();render(root);
  if(s.drum)hit('kick');else playNote(60+12*(s.oct||0)+0,.6);
}
function playNote(m,d){
  var c=chain();if(!c)return;
  R.inst.note(snd().inst,m,0,d||.6,.32,false,c.in);
}
function hit(id){var c=chain();if(!c)return;R.inst.drum(id,0,.9,false,c.drum,T.kit)}
function onClick(e){
  var b=e.target.closest('button');if(!b||!root.contains(b))return;
  var a=b.getAttribute('data-a');
  if(b.hasAttribute('data-snd')){setSnd(b.getAttribute('data-snd'));return}
  if(b.hasAttribute('data-rhy')){T.rhy=b.getAttribute('data-rhy');save();if(T.rhy==='none'){K.rhy=false;maybeOff()}else if(!K.rhy){K.rhy=true;clockOn()}render(root);return}
  if(b.hasAttribute('data-kit')){T.kit=b.getAttribute('data-kit');save();render(root);hit('snare');return}
  if(b.hasAttribute('data-bars')){T.bars=+b.getAttribute('data-bars');K.lp.L=T.bars*16;save();render(root);return}
  if(a==='rhy'){
    if(K.rhy){K.rhy=false;maybeOff()}else{if(T.rhy==='none')T.rhy='rock';K.rhy=true;clockOn()}
    render(root);return;
  }
  if(a==='loop'){
    var lp=K.lp;
    if(lp.state==='idle'){
      if(lp.ev.length===0){lp.L=T.bars*16;lp.state='wait';clockOn()}
      else{clockOn();lp.state='play';lp.start=K.gs+mod(16-K.gs%16,16)}
    }else if(lp.state==='wait'||lp.state==='rec'){lp.state='idle';lp.ev=[];maybeOff()}
    else{lp.state='idle';maybeOff()}
    paintLoop();return;
  }
  if(a==='over'){K.lp.state=K.lp.state==='over'?'play':'over';paintLoop();return}
  if(a==='lclear'){K.lp.ev=[];K.lp.state='idle';maybeOff();paintLoop();return}
  if(a==='octd'){T.oct=clamp(T.oct-1,-2,2);save();render(root);return}
  if(a==='octu'){T.oct=clamp(T.oct+1,-2,2);save();render(root);return}
  if(a==='names'){T.names=!T.names;save();render(root);return}
}
function onDown(e){
  var kn=e.target.closest('[data-knob]');
  if(kn&&root.contains(kn)){
    e.preventDefault();var k=kn.getAttribute('data-knob');
    H['k'+e.pointerId]={knob:kn,k:k,y:e.clientY,v:T[k]};
    try{kn.setPointerCapture(e.pointerId)}catch(x){}
    return;
  }
  var key=e.target.closest('[data-m],[data-d]');
  if(!key||!root.contains(key))return;
  e.preventDefault();press(e.pointerId,key);
}
function press(pid,key){
  var c=chain();if(!c)return;
  var pos=loopPos(),rec=K.lp.state==='rec'||K.lp.state==='over';
  key.classList.add('hit');
  if(key.hasAttribute('data-d')){
    var id=key.getAttribute('data-d');hit(id);
    if(rec&&pos!==null)K.lp.ev.push({p:pos,k:'d',v:id});
    H[pid]={key:key};return;
  }
  var m=+key.getAttribute('data-m'),a=C.a,nv=a.createGain();nv.connect(C.in);
  R.inst.note(snd().inst,m,0,6,.32,false,nv);
  H[pid]={key:key,m:m,nv:nv,t0:a.currentTime,pos:rec?pos:null,inst:snd().inst};
}
function release(pid){
  var h=H[pid];if(!h)return;delete H[pid];
  if(h.key)h.key.classList.remove('hit');
  if(h.nv){
    var a=C.a,now=a.currentTime,soft=SOFT[h.inst];
    h.nv.gain.setTargetAtTime(0,now,soft?.12:.03);
    if(h.pos!==null&&h.pos!==undefined)K.lp.ev.push({p:h.pos,k:'n',v:h.m,d:Math.max(.1,now-h.t0),i:h.inst});
  }
}
function onMove(e){
  var kh=H['k'+e.pointerId];
  if(kh){
    var v=clamp(kh.v+(kh.y-e.clientY)/160,0,1);T[kh.k]=v;knobsApply();
    kh.knob.querySelector('svg').outerHTML=knobSVG(v);kh.knob.setAttribute('aria-valuenow',Math.round(v*100));return;
  }
  var h=H[e.pointerId];if(!h||h.nv===undefined&&!h.key)return;
  var el=document.elementFromPoint(e.clientX,e.clientY);
  var k2=el&&el.closest&&el.closest('[data-m],[data-d]');
  if(k2&&k2!==h.key&&root.contains(k2)&&h.m!==undefined&&k2.hasAttribute('data-m')){release(e.pointerId);press(e.pointerId,k2)}
}
function onUp(e){
  var kh=H['k'+e.pointerId];if(kh){delete H['k'+e.pointerId];save();return}
  release(e.pointerId);
}
function onKeyKnob(e){
  var kn=e.target.closest&&e.target.closest('[data-knob]');if(!kn)return;
  var d=e.key==='ArrowUp'||e.key==='ArrowRight'?.05:(e.key==='ArrowDown'||e.key==='ArrowLeft'?-.05:0);if(!d)return;
  e.preventDefault();var k=kn.getAttribute('data-knob');T[k]=clamp(T[k]+d,0,1);knobsApply();save();
  kn.querySelector('svg').outerHTML=knobSVG(T[k]);kn.setAttribute('aria-valuenow',Math.round(T[k]*100));
}
function leave(){
  K.rhy=false;K.lp.state='idle';
  clearInterval(K.timer);cancelAnimationFrame(K.raf);K.on=false;
  Object.keys(H).forEach(function(k){if(k.charAt(0)!=='k')release(+k)});
}
R.views.teclado={render:function(el){render(el);setTimeout(fit,60)},leave:leave};
R.teclado={state:T,loop:K.lp};
})();
