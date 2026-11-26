/* Rehearsal · Estudio: armar loops como un juego (batería, bajo, melodía, acordes, voz y teclado en vivo) */
(function(){
'use strict';
var R=window.REH,store=R.store,esc=R.esc,K=R.piano;
var NAMES12=['Do','Do♯','Re','Mi♭','Mi','Fa','Fa♯','Sol','La♭','La','Si♭','Si'];
var DR=R.inst.drums;
var SC={
  pmaj:[0,2,4,7,9,12,14,16],pmin:[0,3,5,7,10,12,15,17],
  fmaj:[0,2,4,5,7,9,11,12],fmin:[0,2,3,5,7,8,10,12]
};
var DIA={
  maj:{semi:[0,2,4,5,7,9,11],type:['maj','min','min','maj','maj','min','dim'],rom:['I','ii','iii','IV','V','vi','vii°']},
  min:{semi:[0,2,3,5,7,8,10],type:['min','dim','maj','min','min','maj','maj'],rom:['i','ii°','III','iv','v','VI','VII']}
};
var TRI={maj:[0,4,7],min:[0,3,7],dim:[0,3,6]};
var PRESETS={
  rock:{kick:'x.......x.x.....',snare:'....x.......x...',hat:'x.x.x.x.x.x.x.x.'},
  hiphop:{kick:'x......x..x.....',snare:'....x.......x...',hat:'x.x.x.x.x.x.x.x.',ohat:'..............x.'},
  reggaeton:{kick:'x...x...x...x...',snare:'...x..x...x..x..',hat:'..x...x...x...x.'},
  disco:{kick:'x...x...x...x...',clap:'....x.......x...',hat:'x.x.x.x.x.x.x.x.',ohat:'..x...x...x...x.'},
  pop:{kick:'x.....x.x.......',snare:'....x.......x...',hat:'x.x.x.x.x.x.x.x.',clap:'....x.......x...'}
};
var PRESET_NAMES={rock:'Rock',hiphop:'Hip hop',reggaeton:'Reggaetón',disco:'Disco',pop:'Pop'};
var PROGS={'I–V–vi–IV':[0,4,5,3],'I–IV–V–I':[0,3,4,0],'vi–IV–I–V':[5,3,0,4],'I–vi–IV–V':[0,5,3,4]};

function blankRow(n){var a=[];for(var i=0;i<n;i++)a.push(null);return a}
function blankDrums(n){var o={};DR.forEach(function(d){o[d.id]=[];for(var i=0;i<n;i++)o[d.id].push(false)});return o}
function defaultP(){
  var P={bpm:96,root:0,mode:'maj',easy:true,len:16,drums:blankDrums(16),bass:blankRow(16),mel:blankRow(16),chords:[null,null,null,null],
    insB:'bass',insM:'synth',insC:'organ',insL:'piano',vol:{drums:.9,bass:.85,mel:.8,chords:.55,voice:.9},mute:{},oct:0};
  applyPreset(P,'rock');
  P.bass[0]=0;P.bass[3]=0;P.bass[8]=3;P.bass[11]=3;
  P.mel[0]=4;P.mel[2]=5;P.mel[4]=4;P.mel[6]=2;P.mel[8]=3;P.mel[12]=1;
  P.chords=[0,4,5,3];
  return P;
}
function applyPreset(P,id){
  var pr=PRESETS[id];P.drums=blankDrums(P.len);
  Object.keys(pr).forEach(function(k){for(var i=0;i<P.len;i++)P.drums[k][i]=pr[k].charAt(i%16)==='x'});
}
var P=store.get('studio',null);
if(!P||!P.drums||!P.vol)P=defaultP();
P.mute=P.mute||{};
function save(){store.set('studio',P)}

/* ----- escala ----- */
function rowsKey(){return (P.easy?'p':'f')+P.mode}
function semis(){return SC[rowsKey()]}
function baseMel(){return 60+(P.root>=6?P.root-12:P.root)}
function baseBass(){return 36+P.root}
function noteName(m){return NAMES12[((m%12)+12)%12]}
function scalePcs(){var s={};SC['f'+P.mode].forEach(function(x){s[(P.root+x)%12]=1});return s}

/* ----- motor de reproducción ----- */
var Sch={on:false,next:0,step:0,timer:0,raf:0,q:[],cur:-1};
var Rec={on:false};
var Voice={buf:null,busy:false};
function stepDur(){return 60/P.bpm/4}
function vol(k,v){return P.mute[k]?0:v}
function scheduleStep(s,t){
  var sd=stepDur();
  DR.forEach(function(d){if(P.drums[d.id][s]){var v=vol('drums',P.vol.drums);if(v)R.inst.drum(d.id,t,v*.85,true)}});
  var bv=vol('bass',P.vol.bass);
  if(bv&&P.bass[s]!==null&&P.bass[s]!==undefined)R.inst.note(P.insB,baseBass()+semis()[P.bass[s]],t,sd*1.8,.4*bv,true);
  var mv=vol('mel',P.vol.mel);
  if(mv&&P.mel[s]!==null&&P.mel[s]!==undefined){
    var len=1;while(len<6&&P.mel[(s+len)%P.len]===null&&(s+len)<P.len)len++;
    R.inst.note(P.insM,baseMel()+semis()[P.mel[s]],t,sd*len*.95,.34*mv,true);
  }
  var cv=vol('chords',P.vol.chords);
  if(cv&&s%4===0){
    var ci=P.chords[s/4];
    if(ci!==null&&ci!==undefined)chordMidis(ci).forEach(function(m){R.inst.note(P.insC,m,t,sd*4*.95,.22*cv,true)});
  }
  if(s===0&&Voice.buf&&!P.mute.voice){
    var a=R.audio(),src=a.createBufferSource(),g=a.createGain();src.buffer=Voice.buf;g.gain.value=P.vol.voice;src.connect(g);g.connect(R.master());src.start(t);
  }
}
function chordMidis(ci){
  var d=DIA[P.mode],pc=(P.root+d.semi[ci])%12,base=48+(pc>=6?pc-12:pc);
  return TRI[d.type[ci]].map(function(x){return base+x});
}
function chordName(ci){
  var d=DIA[P.mode],pc=(P.root+d.semi[ci])%12,t=d.type[ci];
  return NAMES12[pc]+(t==='min'?' m':t==='dim'?' dim':'');
}
function tick(){
  var a=R.audio();if(!a)return;
  while(Sch.next<a.currentTime+.15){
    scheduleStep(Sch.step,Sch.next);Sch.q.push({s:Sch.step,t:Sch.next});
    Sch.next+=stepDur();Sch.step=(Sch.step+1)%P.len;
  }
}
function start(){
  if(Sch.on)return;
  var a=R.audioReady();if(!a)return;
  if(a.state==='suspended')a.resume();
  Sch.on=true;Sch.step=0;Sch.q=[];Sch.next=a.currentTime+.08;
  Sch.timer=setInterval(tick,25);tick();
  var loop=function(){
    if(!Sch.on)return;
    var now=R.audio().currentTime;
    while(Sch.q.length&&Sch.q[0].t<=now){Sch.cur=Sch.q.shift().s;paintHead()}
    Sch.raf=requestAnimationFrame(loop);
  };
  Sch.raf=requestAnimationFrame(loop);
  syncTransport();
}
function stop(){
  if(!Sch.on)return;
  Sch.on=false;clearInterval(Sch.timer);cancelAnimationFrame(Sch.raf);Sch.cur=-1;Sch.q=[];Rec.on=false;
  paintHead();syncTransport();
}

/* ----- interfaz ----- */
var host=null,colsCache=null,lastCol=-1;
function paintHead(){
  if(!host)return;
  if(lastCol>=0&&colsCache&&colsCache[lastCol])colsCache[lastCol].forEach(function(e){e.classList.remove('ph')});
  if(Sch.cur>=0&&colsCache&&colsCache[Sch.cur])colsCache[Sch.cur].forEach(function(e){e.classList.add('ph')});
  lastCol=Sch.cur;
}
function buildCols(){
  colsCache=[];for(var i=0;i<P.len;i++)colsCache.push(Array.prototype.slice.call(host.querySelectorAll('[data-s="'+i+'"]')));
  lastCol=-1;
}
function syncTransport(){
  var b=host&&host.querySelector('.st-play');if(!b)return;
  b.setAttribute('data-on',Sch.on?'1':'0');b.setAttribute('aria-label',Sch.on?'Parar':'Tocar');
  var r=host.querySelector('[data-st="rec"]');if(r)r.setAttribute('aria-pressed',String(Rec.on));
}
function sel(name,cur,list){
  return '<select data-st="'+name+'" aria-label="Sonido">'+list.map(function(n){return '<option value="'+n.id+'"'+(cur===n.id?' selected':'')+'>'+n.label+'</option>'}).join('')+'</select>';
}
function volRow(k,label){
  return '<div class="st-mix"><button class="st-m" data-st="mute" data-k="'+k+'" aria-pressed="'+!!P.mute[k]+'" aria-label="Silenciar '+label+'">'+(P.mute[k]?'🔇':'🔊')+'</button><input type="range" min="0" max="1" step="0.05" value="'+P.vol[k]+'" data-st="vol" data-k="'+k+'" aria-label="Volumen '+label+'"></div>';
}
function drumGrid(){
  return DR.map(function(d){
    var cells='';
    for(var s=0;s<P.len;s++)cells+='<button class="st-c'+(P.drums[d.id][s]?' on':'')+(s%4===0?' g':'')+'" style="--c:'+d.color+'" data-st="dcell" data-r="'+d.id+'" data-s="'+s+'" aria-label="'+d.label+' paso '+(s+1)+'" aria-pressed="'+!!P.drums[d.id][s]+'"></button>';
    return '<div class="st-row"><span class="st-lb">'+d.label+'</span><div class="st-cells" style="--n:'+P.len+'">'+cells+'</div></div>';
  }).join('');
}
function noteGrid(track){
  var sm=semis(),base=track==='bass'?baseBass():baseMel(),rows='';
  for(var r=sm.length-1;r>=0;r--){
    var m=base+sm[r],pc=((m%12)+12)%12,cells='';
    for(var s=0;s<P.len;s++){
      var on=P[track][s]===r;
      cells+='<button class="st-c'+(on?' on':'')+(s%4===0?' g':'')+'" style="--c:'+K.col(pc,64)+'" data-st="ncell" data-t="'+track+'" data-r="'+r+'" data-s="'+s+'" aria-label="'+noteName(m)+' paso '+(s+1)+'" aria-pressed="'+on+'"></button>';
    }
    rows+='<div class="st-row"><span class="st-lb" style="color:'+K.col(pc,72)+'">'+noteName(m)+'</span><div class="st-cells" style="--n:'+P.len+'">'+cells+'</div></div>';
  }
  return rows;
}
function chordRow(){
  var d=DIA[P.mode],slots=P.len/4,h='';
  for(var i=0;i<slots;i++){
    var opts='<option value="">—</option>'+d.semi.map(function(x,ci){return '<option value="'+ci+'"'+(P.chords[i]===ci?' selected':'')+'>'+d.rom[ci]+' · '+chordName(ci)+'</option>'}).join('');
    h+='<label class="field st-slot" data-s="'+(i*4)+'">Tiempo '+(i+1)+'<select data-st="chord" data-i="'+i+'">'+opts+'</select></label>';
  }
  return '<div class="st-chords">'+h+'</div>';
}
function liveHTML(){
  var pcs=scalePcs(),start=60+P.oct*12,mids=[];
  for(var m=start;m<start+24;m++)if(pcs[m%12])mids.push(m);
  return K.keyboard({mids:mids,start:start,span:24,hideFinger:true});
}
function padsHTML(){
  return '<div class="st-pads">'+DR.map(function(d){return '<button class="st-pad" style="--c:'+d.color+'" data-st="pad" data-id="'+d.id+'">'+d.label+'</button>'}).join('')+'</div>';
}
function saveListHTML(){
  var list=store.get('studio_saves',[]);
  return list.length?'<div class="st-saves">'+list.map(function(x,i){return '<div class="st-save"><b>'+esc(x.name)+'</b><span class="small">'+x.p.bpm+' bpm</span><button class="btn" data-st="load" data-i="'+i+'">Abrir</button><button class="btn" data-st="delsave" data-i="'+i+'" aria-label="Borrar '+esc(x.name)+'">✕</button></div>'}).join('')+'</div>':'<p class="small">Todavía no guardaste ningún loop.</p>';
}
function head(title,emoji,color,right){
  return '<div class="st-h" style="--c:'+color+'"><span class="st-e">'+emoji+'</span><h3>'+title+'</h3><div class="st-r">'+(right||'')+'</div></div>';
}
function render(el){
  host=el;
  var keyOpts=NAMES12.map(function(n,i){return '<option value="'+i+'"'+(P.root===i?' selected':'')+'>'+n+'</option>'}).join('');
  var presets=Object.keys(PRESETS).map(function(k){return '<button class="chip" data-st="preset" data-v="'+k+'">'+PRESET_NAMES[k]+'</button>'}).join('');
  var progs=Object.keys(PROGS).map(function(k){return '<button class="chip" data-st="prog" data-v="'+k+'">'+k+'</button>'}).join('');
  var inst=R.inst.names;
  el.innerHTML='<div class="stack st">'
   +'<div class="card st-top"><div class="st-trans"><button class="st-play" data-st="play" data-on="'+(Sch.on?1:0)+'" aria-label="Tocar"><svg class="i-p" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg><svg class="i-s" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><rect x="6.5" y="6.5" width="11" height="11" rx="2.5"/></svg></button>'
   +'<div class="stepper" aria-label="Velocidad"><button data-st="bpm" data-v="-4" aria-label="Más lento">−</button><output>'+P.bpm+' bpm</output><button data-st="bpm" data-v="4" aria-label="Más rápido">+</button></div>'
   +'<button class="btn st-rec" data-st="rec" aria-pressed="'+Rec.on+'">● Grabar mis toques</button></div>'
   +'<div class="row st-key"><label class="field">Tonalidad<select data-st="root">'+keyOpts+'</select></label>'
   +'<div class="seg" role="group" aria-label="Modo"><button data-st="mode" data-v="maj" aria-pressed="'+(P.mode==='maj')+'">Alegre</button><button data-st="mode" data-v="min" aria-pressed="'+(P.mode==='min')+'">Misterioso</button></div>'
   +'<div class="seg" role="group" aria-label="Notas"><button data-st="easy" data-v="1" aria-pressed="'+P.easy+'">Notas fáciles</button><button data-st="easy" data-v="0" aria-pressed="'+!P.easy+'">Todas</button></div></div>'
   +'<p class="small" style="margin:6px 0 0">Con "Notas fáciles" todo lo que pongas suena bien junto.</p></div>'
   +'<div class="card st-card">'+head('Caja de ritmo','🥁','#ff8a6a',volRow('drums','batería'))+'<div class="chips" style="margin:2px 0 12px">'+presets+'<button class="chip" data-st="clear" data-v="drums">Limpiar</button></div><div class="scroll-x st-scroll"><div class="st-grid">'+drumGrid()+'</div></div></div>'
   +'<div class="card st-card">'+head('Bajo','🎸','#58dcaa',sel('insB',P.insB,inst)+volRow('bass','bajo'))+'<div class="scroll-x st-scroll"><div class="st-grid">'+noteGrid('bass')+'</div></div><div class="row" style="margin-top:8px"><button class="chip" data-st="clear" data-v="bass">Limpiar</button></div></div>'
   +'<div class="card st-card">'+head('Melodía','🎹','#a98fff',sel('insM',P.insM,inst)+volRow('mel','melodía'))+'<div class="scroll-x st-scroll"><div class="st-grid">'+noteGrid('mel')+'</div></div><div class="row" style="margin-top:8px"><button class="chip" data-st="clear" data-v="mel">Limpiar</button></div></div>'
   +'<div class="card st-card">'+head('Acordes','🎼','#6fd0ff',sel('insC',P.insC,inst)+volRow('chords','acordes'))+'<div class="chips" style="margin:2px 0 12px">'+progs+'<button class="chip" data-st="clear" data-v="chords">Limpiar</button></div>'+chordRow()+'</div>'
   +'<div class="card st-card">'+head('Mi voz o sonido','🎤','#ff7ab8',volRow('voice','voz'))+'<p class="small" style="margin-top:0">Graba un compás con el micrófono (mejor con audífonos). Se repite en cada vuelta. No se guarda al cerrar.</p><div class="row"><button class="btn'+(Voice.busy?' primary':'')+'" data-st="voice">'+(Voice.busy?'Grabando…':'● Grabar un compás')+'</button>'+(Voice.buf?'<button class="btn" data-st="novoice">Borrar grabación</button>':'')+'</div><p class="msg" id="st-msg"></p></div>'
   +'<div class="card st-card">'+head('Toca en vivo','✨','#ffd166',sel('insL',P.insL,inst))+'<div class="row" style="margin-bottom:10px"><button class="btn" data-st="oct" data-v="-1">Octava ↓</button><button class="btn" data-st="oct" data-v="1">Octava ↑</button><span class="small">Las teclas de colores son las notas de la tonalidad.</span></div><div class="scroll-x pa-wrap" id="st-live">'+liveHTML()+'</div>'+padsHTML()+'</div>'
   +'<div class="card st-card">'+head('Mis loops','💾','#ffd166','')+'<div class="row"><input class="sg-in" id="st-name" placeholder="Nombre de tu loop" style="flex:1;min-width:160px"><button class="btn primary" data-st="save">Guardar</button><button class="btn" data-st="new">Nuevo loop</button></div><div id="st-saves">'+saveListHTML()+'</div></div>'
   +'</div>';
  if(!el.__st){
    el.__st=true;
    el.addEventListener('click',onClick);
    el.addEventListener('change',onChange);
    el.addEventListener('input',onInput);
  }
  buildCols();paintHead();
}
function redraw(){var y=window.scrollY;render(host);window.scrollTo(0,y)}

function recordNote(track,idxFn){
  if(!Rec.on||!Sch.on)return;
  var s=(Sch.cur+1)%P.len;       /* un poco adelantado: queda en el paso que viene */
  var idx=idxFn();if(idx===null)return;
  P[track][s]=idx;save();
  var c=host.querySelector('[data-st="ncell"][data-t="'+track+'"][data-s="'+s+'"]');
  redraw();
}
function rowForMidi(track,m){
  var sm=semis(),base=track==='bass'?baseBass():baseMel(),pc=((m%12)+12)%12,best=null,bd=99;
  sm.forEach(function(x,r){var p=((base+x)%12+12)%12,d=Math.min(Math.abs(p-pc),12-Math.abs(p-pc));if(d<bd){bd=d;best=r}});
  return best;
}
function onClick(e){
  var pk=e.target.closest('.pk');
  if(pk){
    var m=+pk.getAttribute('data-m');R.audioReady();
    R.inst.note(P.insL,m,0,1.2,.3);
    pk.style.opacity='.6';setTimeout(function(){pk.style.opacity=''},140);
    if(Rec.on&&Sch.on){var s=(Sch.cur+1)%P.len;P.mel[s]=rowForMidiOct(m);save();redrawGridOnly('mel')}
    return;
  }
  var b=e.target.closest('[data-st]');if(!b)return;
  var a=b.getAttribute('data-st'),v=b.getAttribute('data-v');
  switch(a){
    case 'play':if(Sch.on)stop();else start();break;
    case 'bpm':P.bpm=Math.max(50,Math.min(180,P.bpm+(+v)));save();b.parentNode.querySelector('output').textContent=P.bpm+' bpm';break;
    case 'rec':
      if(!Sch.on){start()}
      Rec.on=!Rec.on;syncTransport();break;
    case 'dcell':
      var id=b.getAttribute('data-r'),s=+b.getAttribute('data-s');
      P.drums[id][s]=!P.drums[id][s];save();
      b.classList.toggle('on',P.drums[id][s]);b.setAttribute('aria-pressed',String(P.drums[id][s]));
      if(P.drums[id][s]){R.audioReady();R.inst.drum(id,0,.7)}
      break;
    case 'ncell':
      var t=b.getAttribute('data-t'),r=+b.getAttribute('data-r'),s2=+b.getAttribute('data-s');
      P[t][s2]=(P[t][s2]===r)?null:r;save();
      Array.prototype.forEach.call(host.querySelectorAll('[data-st="ncell"][data-t="'+t+'"][data-s="'+s2+'"]'),function(c){var on=(+c.getAttribute('data-r')===P[t][s2]);c.classList.toggle('on',on);c.setAttribute('aria-pressed',String(on))});
      if(P[t][s2]!==null){R.audioReady();R.inst.note(t==='bass'?P.insB:P.insM,(t==='bass'?baseBass():baseMel())+semis()[r],0,.5,.34)}
      break;
    case 'preset':applyPreset(P,v);save();redraw();break;
    case 'prog':{var pr=PROGS[v];for(var i=0;i<P.chords.length;i++)P.chords[i]=pr[i%pr.length];save();redraw();break}
    case 'clear':
      if(v==='drums')P.drums=blankDrums(P.len);else if(v==='chords')P.chords=P.chords.map(function(){return null});else P[v]=blankRow(P.len);
      save();redraw();break;
    case 'mode':P.mode=v;save();redraw();break;
    case 'easy':P.easy=v==='1';
      /* mantener el contenido: los índices se reinterpretan, así que limpiamos las notas para no sonar raro */
      P.bass=blankRow(P.len);P.mel=blankRow(P.len);save();redraw();break;
    case 'mute':P.mute[b.getAttribute('data-k')]=!P.mute[b.getAttribute('data-k')];save();b.textContent=P.mute[b.getAttribute('data-k')]?'🔇':'🔊';b.setAttribute('aria-pressed',String(!!P.mute[b.getAttribute('data-k')]));break;
    case 'oct':P.oct=Math.max(-1,Math.min(1,P.oct+(+v)));save();document.getElementById('st-live').innerHTML=liveHTML();break;
    case 'pad':
      var did=b.getAttribute('data-id');R.audioReady();R.inst.drum(did,0,.85);
      b.classList.add('hit');setTimeout(function(){b.classList.remove('hit')},110);
      if(Rec.on&&Sch.on){var st2=(Sch.cur+1)%P.len;P.drums[did][st2]=true;save();var c2=host.querySelector('[data-st="dcell"][data-r="'+did+'"][data-s="'+st2+'"]');if(c2){c2.classList.add('on');c2.setAttribute('aria-pressed','true')}}
      break;
    case 'voice':recordVoice();break;
    case 'novoice':Voice.buf=null;redraw();break;
    case 'save':{
      var nm=(document.getElementById('st-name').value||'').trim()||('Loop '+(store.get('studio_saves',[]).length+1));
      var list=store.get('studio_saves',[]);list.unshift({name:nm,p:JSON.parse(JSON.stringify(P))});store.set('studio_saves',list.slice(0,30));
      document.getElementById('st-saves').innerHTML=saveListHTML();document.getElementById('st-name').value='';toast('Guardado ✓');break}
    case 'load':{var l=store.get('studio_saves',[])[+b.getAttribute('data-i')];if(l){stop();P=JSON.parse(JSON.stringify(l.p));P.mute=P.mute||{};save();redraw();toast('Abierto: '+l.name)}break}
    case 'delsave':{var l2=store.get('studio_saves',[]);l2.splice(+b.getAttribute('data-i'),1);store.set('studio_saves',l2);document.getElementById('st-saves').innerHTML=saveListHTML();break}
    case 'new':if(window.confirm('¿Empezar un loop nuevo? Lo actual se borra si no lo guardaste.')){stop();P=defaultP();P.drums=blankDrums(16);applyPreset(P,'rock');P.bass=blankRow(16);P.mel=blankRow(16);P.chords=[null,null,null,null];save();redraw()}break;
  }
}
function rowForMidiOct(m){
  /* para grabar con el teclado: la fila de la nota más cercana en la escala visible */
  return rowForMidi('mel',m);
}
function redrawGridOnly(track){redraw()}
function onChange(e){
  var t=e.target,a=t.getAttribute&&t.getAttribute('data-st');if(!a)return;
  if(a==='root'){P.root=+t.value;save();redraw()}
  else if(a==='insB'||a==='insM'||a==='insC'||a==='insL'){P[a]=t.value;save();R.audioReady();R.inst.note(t.value,a==='insB'?baseBass()+12:baseMel(),0,.8,.3)}
  else if(a==='chord'){var i=+t.getAttribute('data-i');P.chords[i]=t.value===''?null:+t.value;save();if(t.value!==''){R.audioReady();chordMidis(+t.value).forEach(function(m){R.inst.note(P.insC,m,0,1,.22)})}}
}
function onInput(e){
  var t=e.target;
  if(t.getAttribute&&t.getAttribute('data-st')==='vol'){P.vol[t.getAttribute('data-k')]=+t.value;save()}
}
function toast(tx){
  var d=document.createElement('div');d.className='sg-toast';d.textContent=tx;document.body.appendChild(d);
  setTimeout(function(){d.classList.add('out')},1600);setTimeout(function(){d.remove()},2100);
}
function recordVoice(){
  var msg=document.getElementById('st-msg');
  if(!navigator.mediaDevices||!window.MediaRecorder){if(msg){msg.textContent='Este navegador no permite grabar aquí.';msg.className='msg err'}return}
  R.audioReady();
  navigator.mediaDevices.getUserMedia({audio:{echoCancellation:false,noiseSuppression:false}}).then(function(stream){
    var mr=new MediaRecorder(stream),chunks=[];
    Voice.busy=true;stop();start();redraw();
    mr.ondataavailable=function(ev){if(ev.data&&ev.data.size)chunks.push(ev.data)};
    mr.onstop=function(){
      stream.getTracks().forEach(function(t){t.stop()});
      new Blob(chunks).arrayBuffer().then(function(ab){return R.audio().decodeAudioData(ab)}).then(function(buf){Voice.buf=buf;Voice.busy=false;redraw();toast('¡Listo! Suena en cada vuelta')}).catch(function(){Voice.busy=false;redraw();var m2=document.getElementById('st-msg');if(m2){m2.textContent='No pude usar esa grabación.';m2.className='msg err'}});
    };
    mr.start();
    setTimeout(function(){try{mr.stop()}catch(e){}},P.len*stepDur()*1000+200);
  }).catch(function(err){
    if(msg){msg.textContent=err&&err.name==='NotAllowedError'?'El micrófono está bloqueado. Permítelo desde el candado de la barra de direcciones.':'No pude abrir el micrófono.';msg.className='msg err'}
  });
}

R.views.estudio={render:function(el){render(el)},leave:function(){stop()}};
})();
