/* Rehearsal · Productor: un mini Ableton Live como juego (sesión de clips, línea de tiempo, editor, mezclador, teclado y misiones) */
(function(){
'use strict';
var R=window.REH,store=R.store,esc=R.esc;
var NAMES=['Do','Do♯','Re','Mi♭','Mi','Fa','Fa♯','Sol','La♭','La','Si♭','Si'];
var SEMI={maj:[0,2,4,5,7,9,11],min:[0,2,3,5,7,8,10]};
var ROMAN={maj:['I','ii','iii','IV','V','vi','vii°'],min:['i','ii°','III','iv','v','VI','VII']};
var SCENES=['Intro','Estrofa','Coro','Final'];
var NS=4,ARR=16;
var ROWS={bass:8,chords:12,mel:12};
var BASE={bass:36,chords:48,mel:60};
var VOL={bass:.42,chords:.2,mel:.3};
var DR=R.inst.drums;
var TR=[
  {id:'drums',name:'Batería',emoji:'🥁',color:'#ff8a6a',kind:'drum',opts:R.inst.kits},
  {id:'bass',name:'Bajo',emoji:'🎸',color:'#58dcaa',kind:'note',opts:[['bass','Bajo'],['sub808','Sub 808'],['synth','Synth']]},
  {id:'chords',name:'Acordes',emoji:'🎹',color:'#a98fff',kind:'note',opts:[['rhodes','Rhodes'],['piano','Piano'],['organ','Órgano'],['pad','Pad']]},
  {id:'mel',name:'Melodía',emoji:'🎶',color:'#ffd166',kind:'note',opts:[['synth','Synth'],['lead','Lead'],['piano','Piano'],['pluck','Pluck']]}
];
var DEFINST={drums:'acoustic',bass:'bass',chords:'rhodes',mel:'synth'};
var PATS={
  rock:['Rock',{kick:'x.......x.x.....',snare:'....x.......x...',hat:'x.x.x.x.x.x.x.x.'}],
  hiphop:['Hip hop',{kick:'x......x..x.....',snare:'....x.......x...',hat:'x.x.x.x.x.x.x.x.',ohat:'..............x.'}],
  reggaeton:['Reggaetón',{kick:'x...x...x...x...',snare:'...x..x...x..x..',hat:'..x...x...x...x.'}],
  disco:['Disco',{kick:'x...x...x...x...',clap:'....x.......x...',hat:'x.x.x.x.x.x.x.x.',ohat:'..x...x...x...x.'}],
  pop:['Pop',{kick:'x.....x.x.......',snare:'....x.......x...',clap:'....x.......x...',hat:'x.x.x.x.x.x.x.x.'}]
};
var PROGS=[[0,4,5,3],[0,3,4,0],[5,3,0,4],[0,5,3,4],[0,5,2,6]];
var MIS=[
  {id:'play',t:'Toca ▶ y escucha tu canción',l:'Una sesión es un montón de pedacitos de música (clips) listos para tocar todos juntos.'},
  {id:'launch',t:'Lanza otra escena con la ▶ de la derecha',l:'Una escena es una fila: toda la banda toca esa parte (Intro, Estrofa, Coro…). Las canciones se arman cambiando de escena.'},
  {id:'inst',t:'Cambia el sonido de un instrumento',l:'Un sintetizador crea sonidos desde cero. Cada pista puede tener su propio sonido.'},
  {id:'notes',t:'Dibuja 4 notas o golpes tuyos',l:'Cada cuadrito es un pedacito de tiempo. Arriba están las notas agudas y abajo las graves.'},
  {id:'bpm',t:'Cambia el tempo (la velocidad)',l:'BPM son pulsos por minuto: más BPM, más rápido.'},
  {id:'key',t:'Cambia la tonalidad',l:'Todas las notas suben o bajan juntas y siguen sonando bien. Eso se llama transportar.'},
  {id:'mix',t:'Silencia un instrumento o sube y baja su volumen',l:'Mezclar es decidir cuánto se escucha cada instrumento para que nadie tape a otro.'},
  {id:'rec',t:'Graba una melodía con el teclado',l:'Grabar es tocar en vivo mientras el loop da vueltas. Lo que tocas queda guardado en el clip.'},
  {id:'arr',t:'Pinta 4 compases en la línea de tiempo',l:'Arreglar es ordenar tus partes en el tiempo para tener una canción completa de principio a fin.'},
  {id:'save',t:'Guarda tu proyecto',l:'Un proyecto guarda todo: clips, sonidos, mezcla y línea de tiempo.'}
];
var ICON={
  play:'<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="M7 4.5v15l12-7.5z" fill="currentColor"/></svg>',
  stop:'<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><rect x="6" y="6" width="12" height="12" rx="2" fill="currentColor"/></svg>',
  rec:'<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><circle cx="12" cy="12" r="6.5" fill="currentColor"/></svg>',
  go:'<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path d="M8 5v14l11-7z" fill="currentColor"/></svg>',
  sq:'<svg viewBox="0 0 24 24" width="12" height="12" aria-hidden="true"><rect x="5" y="5" width="14" height="14" rx="2" fill="currentColor"/></svg>'
};

function clone(o){return JSON.parse(JSON.stringify(o))}
function clamp(v,a,b){return Math.max(a,Math.min(b,v))}
function mod(a,n){return ((a%n)+n)%n}

/* ---------- proyecto ---------- */
function emptyProject(){
  return {v:2,bpm:100,root:0,mode:'maj',prog:0,master:.6,metro:false,
    tr:TR.map(function(t){return {inst:DEFINST[t.id],vol:.8,mute:false,send:.15,clips:[null,null,null,null]}}),
    arr:TR.map(function(){var a=[];for(var i=0;i<ARR;i++)a.push(null);return a})};
}
function dclip(bars,pats,fill){
  var c={bars:bars,d:{}},ks={};
  Object.keys(pats).forEach(function(k){ks[k]=1});if(fill)Object.keys(fill).forEach(function(k){ks[k]=1});
  Object.keys(ks).forEach(function(k){
    var s='';for(var b=0;b<bars;b++){
      var last=b===bars-1;
      s+=(last&&fill&&fill[k]!=null)?fill[k]:(pats[k]||'................');
    }
    c.d[k]=s;
  });
  return c;
}
function chordClip(bars,prog){
  var n=[],each=bars*16/prog.length;
  prog.forEach(function(d,i){[0,2,4].forEach(function(k){n.push([i*each,each,d+k])})});
  return {bars:bars,n:n};
}
function bassClip(bars,prog){
  var n=[],each=bars*16/prog.length,rh=each>=8?[[0,3],[3,1],[4,2],[6,2]]:[[0,2],[2,2]];
  prog.forEach(function(d,i){rh.forEach(function(r){n.push([i*each+r[0],Math.min(r[1],each-r[0]),d])})});
  return {bars:bars,n:n};
}
function melClip(bars,seq){return {bars:bars,n:seq.map(function(x){return x.slice()})}}
function template(id){
  var P=emptyProject();
  var CL=function(t,c,clip){P.tr[t].clips[c]=clip};
  var prog,mA,mB,dr,inst;
  if(id==='b'){
    P.bpm=92;P.root=9;P.mode='min';P.prog=4;prog=PROGS[4];
    inst=['808','sub808','piano','pluck'];
    var rg=PATS.reggaeton[1];
    dr=[dclip(2,{kick:rg.kick,hat:rg.hat}),dclip(2,rg),dclip(2,{kick:rg.kick,snare:rg.snare,hat:rg.hat,clap:'....x.......x...',ohat:'..............x.'}),dclip(2,{kick:rg.kick})];
    mA=[[0,2,4],[3,1,4],[6,2,5],[8,2,4],[12,2,2],[16,2,4],[19,1,4],[22,2,5],[24,2,7],[28,4,4]];
    mB=[[0,2,7],[3,1,7],[6,2,8],[8,2,7],[12,2,5],[16,2,4],[19,1,5],[22,2,7],[24,4,8],[28,4,7]];
  }else if(id==='c'){
    P.bpm=78;P.root=5;P.mode='maj';P.prog=3;prog=PROGS[3];
    inst=['lofi','bass','rhodes','piano'];
    dr=[dclip(2,{kick:'x...............',hat:'x.x.x.x.x.x.x.x.'}),dclip(2,{kick:'x.....x...x.....',snare:'....x.......x...',hat:'x.x.x.x.x.x.x.x.'}),
      dclip(2,{kick:'x.....x...x.....',snare:'....x.......x...',hat:'x.x.x.x.x.x.x.x.',ohat:'......x.......x.'}),dclip(2,{kick:'x...............',snare:'....x...........'})];
    mA=[[2,3,4],[8,2,2],[12,4,5],[18,3,4],[24,2,2],[28,4,0]];
    mB=[[0,3,7],[4,3,5],[8,4,4],[16,3,5],[20,3,4],[24,6,2]];
  }else{
    P.bpm=100;P.root=0;P.mode='maj';P.prog=0;prog=PROGS[0];
    inst=['acoustic','bass','rhodes','synth'];
    var rk=PATS.rock[1];
    dr=[dclip(2,{kick:'x.......x.......',hat:'x.x.x.x.x.x.x.x.'}),dclip(2,rk),
      dclip(2,{kick:rk.kick,snare:rk.snare,hat:rk.hat,ohat:'..............x.',clap:'....x.......x...'},{snare:'..x.x.x.xxxxxxxx'}),dclip(2,{kick:rk.kick,snare:rk.snare})];
    mA=[[0,3,4],[4,2,2],[6,2,4],[8,3,5],[12,2,4],[14,2,2],[16,3,4],[20,2,2],[22,2,0],[24,3,1],[28,2,2],[30,2,0]];
    mB=[[0,2,7],[2,2,5],[4,4,4],[8,2,5],[10,2,4],[12,4,2],[16,2,7],[18,2,5],[20,4,4],[24,2,2],[26,2,4],[28,4,0]];
  }
  P.tr.forEach(function(t,i){t.inst=inst[i]});
  for(var s=0;s<NS;s++){
    CL(0,s,dr[s]);
    if(s>0)CL(1,s,bassClip(2,prog));
    CL(2,s,chordClip(2,s===3?[prog[0],prog[0],prog[3],prog[0]]:prog));
  }
  CL(3,1,melClip(2,mA));CL(3,2,melClip(2,mB));
  [[0,0],[2,1],[4,1],[6,2],[8,2],[10,3]].forEach(function(p){
    for(var t=0;t<4;t++)if(P.tr[t].clips[p[1]])P.arr[t][p[0]]=p[1];
  });
  return P;
}
var P=store.get('prod',null);
if(!P||P.v!==2||!P.tr||P.tr.length!==4)P=template('a');
var M=store.get('prod_m',{done:[],n:0});
function save(){store.set('prod',P)}
function saveM(){store.set('prod_m',M)}

/* ---------- escala ---------- */
function rootBase(){return P.root>=6?P.root-12:P.root}
function pitch(tid,deg){var o=Math.floor(deg/7),i=mod(deg,7);return BASE[tid]+rootBase()+SEMI[P.mode][i]+12*o}
function pcName(m){return NAMES[mod(m,12)]}
function hue(m){return 'hsl('+(mod(m,12)*30)+',70%,62%)'}
function roman(d){return ROMAN[P.mode][d]}
function sd(){return 60/P.bpm/4}

/* ---------- estado de pantalla ---------- */
var S={view:'ses',panel:'clip',sel:{t:1,c:1},on:false,mode:'ses',cl:[-1,-1,-1,-1],st:[0,0,0,0],pend:[],solo:{},rec:false,tool:'pen',brush:1,clip:null,lvl:[0,0,0,0]};
var root=null,E={a:null,tr:[],bus:null,rev:null,timer:0,nextT:0,gs:0,q:[],raf:0,cur:{gs:0,ag:0,t:0}};
var D=null,KH={};

/* ---------- motor de audio ---------- */
function ensure(){
  var a=R.audioReady();if(!a)return null;
  if(E.a===a&&E.tr.length)return E;
  E.a=a;
  E.bus=a.createGain();E.bus.gain.value=P.master;E.bus.connect(R.master());
  var len=Math.floor(a.sampleRate*1.8),buf=a.createBuffer(2,len,a.sampleRate);
  for(var c=0;c<2;c++){var d=buf.getChannelData(c);for(var i=0;i<len;i++)d[i]=(Math.random()*2-1)*Math.pow(1-i/len,2.6)}
  E.rev=a.createConvolver();E.rev.buffer=buf;var rg=a.createGain();rg.gain.value=.6;E.rev.connect(rg);rg.connect(E.bus);
  E.tr=TR.map(function(){
    var inn=a.createGain(),vol=a.createGain(),an=a.createAnalyser(),snd=a.createGain();an.fftSize=256;
    inn.connect(vol);vol.connect(an);vol.connect(E.bus);vol.connect(snd);snd.connect(E.rev);
    return {in:inn,vol:vol,an:an,snd:snd,buf:new Uint8Array(an.fftSize)};
  });
  applyMix();
  return E;
}
function applyMix(){
  if(!E.a||!E.tr.length)return;
  var any=false;for(var k in S.solo)if(S.solo[k])any=true;
  var now=E.a.currentTime;
  E.tr.forEach(function(x,i){
    var t=P.tr[i],on=!t.mute&&(!any||S.solo[i]);
    x.vol.gain.setTargetAtTime(on?t.vol:0,now,.015);x.snd.gain.setTargetAtTime(t.send,now,.03);
  });
  E.bus.gain.setTargetAtTime(P.master,now,.02);
}
function songEnd(){
  var e=0;
  P.arr.forEach(function(row,i){for(var b=0;b<ARR;b++)if(row[b]!=null){var c=P.tr[i].clips[row[b]];e=Math.max(e,b+(c?c.bars:1))}});
  return Math.max(e,1);
}
function arrAt(i,bar){
  var row=P.arr[i];
  for(var b=bar;b>=Math.max(0,bar-1);b--){
    if(row[b]!=null){var c=P.tr[i].clips[row[b]];if(c&&b+c.bars>bar)return {ci:row[b],off:(bar-b)*16}}
  }
  return null;
}
function playClip(i,c,loc,t){
  var tr=P.tr[i],T=TR[i],node=E.tr[i].in;
  if(T.kind==='drum'){
    DR.forEach(function(x){var s=c.d[x.id];if(s&&s.charAt(loc)==='x')R.inst.drum(x.id,t,x.id==='kick'?.9:.7,true,node,tr.inst)});
  }else{
    for(var k=0;k<c.n.length;k++){var n=c.n[k];if(n[0]===loc)R.inst.note(tr.inst,pitch(T.id,n[2]),t,Math.max(.08,n[1]*sd()*.96),VOL[T.id],true,node)}
  }
}
function click(t,acc){
  var a=E.a,o=a.createOscillator(),g=a.createGain();o.frequency.value=acc?1500:1000;
  g.gain.setValueAtTime(.18,t);g.gain.exponentialRampToValueAtTime(.001,t+.04);o.connect(g);g.connect(E.bus);o.start(t);o.stop(t+.05);
}
function stepAt(gs,t){
  var ag=S.mode==='arr'?gs%(songEnd()*16):gs;
  E.q.push({t:t,gs:gs,ag:ag});
  if(S.mode==='ses'&&gs%16===0){
    for(var i=0;i<4;i++)if(S.pend[i]!==undefined){S.cl[i]=S.pend[i];S.st[i]=gs;S.pend[i]=undefined}
  }
  if(P.metro&&gs%4===0)click(t,gs%16===0);
  for(var j=0;j<4;j++){
    var tr=P.tr[j],ci=-1,loc=0;
    if(S.mode==='ses'){
      ci=S.cl[j];
      if(ci>=0){var c=tr.clips[ci];if(c)loc=(gs-S.st[j])%(c.bars*16);else ci=-1}
    }else{
      var h=arrAt(j,Math.floor(ag/16));if(h){ci=h.ci;loc=h.off+ag%16}
    }
    if(ci>=0)playClip(j,tr.clips[ci],loc,t);
  }
}
function tick(){
  var a=E.a;if(!a)return;
  if(E.nextT<a.currentTime-.25)E.nextT=a.currentTime+.05;
  var g=0;
  while(E.nextT<a.currentTime+.14&&g++<8){stepAt(E.gs,E.nextT);E.nextT+=sd();E.gs++}
}
function play(mode,init){
  var e=ensure();if(!e)return;
  clearInterval(E.timer);
  S.mode=mode;E.gs=0;E.nextT=E.a.currentTime+.08;E.q=[];E.cur={gs:0,ag:0,t:E.nextT};S.on=true;
  S.cl=[-1,-1,-1,-1];S.st=[0,0,0,0];S.pend=[];
  if(init)init();
  else if(mode==='ses')launchScene(S.sel.c,true);
  E.timer=setInterval(tick,25);tick();
  cancelAnimationFrame(E.raf);E.raf=requestAnimationFrame(frame);
  mission('play');
  if(root){renderBar();paintStates()}
}
function stop(){
  clearInterval(E.timer);cancelAnimationFrame(E.raf);
  S.on=false;S.cl=[-1,-1,-1,-1];S.pend=[];E.q=[];S.rec=false;
  if(root){renderBar();paintStates();hideHeads();meters(true)}
}
function launchScene(c,quiet){
  if(!S.on||S.mode!=='ses'){
    if(S.on)stop();
    play('ses',function(){for(var i=0;i<4;i++)S.pend[i]=P.tr[i].clips[c]?c:-1});
  }else{for(var i=0;i<4;i++)S.pend[i]=P.tr[i].clips[c]?c:-1}
  if(!quiet)mission('launch');
}
function launch(i,c){
  var clip=P.tr[i].clips[c];
  if(!S.on||S.mode!=='ses'){
    if(S.on)stop();
    play('ses',function(){S.pend[i]=clip?c:-1});
  }else S.pend[i]=clip?c:-1;
  paintStates();
}

/* ---------- animación ---------- */
function frame(){
  if(!S.on||!E.a)return;
  var now=E.a.currentTime,bar=false;
  while(E.q.length&&E.q[0].t<=now){E.cur=E.q.shift();if(E.cur.gs%16===0)bar=true}
  if(bar)paintStates();
  heads(now);meters(false);
  E.raf=requestAnimationFrame(frame);
}
function curLoc(i,c){
  if(!S.on||!E.a)return null;
  var clip=P.tr[i].clips[c];if(!clip)return null;
  var f=(E.a.currentTime-E.cur.t)/sd();f=clamp(f,0,1.2);
  if(S.mode==='ses'){
    if(S.cl[i]!==c)return null;
    return mod(E.cur.gs+f-S.st[i],clip.bars*16);
  }
  var h=arrAt(i,Math.floor(E.cur.ag/16));
  if(h&&h.ci===c)return h.off+E.cur.ag%16+f;
  return null;
}
function heads(now){
  var ph=root.querySelector('.pd-roll .pd-ph');
  if(ph){
    var l=curLoc(S.sel.t,S.sel.c),cl=P.tr[S.sel.t].clips[S.sel.c];
    if(l===null||!cl)ph.style.display='none';else{ph.style.display='block';ph.style.left=(l/(cl.bars*16)*100)+'%'}
  }
  var ap=root.querySelector('.pd-aph');
  if(ap){
    if(S.mode==='arr'){ap.style.display='block';ap.style.setProperty('--f',((E.cur.ag+clamp((now-E.cur.t)/sd(),0,1))/16/ARR).toFixed(4))}
    else ap.style.display='none';
  }
}
function hideHeads(){
  Array.prototype.forEach.call(root.querySelectorAll('.pd-ph,.pd-aph'),function(e){e.style.display='none'});
}
function meters(zero){
  if(!E.tr.length)return;
  E.tr.forEach(function(x,i){
    var pk=0;
    if(!zero){x.an.getByteTimeDomainData(x.buf);for(var k=0;k<x.buf.length;k++){var v=Math.abs(x.buf[k]-128)/128;if(v>pk)pk=v}}
    S.lvl[i]=Math.max(pk,S.lvl[i]*.86);if(zero)S.lvl[i]=0;
    var el=root.querySelector('[data-m="'+i+'"]');if(el)el.style.transform='scaleX('+clamp(S.lvl[i]*1.7,0,1).toFixed(3)+')';
  });
}

/* ---------- misiones ---------- */
function mission(id){
  if(M.done.indexOf(id)>=0)return;
  M.done.push(id);saveM();
  var m=MIS.filter(function(x){return x.id===id})[0];
  toast('⭐ ¡Misión cumplida! '+m.l);
  if(root)renderBar();
}
function misCount(){return M.done.length}
function nextMis(){for(var i=0;i<MIS.length;i++)if(M.done.indexOf(MIS[i].id)<0)return MIS[i];return null}
var toastT=0;
function toast(msg){
  if(!root)return;var t=root.querySelector('.pd-toast');if(!t)return;
  t.textContent=msg;t.classList.add('on');clearTimeout(toastT);toastT=setTimeout(function(){t.classList.remove('on')},3600);
}

/* ---------- clips ---------- */
function curClip(){return P.tr[S.sel.t].clips[S.sel.c]}
function ensureClip(t,c){
  var tr=P.tr[t];
  if(!tr.clips[c])tr.clips[c]=TR[t].kind==='drum'?{bars:1,d:{}}:{bars:1,n:[]};
  return tr.clips[c];
}
function setBars(clip,t,bars){
  if(clip.bars===bars)return;
  var old=clip.bars*16,nw=bars*16;
  if(TR[t].kind==='drum'){
    Object.keys(clip.d).forEach(function(k){
      var s=clip.d[k]||'';while(s.length<old)s+='.';
      if(nw>old)s=s.slice(0,old)+s.slice(0,nw-old);else s=s.slice(0,nw);
      clip.d[k]=s;
    });
  }else{
    if(nw>old){var add=[];clip.n.forEach(function(n){add.push([n[0]+old,n[1],n[2]])});clip.n=clip.n.concat(add)}
    else clip.n=clip.n.filter(function(n){return n[0]<nw}).map(function(n){return [n[0],Math.min(n[1],nw-n[0]),n[2]]});
  }
  clip.bars=bars;
}
function dget(c,id,i){var s=c.d[id];return !!s&&s.charAt(i)==='x'}
function dset(c,id,i,v){
  var n=c.bars*16,s=c.d[id]||'';while(s.length<n)s+='.';
  c.d[id]=s.slice(0,i)+(v?'x':'.')+s.slice(i+1);
}
function noteMission(){if(M.done.indexOf('notes')<0){M.n=(M.n||0)+1;saveM();if(M.n>=4)mission('notes')}}

/* ---------- sonido de prueba ---------- */
function prevNote(t,deg){
  var e=ensure();if(!e)return;
  R.inst.note(P.tr[t].inst,pitch(TR[t].id,deg),0,.5,VOL[TR[t].id]*1.3,false,e.tr[t].in);
}
function prevDrum(id){
  var e=ensure();if(!e)return;
  R.inst.drum(id,0,.9,false,e.tr[0].in,P.tr[0].inst);
}

/* ---------- dibujo ---------- */
function instLabel(i){
  var o=TR[i].opts.filter(function(x){return x[0]===P.tr[i].inst})[0];return o?o[1]:'';
}
function mini(i,c){
  var n=c.bars*16,s='<svg viewBox="0 0 64 24" preserveAspectRatio="none" class="pd-mini" aria-hidden="true">';
  if(TR[i].kind==='drum'){
    DR.forEach(function(x,r){var q=c.d[x.id]||'';for(var k=0;k<n;k++)if(q.charAt(k)==='x')s+='<rect x="'+(k/n*64).toFixed(2)+'" y="'+(r*4)+'" width="'+Math.max(1,64/n*.8).toFixed(2)+'" height="3"/>'});
  }else{
    var Rn=ROWS[TR[i].id];c.n.forEach(function(x){
      var y=(Rn-1-clamp(x[2],0,Rn-1))/Rn*24;
      s+='<rect x="'+(x[0]/n*64).toFixed(2)+'" y="'+y.toFixed(2)+'" width="'+Math.max(1.4,x[1]/n*64-.5).toFixed(2)+'" height="'+Math.max(2,24/Rn).toFixed(2)+'"/>';
    });
  }
  return s+'</svg>';
}
function renderBar(){
  var el=root.querySelector('.pd-bar');if(!el)return;
  var nm=nextMis();
  var keys=NAMES.map(function(n,i){return '<option value="'+i+'"'+(P.root===i?' selected':'')+'>'+n+'</option>'}).join('');
  el.innerHTML=
    '<button class="pd-play'+(S.on?' on':'')+(M.done.indexOf('play')<0&&!S.on?' pulse':'')+'" data-a="play" aria-label="'+(S.on?'Parar':'Tocar')+'">'+(S.on?ICON.stop:ICON.play)+'</button>'
    +'<button class="pd-rec'+(S.rec?' on':'')+'" data-a="rec" aria-pressed="'+S.rec+'" aria-label="Grabar" title="Grabar lo que toques en el clip">'+ICON.rec+'</button>'
    +'<button class="pd-metro'+(P.metro?' on':'')+'" data-a="metro" aria-pressed="'+!!P.metro+'" aria-label="Metrónomo" title="Metrónomo">♩</button>'
    +'<label class="pd-tempo"><span>Tempo</span><input type="range" class="pd-bpm" min="60" max="180" value="'+P.bpm+'" aria-label="Tempo"><b>'+P.bpm+'</b></label>'
    +'<label class="pd-sel"><span>Tono</span><select data-a="key" aria-label="Tonalidad">'+keys+'</select></label>'
    +'<div class="seg pd-mode" role="group" aria-label="Modo"><button data-a="mode" data-v="maj" aria-pressed="'+(P.mode==='maj')+'">Mayor</button><button data-a="mode" data-v="min" aria-pressed="'+(P.mode==='min')+'">Menor</button></div>'
    +'<div class="seg pd-view" role="group" aria-label="Vista"><button data-a="view" data-v="ses" aria-pressed="'+(S.view==='ses')+'">Sesión</button><button data-a="view" data-v="arr" aria-pressed="'+(S.view==='arr')+'">Línea de tiempo</button></div>'
    +'<button class="pd-star" data-a="mis" title="'+(nm?esc(nm.t):'¡Todas las misiones!')+'">⭐ <b>'+misCount()+'/'+MIS.length+'</b><span>'+(nm?esc(nm.t):'¡Eres productor!')+'</span></button>'
    +'<button class="pd-proj" data-a="proj" aria-label="Proyectos">☰ <span>Proyecto</span></button>';
}
function slotHTML(i,c){
  var clip=P.tr[i].clips[c],T=TR[i];
  return '<div class="pd-slot'+(clip?'':' empty')+'" data-t="'+i+'" data-c="'+c+'" style="--c:'+T.color+'">'
    +'<button class="pd-go" data-a="launch" data-t="'+i+'" data-c="'+c+'" aria-label="'+(clip?'Lanzar clip':'Parar pista')+'">'+(clip?ICON.go:ICON.sq)+'</button>'
    +'<button class="pd-cb" data-a="slot" data-t="'+i+'" data-c="'+c+'" aria-label="Editar clip '+SCENES[c]+' de '+T.name+'">'
    +(clip?mini(i,clip)+'<span class="pd-cn">'+clip.bars+(clip.bars>1?' compases':' compás')+'</span>':'<span class="pd-plus">+</span>')+'</button></div>';
}
function sessionHTML(){
  var h='<div class="pd-ses"><div class="pd-sgrid">';
  TR.forEach(function(T,i){
    h+='<div class="pd-th" style="--c:'+T.color+'"><span class="pd-te">'+T.emoji+'</span><span class="pd-tn"><b>'+T.name+'</b><small>'+esc(instLabel(i))+'</small></span><button class="pd-st" data-a="stoptrack" data-t="'+i+'" aria-label="Parar '+T.name+'">'+ICON.sq+'</button></div>';
  });
  h+='<div class="pd-th pd-sh"><b>Escenas</b></div>';
  for(var c=0;c<NS;c++){
    TR.forEach(function(T,i){h+=slotHTML(i,c)});
    h+='<button class="pd-scene" data-a="scene" data-c="'+c+'"><span class="pd-sgo">'+ICON.go+'</span><b>'+SCENES[c]+'</b></button>';
  }
  TR.forEach(function(T,i){
    var t=P.tr[i];
    h+='<div class="pd-mx" style="--c:'+T.color+'"><div class="pd-fader"><i class="pd-meter" data-m="'+i+'"></i><input type="range" class="pd-vol" data-t="'+i+'" min="0" max="1" step=".01" value="'+t.vol+'" aria-label="Volumen '+T.name+'"></div>'
      +'<div class="pd-mxr"><button class="pd-ms'+(t.mute?' on':'')+'" data-a="mute" data-t="'+i+'" aria-pressed="'+!!t.mute+'" aria-label="Silenciar '+T.name+'">M</button>'
      +'<button class="pd-ms solo'+(S.solo[i]?' on':'')+'" data-a="solo" data-t="'+i+'" aria-pressed="'+!!S.solo[i]+'" aria-label="Solo '+T.name+'">S</button>'
      +'<label class="pd-eco"><span>Eco</span><input type="range" class="pd-send" data-t="'+i+'" min="0" max=".7" step=".01" value="'+t.send+'" aria-label="Eco '+T.name+'"></label></div></div>';
  });
  h+='<div class="pd-mx pd-master"><div class="pd-fader"><input type="range" class="pd-mvol" min="0" max="1" step=".01" value="'+P.master+'" aria-label="Volumen general"></div><div class="pd-mxr"><b>General</b></div></div>';
  return h+'</div></div>';
}
function arrHTML(){
  var h='<div class="pd-arr"><div class="pd-brush"><span class="pd-bl">Pincel</span>';
  for(var c=0;c<NS;c++)h+='<button class="pd-chip sc'+c+'" data-a="brush" data-c="'+c+'" aria-pressed="'+(S.brush===c)+'">'+SCENES[c]+'</button>';
  h+='<button class="pd-chip" data-a="brush" data-c="-1" aria-pressed="'+(S.brush===-1)+'">⌫ Borrar</button>'
    +'<span class="pd-hint">Toca un número para pintar toda la banda · toca un cuadro para pintar una pista</span></div>';
  var end=songEnd();
  h+='<div class="pd-agrid"><div class="pd-aph"></div><div class="pd-ac pd-corner"></div>';
  for(var b=0;b<ARR;b++)h+='<button class="pd-rb'+(b<end?' in':'')+'" style="grid-column:'+(b+2)+';grid-row:1" data-a="arrcol" data-b="'+b+'" aria-label="Pintar compás '+(b+1)+'">'+(b+1)+'</button>';
  TR.forEach(function(T,i){
    var r=i+2,t=P.tr[i];
    h+='<div class="pd-ah" style="grid-row:'+r+';grid-column:1;--c:'+T.color+'"><span>'+T.emoji+' <b>'+T.name+'</b></span>'
      +'<button class="pd-ms'+(t.mute?' on':'')+'" data-a="mute" data-t="'+i+'" aria-label="Silenciar '+T.name+'">M</button>'
      +'<button class="pd-ms solo'+(S.solo[i]?' on':'')+'" data-a="solo" data-t="'+i+'" aria-label="Solo '+T.name+'">S</button></div>';
    var skip=0;
    for(var k=0;k<ARR;k++){
      var ci=P.arr[i][k],cl=ci!=null?t.clips[ci]:null;
      if(cl){
        var span=Math.min(cl.bars,ARR-k);
        h+='<button class="pd-block sc'+ci+'" style="grid-row:'+r+';grid-column:'+(k+2)+'/span '+span+';--c:'+T.color+'" data-a="arrcell" data-t="'+i+'" data-b="'+k+'">'+mini(i,cl)+'<span>'+SCENES[ci]+'</span></button>';
        skip=span-1;
      }else if(skip>0){skip--}
      else h+='<button class="pd-ac'+(k<end?' in':'')+'" style="grid-row:'+r+';grid-column:'+(k+2)+'" data-a="arrcell" data-t="'+i+'" data-b="'+k+'" aria-label="'+T.name+' compás '+(k+1)+'"></button>';
    }
  });
  return h+'</div></div>';
}
function renderMain(){
  var el=root.querySelector('.pd-main');if(!el)return;
  el.innerHTML=S.view==='ses'?sessionHTML():arrHTML();
  paintStates();
}
function paintStates(){
  if(!root)return;
  Array.prototype.forEach.call(root.querySelectorAll('.pd-slot'),function(el){
    var t=+el.getAttribute('data-t'),c=+el.getAttribute('data-c');
    el.classList.toggle('on',S.on&&S.mode==='ses'&&S.cl[t]===c);
    el.classList.toggle('pend',S.on&&S.mode==='ses'&&S.pend[t]===c);
    el.classList.toggle('sel',S.sel.t===t&&S.sel.c===c);
  });
  Array.prototype.forEach.call(root.querySelectorAll('.pd-scene'),function(el){
    var c=+el.getAttribute('data-c'),all=true,any=false;
    for(var i=0;i<4;i++){if(P.tr[i].clips[c]){any=true;if(!(S.on&&S.mode==='ses'&&S.cl[i]===c))all=false}}
    el.classList.toggle('on',S.on&&S.mode==='ses'&&any&&all);
  });
}

/* ---- editor de clip ---- */
function detailHTML(){
  var h='<div class="pd-tabs"><div class="seg" role="group" aria-label="Panel"><button data-a="panel" data-v="clip" aria-pressed="'+(S.panel==='clip')+'">Clip</button><button data-a="panel" data-v="keys" aria-pressed="'+(S.panel==='keys')+'">Teclado</button></div>';
  h+=headerHTML()+'</div>';
  return h+(S.panel==='clip'?clipHTML():keysHTML());
}
function headerHTML(){
  var T=TR[S.sel.t],clip=curClip();
  return '<span class="pd-ct" style="--c:'+T.color+'">'+T.emoji+' <b>'+T.name+'</b> · '+SCENES[S.sel.c]+'</span>'
    +(clip?'<div class="seg pd-len" role="group" aria-label="Largo"><button data-a="bars" data-v="1" aria-pressed="'+(clip.bars===1)+'">1 compás</button><button data-a="bars" data-v="2" aria-pressed="'+(clip.bars===2)+'">2 compases</button></div>'
    +'<div class="pd-tools"><button class="pd-tb" data-a="copy">Copiar</button><button class="pd-tb" data-a="paste"'+(S.clip&&S.clip.kind===TR[S.sel.t].kind?'':' disabled')+'>Pegar</button><button class="pd-tb" data-a="clear">Vaciar</button><button class="pd-tb" data-a="del">Quitar</button></div>':'');
}
function chipsHTML(){
  var t=S.sel.t,T=TR[t],tr=P.tr[t],h='<div class="pd-chips"><span class="pd-bl">Sonido</span>';
  T.opts.forEach(function(o){h+='<button class="pd-chip" data-a="inst" data-v="'+o[0]+'" aria-pressed="'+(tr.inst===o[0])+'">'+o[1]+'</button>'});
  h+='<span class="pd-sep"></span><span class="pd-bl">Ideas</span>';
  if(T.id==='drums'){Object.keys(PATS).forEach(function(k){h+='<button class="pd-chip idea" data-a="pat" data-v="'+k+'">'+PATS[k][0]+'</button>'})}
  else if(T.id==='chords'){
    PROGS.forEach(function(p,i){h+='<button class="pd-chip idea" data-a="prog" data-v="'+i+'" aria-pressed="'+(P.prog===i)+'">'+p.map(roman).join('–')+'</button>'});
    h+='<span class="pd-sep"></span><button class="pd-chip" data-a="tool" data-v="chord" aria-pressed="'+(S.tool==='chord')+'">Acorde</button><button class="pd-chip" data-a="tool" data-v="pen" aria-pressed="'+(S.tool!=='chord')+'">Una nota</button>';
  }else if(T.id==='bass'){h+='<button class="pd-chip idea" data-a="follow">Seguir los acordes</button>'}
  else{h+='<button class="pd-chip idea" data-a="surprise">✨ Sorpresa</button>'}
  return h+'</div>';
}
function clipHTML(){
  var t=S.sel.t,T=TR[t],clip=curClip();
  if(!clip)return '<div class="pd-empty">Toca un cuadro de la sesión para empezar un clip nuevo.</div>';
  var n=clip.bars*16,h=chipsHTML();
  if(T.kind==='drum'){
    h+='<div class="pd-roll pd-drum" style="--n:'+n+';--r:'+DR.length+'"><div class="pd-keys">';
    DR.forEach(function(x){h+='<button class="pd-key" data-a="dprev" data-v="'+x.id+'" style="--c:'+x.color+'">'+x.label+'</button>'});
    h+='</div><div class="pd-cells" data-kind="drum" data-n="'+n+'" data-r="'+DR.length+'">';
    DR.forEach(function(x){for(var i=0;i<n;i++)h+='<i class="pd-cell'+(i%4===0?' b4':'')+(i%16===0?' bar':'')+(dget(clip,x.id,i)?' on':'')+'" style="--c:'+x.color+'"></i>'});
    return h+'<div class="pd-ph"></div></div></div>';
  }
  var Rn=ROWS[T.id];
  h+='<div class="pd-roll" style="--n:'+n+';--r:'+Rn+'"><div class="pd-keys">';
  for(var r=0;r<Rn;r++){var d=Rn-1-r,m=pitch(T.id,d);h+='<button class="pd-key note'+(d%7===0?' root':'')+'" data-a="kprev" data-v="'+d+'" style="--c:'+hue(m)+'">'+pcName(m)+'</button>'}
  h+='</div><div class="pd-cells" data-kind="note" data-n="'+n+'" data-r="'+Rn+'">';
  for(var rr=0;rr<Rn;rr++){var dd=Rn-1-rr;for(var i2=0;i2<n;i2++)h+='<i class="pd-cell'+(i2%4===0?' b4':'')+(i2%16===0?' bar':'')+(dd%7===0?' rt':'')+'"></i>'}
  h+='<div class="pd-notes" style="--c:'+T.color+'">'+notesHTML(clip,T)+'</div><div class="pd-ph"></div></div></div>';
  return h;
}
function notesHTML(clip,T){
  var n=clip.bars*16,Rn=ROWS[T.id],h='';
  clip.n.forEach(function(x){
    var r=Rn-1-x[2];if(r<0||r>=Rn)return;
    h+='<b class="pd-note" style="left:'+(x[0]/n*100)+'%;width:'+(x[1]/n*100)+'%;top:'+(r/Rn*100)+'%;height:'+(100/Rn)+'%"></b>';
  });
  return h;
}
function keysHTML(){
  var t=S.sel.t,T=TR[t],h='<div class="pd-kbwrap">';
  h+='<div class="pd-kbbar"><button class="pd-rec big'+(S.rec?' on':'')+'" data-a="rec" aria-pressed="'+S.rec+'">'+ICON.rec+' <span>'+(S.rec?'Grabando…':'Grabar en este clip')+'</span></button>'
    +(T.id==='chords'?'<div class="seg"><button data-a="tool" data-v="chord" aria-pressed="'+(S.tool==='chord')+'">Acorde</button><button data-a="tool" data-v="pen" aria-pressed="'+(S.tool!=='chord')+'">Una nota</button></div>':'')
    +'<span class="pd-hint">'+(T.kind==='drum'?'Toca los pads para tocar la batería':'Solo suenan notas de la tonalidad, ¡no puedes desafinar!')+'</span></div>';
  if(T.kind==='drum'){
    h+='<div class="pd-pads">';DR.forEach(function(x){h+='<button class="pd-pad" data-k="d" data-v="'+x.id+'" style="--c:'+x.color+'">'+x.label+'</button>'});
    return h+'</div></div>';
  }
  h+='<div class="pd-kb">';
  for(var d=0;d<15;d++){var m=pitch(T.id,d);h+='<button class="pd-pk'+(d%7===0?' root':'')+'" data-k="n" data-v="'+d+'" style="--c:'+hue(m)+'"><span>'+pcName(m)+'</span></button>'}
  return h+'</div></div>';
}
function renderDetail(){
  var el=root.querySelector('.pd-detail');if(!el)return;
  el.innerHTML=detailHTML();
}
function renderAll(){renderBar();renderMain();renderDetail()}

/* ---------- acciones de edición ---------- */
function selectClip(t,c){
  S.sel={t:t,c:c};ensureClip(t,c);save();
  if(S.view==='ses')renderMain();
  renderDetail();
}
function applyPat(id){
  var c=curClip();if(!c||!c.d)return;
  c.d={};var p=PATS[id][1];
  Object.keys(p).forEach(function(k){var s='';for(var b=0;b<c.bars;b++)s+=p[k];c.d[k]=s});
  save();renderDetail();if(S.view==='ses')renderMain();
}
function applyProg(i){
  P.prog=i;var c=curClip();if(!c||!c.n)return;
  c.n=chordClip(c.bars,PROGS[i]).n;save();renderDetail();renderMain();
}
function applyFollow(){
  var c=curClip();if(!c||!c.n)return;
  c.n=bassClip(c.bars,PROGS[P.prog]).n;save();renderDetail();renderMain();
}
function surprise(){
  var c=curClip();if(!c||!c.n)return;
  var pool=[0,1,2,4,5,7,8,9,11],n=c.bars*16,out=[],i0=3;
  for(var s=0;s<n-2;s+=2){
    if(Math.random()<.22)continue;
    i0=clamp(i0+Math.floor(Math.random()*5)-2,0,pool.length-1);
    var len=Math.random()<.5?2:(Math.random()<.5?3:4);len=Math.min(len,n-s);
    out.push([s,len,pool[i0]]);if(len>2)s+=len-2;
  }
  if(out.length)out[out.length-1][2]=0;
  c.n=out;save();renderDetail();renderMain();
}
function paintArr(i,b){
  var row=P.arr[i];
  if(S.brush===-1){
    if(row[b]==null&&b>0&&row[b-1]!=null){var pc=P.tr[i].clips[row[b-1]];if(pc&&pc.bars>1)row[b-1]=null}
    row[b]=null;return;
  }
  var cl=P.tr[i].clips[S.brush];if(!cl)return;
  if(row[b]===S.brush){row[b]=null;return}
  if(b>0&&row[b-1]!=null){var q=P.tr[i].clips[row[b-1]];if(q&&q.bars>1)row[b-1]=null}
  row[b]=S.brush;
  for(var k=b+1;k<Math.min(ARR,b+cl.bars);k++)row[k]=null;
}
function arrDone(){
  var bars={};P.arr.forEach(function(row,i){row.forEach(function(ci,b){if(ci!=null){var c=P.tr[i].clips[ci];for(var k=0;k<(c?c.bars:1);k++)bars[b+k]=1}})});
  if(Object.keys(bars).length>=4)mission('arr');
}

/* ---------- proyectos ---------- */
function modalHTML(kind){
  if(kind==='mis'){
    var nm=nextMis(),h='<div class="pd-sheet"><header><h3>Misiones de productor</h3><button class="pd-x" data-a="close" aria-label="Cerrar">✕</button></header><p class="pd-p">Cada misión te enseña algo de producción musical. ¡Cumple todas!</p><ol class="pd-mis">';
    MIS.forEach(function(m){
      var d=M.done.indexOf(m.id)>=0;
      h+='<li class="'+(d?'done':(nm&&nm.id===m.id?'next':''))+'"><span class="pd-ck">'+(d?'⭐':'☆')+'</span><div><b>'+esc(m.t)+'</b><small>'+esc(m.l)+'</small></div></li>';
    });
    return h+'</ol></div>';
  }
  var saves=store.get('prod_saves',[]);
  var h2='<div class="pd-sheet"><header><h3>Proyectos</h3><button class="pd-x" data-a="close" aria-label="Cerrar">✕</button></header>'
    +'<h4>Empieza con un ejemplo</h4><div class="pd-tpl">'
    +'<button data-a="tpl" data-v="a"><b>🎸 Mi primer beat</b><small>Rock alegre en Do mayor</small></button>'
    +'<button data-a="tpl" data-v="b"><b>🔥 Reggaetón</b><small>La menor, 92 BPM</small></button>'
    +'<button data-a="tpl" data-v="c"><b>🌙 Lo‑fi tarde</b><small>Relajado, Fa mayor, 78 BPM</small></button>'
    +'<button data-a="tpl" data-v="z"><b>📄 En blanco</b><small>Empieza desde cero</small></button></div>'
    +'<h4>Guardar este proyecto</h4><div class="pd-savebar"><input id="pd-name" type="text" maxlength="40" placeholder="Nombre de tu canción" aria-label="Nombre"><button class="btn primary" data-a="save">Guardar</button></div>'
    +'<h4>Mis proyectos</h4>';
  if(!saves.length)h2+='<p class="pd-p">Todavía no has guardado ninguno.</p>';
  saves.forEach(function(s,i){h2+='<div class="pd-sv"><b>'+esc(s.name)+'</b><button class="btn" data-a="load" data-i="'+i+'">Abrir</button><button class="btn" data-a="delsave" data-i="'+i+'" aria-label="Borrar">✕</button></div>'});
  return h2+'</div>';
}
function openModal(kind){
  var m=root.querySelector('.pd-modal');m.innerHTML=modalHTML(kind);m.hidden=false;
}
function closeModal(){var m=root.querySelector('.pd-modal');m.hidden=true;m.innerHTML=''}
function loadProject(p){
  if(S.on)stop();
  P=p;S.solo={};S.sel={t:1,c:1};
  if(!P.tr[1].clips[1]){outer:for(var c=0;c<NS;c++)for(var t=0;t<4;t++)if(P.tr[t].clips[c]){S.sel={t:t,c:c};break outer}}
  ensureClip(S.sel.t,S.sel.c);save();renderAll();
}

/* ---------- eventos ---------- */
function onClick(e){
  var b=e.target.closest('[data-a]');if(!b||!root.contains(b))return;
  var a=b.getAttribute('data-a'),v=b.getAttribute('data-v'),t=+b.getAttribute('data-t'),c=+b.getAttribute('data-c');
  switch(a){
    case 'play':if(S.on)stop();else play(S.view==='arr'?'arr':'ses');break;
    case 'rec':toggleRec();break;
    case 'metro':P.metro=!P.metro;save();renderBar();break;
    case 'mode':P.mode=v;save();mission('key');renderBar();renderMain();renderDetail();break;
    case 'view':if(S.view!==v){if(S.on)stop();S.view=v;renderBar();renderMain()}break;
    case 'mis':openModal('mis');break;
    case 'proj':openModal('proj');break;
    case 'close':closeModal();break;
    case 'launch':launch(t,c);break;
    case 'slot':selectClip(t,c);break;
    case 'scene':launchScene(c);selectScene(c);break;
    case 'stoptrack':if(S.on&&S.mode==='ses')S.pend[t]=-1;paintStates();break;
    case 'mute':P.tr[t].mute=!P.tr[t].mute;applyMix();save();if(P.tr[t].mute)mission('mix');renderMain();break;
    case 'solo':S.solo[t]=!S.solo[t];applyMix();mission('mix');renderMain();break;
    case 'brush':S.brush=+v===-1?-1:c;if(b.getAttribute('data-c')==='-1')S.brush=-1;renderMain();break;
    case 'arrcol':for(var i=0;i<4;i++)paintArr(i,+b.getAttribute('data-b'));save();arrDone();renderMain();break;
    case 'arrcell':paintArr(t,+b.getAttribute('data-b'));save();arrDone();renderMain();break;
    case 'panel':S.panel=v;renderDetail();break;
    case 'bars':{var cl=curClip();if(cl){setBars(cl,S.sel.t,+v);save();renderDetail();if(S.view==='ses')renderMain()}break}
    case 'copy':{var cc=curClip();if(cc){S.clip={kind:TR[S.sel.t].kind,data:clone(cc)};toast('Clip copiado. Toca otro cuadro y pulsa Pegar.');renderDetail()}break}
    case 'paste':if(S.clip&&S.clip.kind===TR[S.sel.t].kind){P.tr[S.sel.t].clips[S.sel.c]=clone(S.clip.data);save();renderDetail();renderMain()}break;
    case 'clear':{var c2=curClip();if(c2){if(c2.d)c2.d={};else c2.n=[];save();renderDetail();renderMain()}break}
    case 'del':
      P.tr[S.sel.t].clips[S.sel.c]=null;for(var k=0;k<ARR;k++)if(P.arr[S.sel.t][k]===S.sel.c)P.arr[S.sel.t][k]=null;
      if(S.on&&S.mode==='ses'&&S.cl[S.sel.t]===S.sel.c)S.pend[S.sel.t]=-1;
      save();renderDetail();renderMain();break;
    case 'inst':
      P.tr[S.sel.t].inst=v;save();mission('inst');renderDetail();if(S.view==='ses')renderMain();
      if(TR[S.sel.t].kind==='drum')prevDrum('kick');else prevNote(S.sel.t,0);break;
    case 'pat':applyPat(v);prevDrum('snare');break;
    case 'prog':applyProg(+v);break;
    case 'follow':applyFollow();break;
    case 'surprise':surprise();break;
    case 'tool':S.tool=v;renderDetail();break;
    case 'dprev':prevDrum(v);break;
    case 'kprev':prevNote(S.sel.t,+v);break;
    case 'tpl':loadProject(v==='z'?emptyProject():template(v));closeModal();break;
    case 'save':{
      var nm=(document.getElementById('pd-name').value||'').trim()||('Canción '+(store.get('prod_saves',[]).length+1));
      var l=store.get('prod_saves',[]);l.unshift({name:nm,p:clone(P)});store.set('prod_saves',l.slice(0,30));
      mission('save');openModal('proj');toast('Guardado: '+nm);break}
    case 'load':{var s=store.get('prod_saves',[])[+b.getAttribute('data-i')];if(s){loadProject(clone(s.p));closeModal();toast('Abierto: '+s.name)}break}
    case 'delsave':{var l2=store.get('prod_saves',[]);l2.splice(+b.getAttribute('data-i'),1);store.set('prod_saves',l2);openModal('proj');break}
  }
}
function selectScene(c){
  var t=S.sel.t;
  if(!P.tr[t].clips[c]){for(var i=0;i<4;i++)if(P.tr[i].clips[c]){t=i;break}}
  S.sel={t:t,c:c};ensureClip(t,c);renderDetail();paintStates();
}
function toggleRec(){
  if(S.rec){S.rec=false;renderBar();if(S.panel==='keys')renderDetail();return}
  if(S.view==='arr'){if(S.on)stop();S.view='ses';renderMain()}
  S.panel='keys';
  var t=S.sel.t,c=S.sel.c;ensureClip(t,c);
  if(!S.on||S.mode!=='ses'){if(S.on)stop();play('ses',function(){S.pend[t]=c})}
  else if(S.cl[t]!==c)S.pend[t]=c;
  S.rec=true;
  renderBar();renderMain();renderDetail();
  toast('● Grabando: toca el teclado y se queda en el clip.');
}
function onInput(e){
  var el=e.target,t=+el.getAttribute('data-t');
  if(el.classList.contains('pd-vol')){P.tr[t].vol=+el.value;applyMix()}
  else if(el.classList.contains('pd-send')){P.tr[t].send=+el.value;applyMix()}
  else if(el.classList.contains('pd-mvol')){P.master=+el.value;applyMix()}
  else if(el.classList.contains('pd-bpm')){P.bpm=+el.value;el.nextElementSibling.textContent=P.bpm}
}
function onChange(e){
  var el=e.target;
  if(el.classList.contains('pd-vol')||el.classList.contains('pd-send')||el.classList.contains('pd-mvol')){save();mission('mix')}
  else if(el.classList.contains('pd-bpm')){save();mission('bpm')}
  else if(el.getAttribute('data-a')==='key'){P.root=+el.value;save();mission('key');renderDetail();if(S.view==='ses')renderMain();prevNote(S.sel.t===0?3:S.sel.t,0)}
}

/* ---- dibujar en el editor ---- */
function cellAt(e,el){
  var r=el.getBoundingClientRect(),n=+el.getAttribute('data-n'),Rn=+el.getAttribute('data-r');
  return {col:clamp(Math.floor((e.clientX-r.left)/r.width*n),0,n-1),row:clamp(Math.floor((e.clientY-r.top)/r.height*Rn),0,Rn-1),n:n,Rn:Rn};
}
function onDown(e){
  var key=e.target.closest('[data-k]');
  if(key&&root.contains(key)){e.preventDefault();keyDown(e,key);return}
  var el=e.target.closest('.pd-cells');
  if(!el||!root.contains(el))return;
  e.preventDefault();
  var clip=curClip();if(!clip)return;
  var p=cellAt(e,el);
  try{el.setPointerCapture(e.pointerId)}catch(x){}
  if(el.getAttribute('data-kind')==='drum'){
    var id=DR[p.row].id,val=!dget(clip,id,p.col);
    D={kind:'drum',el:el,id:id,row:p.row,val:val,last:p.col};
    dset(clip,id,p.col,val);el.children[p.row*p.n+p.col].classList.toggle('on',val);
    if(val){prevDrum(id);noteMission()}
    return;
  }
  var T=TR[S.sel.t],deg=p.Rn-1-p.row,hit=null;
  clip.n.forEach(function(x,i){if(x[2]===deg&&p.col>=x[0]&&p.col<x[0]+x[1])hit=i});
  if(hit!==null){clip.n.splice(hit,1);D=null;refreshNotes(el,clip,T);save();return}
  var group=(T.id==='chords'&&S.tool==='chord')?[0,2,4]:[0];
  var made=group.map(function(o){var x=[p.col,1,deg+o];clip.n.push(x);return x});
  D={kind:'note',el:el,anchor:p.col,notes:made,n:p.n};
  made.forEach(function(x){prevNote(S.sel.t,x[2])});
  noteMission();
  refreshNotes(el,clip,T);
}
function onMove(e){
  if(!D)return;
  var clip=curClip();if(!clip){D=null;return}
  var p=cellAt(e,D.el);
  if(D.kind==='drum'){
    var a=Math.min(D.last,p.col),b=Math.max(D.last,p.col);
    for(var c=a;c<=b;c++){if(dget(clip,D.id,c)!==D.val){dset(clip,D.id,c,D.val);D.el.children[D.row*p.n+c].classList.toggle('on',D.val)}}
    D.last=p.col;return;
  }
  var len=clamp(p.col-D.anchor+1,1,D.n-D.anchor);
  if(D.notes[0][1]!==len){D.notes.forEach(function(x){x[1]=len});refreshNotes(D.el,clip,TR[S.sel.t])}
}
function onUp(e){
  keyUp(e);
  if(D){D=null;save();if(S.view==='ses')renderMainSoft()}
}
function renderMainSoft(){
  Array.prototype.forEach.call(root.querySelectorAll('.pd-slot'),function(el){
    var t=+el.getAttribute('data-t'),c=+el.getAttribute('data-c'),clip=P.tr[t].clips[c];
    var cb=el.querySelector('.pd-cb');if(!clip||!cb)return;
    var m=cb.querySelector('.pd-mini');if(m){var tmp=document.createElement('div');tmp.innerHTML=mini(t,clip);m.parentNode.replaceChild(tmp.firstChild,m)}
  });
}
function refreshNotes(el,clip,T){var nl=el.querySelector('.pd-notes');if(nl)nl.innerHTML=notesHTML(clip,T)}

/* ---- teclado en vivo ---- */
function keyDown(e,key){
  var e2=ensure();if(!e2)return;
  var t=S.sel.t,T=TR[t],v=key.getAttribute('data-v'),kind=key.getAttribute('data-k');
  key.classList.add('hit');
  var rec={key:key,t0:E.a.currentTime,notes:null,max:1};
  var clip=curClip();
  var loc=S.rec&&clip?curLoc(t,S.sel.c):null;
  if(kind==='d'){
    R.inst.drum(v,0,.9,false,e2.tr[0].in,P.tr[0].inst);
    if(loc!==null&&clip){dset(clip,v,Math.round(loc)%(clip.bars*16),true);save();mission('rec')}
  }else{
    var d=+v,degs=(T.id==='chords'&&S.tool==='chord')?[d,d+2,d+4]:[d];
    degs.forEach(function(x){R.inst.note(P.tr[t].inst,pitch(T.id,x),0,.6,VOL[T.id]*1.3,false,e2.tr[t].in)});
    if(loc!==null&&clip){
      var st=Math.round(loc)%(clip.bars*16);
      rec.notes=degs.map(function(x){var n=[st,1,x];clip.n.push(n);return n});rec.max=clip.bars*16-st;mission('rec');
    }
  }
  KH[e.pointerId]=rec;
}
function keyUp(e){
  var r=KH[e.pointerId];if(!r)return;
  delete KH[e.pointerId];
  r.key.classList.remove('hit');
  if(r.notes){
    var len=clamp(Math.round((E.a.currentTime-r.t0)/sd()),1,r.max);
    r.notes.forEach(function(n){n[1]=len});save();
  }
}

/* ---------- montaje ---------- */
function fit(){
  if(!root)return;
  var pd=root.querySelector('.pd');if(!pd)return;
  if(window.innerWidth<700||window.innerHeight>window.innerWidth){pd.style.height='';pd.classList.add('flow');return}
  pd.classList.remove('flow');
  var top=pd.getBoundingClientRect().top+window.scrollY;
  pd.style.height=Math.max(430,window.innerHeight-top-10)+'px';
}
function render(el){
  root=el;
  el.innerHTML='<div class="pd"><div class="pd-rot">🔄 Gira la tablet para tocar con más espacio</div><div class="pd-bar"></div><div class="pd-main"></div><div class="pd-detail"></div><div class="pd-toast" role="status"></div><div class="pd-modal" hidden></div></div>';
  if(!el.__pd){
    el.__pd=true;
    el.addEventListener('click',onClick);
    el.addEventListener('input',onInput);
    el.addEventListener('change',onChange);
    el.addEventListener('pointerdown',onDown);
    el.addEventListener('pointermove',onMove);
    el.addEventListener('pointerup',onUp);
    el.addEventListener('pointercancel',onUp);
    el.addEventListener('contextmenu',function(e){if(e.target.closest('.pd'))e.preventDefault()});
    window.addEventListener('resize',fit);
    window.addEventListener('orientationchange',function(){setTimeout(fit,200)});
  }
  if(!P.tr[S.sel.t].clips[S.sel.c])ensureClip(S.sel.t,S.sel.c);
  renderAll();fit();
  if(S.on){cancelAnimationFrame(E.raf);E.raf=requestAnimationFrame(frame)}
}
function closeModalSafe(){if(root){var m=root.querySelector('.pd-modal');if(m){m.hidden=true;m.innerHTML=''}}}
R.views.productor={render:function(el){render(el);setTimeout(fit,60)},leave:function(){if(S.on)stop();closeModalSafe()}};
R.productor={state:S,project:function(){return P},engine:function(){return E}};
})();
