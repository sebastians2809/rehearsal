/* Rehearsal · Piano para aprender acordes (pensado para Bruno) */
(function(){
'use strict';
var R=window.REH,CT=R.CT,store=R.store,esc=R.esc;
var ROOTS12=[['C',0],['C',1],['D',0],['E',-1],['E',0],['F',0],['F',1],['G',0],['A',-1],['A',0],['B',-1],['B',0]];
var NAMES12=['Do','Do♯','Re','Mi♭','Mi','Fa','Fa♯','Sol','La♭','La','Si♭','Si'];
var GROUPS=[
  {t:'Los primeros',ids:['maj','min']},
  {t:'Para sentir tensión',ids:['dim','aug','sus2','sus4']},
  {t:'Con séptima',ids:['dom7','maj7','min7','m7b5','dim7']},
  {t:'Más colores',ids:['six','m6','add9','dom9']}
];
var DESC={maj:'Suena alegre y brillante',min:'Suena triste o misteriosa',dim:'Suena tensa, como suspenso',aug:'Suena rara, como flotando',
  dom7:'Suena bluesera, quiere moverse',maj7:'Suena soñadora y suave',min7:'Suena suave, de noche',m7b5:'Suena como una pregunta misteriosa',
  dim7:'Suena a película de misterio',sus2:'Suena abierta, sin decidir',sus4:'Suena abierta, quiere resolver',six:'Suena dulce, de música antigua',
  m6:'Suena elegante, de jazz',dom9:'Suena funky',add9:'Suena brillante y moderna'};
var LEVELS=[
  {n:1,t:'Fáciles',desc:'Mayores y menores de teclas blancas',pool:function(){var o=[];[0,2,4,5,7,9].forEach(function(pc){o.push([pc,'maj']);o.push([pc,'min'])});return o}},
  {n:2,t:'Mayores y menores',desc:'Todas las notas',pool:function(){var o=[];for(var pc=0;pc<12;pc++){o.push([pc,'maj']);o.push([pc,'min'])}return o}},
  {n:3,t:'Con misterio',desc:'Disminuidos, aumentados y sus',pool:function(){var o=[];for(var pc=0;pc<12;pc++)['maj','min','dim','aug','sus4'].forEach(function(t){o.push([pc,t])});return o}},
  {n:4,t:'Con séptima',desc:'Los más jazzeros',pool:function(){var o=[];for(var pc=0;pc<12;pc++)['dom7','maj7','min7','m7b5'].forEach(function(t){o.push([pc,t])});return o}}
];
function col(pc,l){return 'hsl('+(pc*30+(pc>5?0:0))+',78%,'+(l||62)+'%)'}
function pcOf(m){return ((m%12)+12)%12}

var S=store.get('pa',{root:0,type:'maj',inv:0,hand:'R',mode:'ver',level:1,snd:'piano'});
function save(){store.set('pa',S)}
var learned=store.get('pa_ok',{});
var Q={target:null,pressed:{},streak:0,best:store.get('pa_best',0),done:false,hint:false,msg:''};

function chordOf(pc,type){var r=ROOTS12[pc];return R.buildChord(r[0],r[1],type)}
function voicing(ch,inv){
  var base=60+ch.rootPc,m=[];
  ch.iv.forEach(function(s,i){var v=base+s;if(i>0&&s<ch.iv[i-1])v+=12;m.push(v)});
  m.sort(function(a,b){return a-b});
  for(var k=0;k<inv;k++){var f=m.shift();m.push(f+12)}
  var mx=m[m.length-1];
  if(mx>83)m=m.map(function(x){return x-12});
  return m;
}
function fingers(n,hand){
  var r=n===3?[1,3,5]:n===4?[1,2,3,5]:[1,2,3,4,5];
  return hand==='L'?r.slice().reverse():r;
}
function cifrado(ch){
  var l=ch.rootL+(ch.rootA>0?'♯':ch.rootA<0?'♭':'');
  return l+CT[ch.type].suf.replace(/^ /,'');
}

function sound(m,when,dur,vol){R.audioReady();R.inst.note(S.snd,m,when||0,dur||1.4,vol||.3)}

/* ----- teclado ----- */
function keyboard(opts){
  /* opts: mids (midis resaltados), fing (map midi->dedo), start, pressed (map pc? midi->true), hide(names) */
  var start=opts.start||60,end=start+(opts.span||24),W=44,H=190,BW=28,BH=118,wi=0,wh='',bl='';
  var black=[1,3,6,8,10];
  var hl=opts.mids||[];
  var map={};hl.forEach(function(m,i){map[m]=(opts.fing&&opts.fing[i])||0});
  for(var m=start;m<end;m++){
    var pc=pcOf(m),isB=black.indexOf(pc)>=0,on=hl.indexOf(m)>=0,pr=opts.pressed&&opts.pressed[m];
    var fill=isB?'var(--key-black)':'var(--key-white)';
    if(on&&!opts.hideChord)fill=col(pc,isB?46:70);
    if(pr)fill=pr==='bad'?'#ff6b6b':col(pc,isB?50:72);
    var label='',fing='';
    if(!isB){
      var x=wi*W;
      wh+='<rect class="pk" data-m="'+m+'" x="'+x+'" y="0" width="'+W+'" height="'+H+'" rx="7" fill="'+fill+'" stroke="var(--key-edge)" stroke-width="1.5"/>';
      if((on&&!opts.hideChord)||pr){
        wh+='<text x="'+(x+W/2)+'" y="'+(H-14)+'" class="pk-t" fill="#1a1230">'+R.ES[R.LET[[0,2,4,5,7,9,11].indexOf(pc)]]+'</text>';
        if(on&&map[m]&&!opts.hideFinger)wh+='<circle cx="'+(x+W/2)+'" cy="'+(H-52)+'" r="13" fill="#1a1230"/><text x="'+(x+W/2)+'" y="'+(H-47)+'" class="pk-f">'+map[m]+'</text>';
      }
      if(pc===0)wh+='<text x="'+(x+W/2)+'" y="'+(H+16)+'" class="pk-oc">Do'+(Math.floor(m/12)-1)+'</text>';
      wi++;
    }else{
      var bx=wi*W-BW/2;
      bl+='<rect class="pk" data-m="'+m+'" x="'+bx+'" y="0" width="'+BW+'" height="'+BH+'" rx="5" fill="'+fill+'" stroke="#000" stroke-opacity=".35"/>';
      if((on&&!opts.hideChord)||pr){
        if(on&&map[m]&&!opts.hideFinger)bl+='<circle cx="'+(bx+BW/2)+'" cy="'+(BH-20)+'" r="11" fill="#fff"/><text x="'+(bx+BW/2)+'" y="'+(BH-15.5)+'" class="pk-f" style="fill:#1a1230">'+map[m]+'</text>';
      }
    }
  }
  return '<svg viewBox="0 0 '+(wi*W)+' '+(H+24)+'" class="pa-kb" role="img" aria-label="Teclado de piano">'+wh+bl+'</svg>';
}

/* ----- vistas ----- */
function modeBar(){
  return '<div class="card pa-bar"><div class="seg" role="group" aria-label="Modo"><button data-pa="mode" data-v="ver" aria-pressed="'+(S.mode==='ver')+'">Aprender</button><button data-pa="mode" data-v="play" aria-pressed="'+(S.mode==='play')+'">Tu turno</button></div>'
    +'<label class="field pa-snd">Sonido<select data-pa="snd">'+R.inst.names.filter(function(n){return n.id!=='bass'}).map(function(n){return '<option value="'+n.id+'"'+(S.snd===n.id?' selected':'')+'>'+n.label+'</option>'}).join('')+'</select></label></div>';
}
function rootGrid(){
  return '<div class="pa-roots" role="group" aria-label="Nota de inicio">'+NAMES12.map(function(n,pc){
    var ok=learned[pc+'-'+S.type];
    return '<button class="pa-root" style="--c:'+col(pc,64)+'" data-pa="root" data-v="'+pc+'" aria-pressed="'+(S.root===pc)+'">'+n+(ok?'<i class="ok" aria-label="ya lo sabes">★</i>':'')+'</button>';
  }).join('')+'</div>';
}
function typeChips(){
  return GROUPS.map(function(g){
    return '<div class="pa-grp"><h4>'+g.t+'</h4><div class="chips">'+g.ids.map(function(id){
      return '<button class="chip" data-pa="type" data-v="'+id+'" aria-pressed="'+(S.type===id)+'">'+CT[id].label+'</button>';
    }).join('')+'</div></div>';
  }).join('');
}
function learnedCount(){return Object.keys(learned).filter(function(k){return learned[k]}).length}

function viewLearn(){
  var ch=chordOf(S.root,S.type),t=CT[S.type];
  var inv=Math.min(S.inv,ch.notes.length-1);
  var mids=voicing(ch,inv);
  var start=mids[0]>=72||mids[mids.length-1]>83?48:60;
  if(Math.min.apply(null,mids)<60)start=48;
  var fing=fingers(mids.length,S.hand);
  var names=mids.map(function(m){return NAMESOF(ch,m)});
  var steps='<div class="pa-steps">'+ch.notes.map(function(n,i){
    var gap=i?'<span class="gap">+'+(ch.iv[i]-ch.iv[i-1]+(ch.iv[i]<ch.iv[i-1]?12:0))+'</span>':'';
    return gap+'<span class="nt" style="--c:'+col(n.pc,70)+'">'+n.name+'</span>';
  }).join('')+'</div>';
  var invBtns='';
  for(var i=0;i<ch.notes.length;i++){
    invBtns+='<button class="chip" data-pa="inv" data-v="'+i+'" aria-pressed="'+(inv===i)+'">'+(i===0?'Posición normal':i+'ª vuelta')+'</button>';
  }
  var isOk=!!learned[S.root+'-'+S.type];
  return '<div class="card pa-hero"><div class="pa-name">'+esc(ch.rootName+' '+t.label.toLowerCase())+'</div>'
    +'<p class="sub">'+esc(DESC[S.type]||'')+' · se escribe <b>'+esc(cifrado(ch))+'</b></p>'
    +steps+'<p class="small">Empieza en la primera nota y sube esa cantidad de teclas (semitonos) para encontrar las otras.</p></div>'
    +'<div class="card"><h3>1 · Elige la nota de inicio</h3>'+rootGrid()+'<h3 style="margin-top:16px">2 · Elige el tipo de acorde</h3>'+typeChips()+'</div>'
    +'<div class="card"><h3>3 · Tócalo en el piano</h3><div class="scroll-x pa-wrap">'+keyboard({mids:mids,fing:fing,start:start})+'</div>'
    +'<p class="small pa-hint">Los números son los dedos: <b>1</b> pulgar … <b>5</b> meñique. Toca las teclas para escucharlas.</p>'
    +'<div class="row pa-act"><button class="btn primary" data-pa="chord">'+R.PLAY+'Escuchar acorde</button><button class="btn" data-pa="arp">Una por una</button>'
    +'<div class="seg" role="group" aria-label="Mano"><button data-pa="hand" data-v="R" aria-pressed="'+(S.hand==='R')+'">Mano derecha</button><button data-pa="hand" data-v="L" aria-pressed="'+(S.hand==='L')+'">Mano izquierda</button></div></div>'
    +'<div class="chips" style="margin-top:12px">'+invBtns+'</div>'
    +'<div class="row" style="margin-top:14px"><button class="btn'+(isOk?' primary':'')+'" data-pa="learned">'+(isOk?'★ ¡Ya me lo sé!':'☆ Marcar como "ya me lo sé"')+'</button><span class="small">Llevas <b>'+learnedCount()+'</b> acordes aprendidos</span></div></div>';
}
function NAMESOF(ch,m){var pc=pcOf(m);for(var i=0;i<ch.notes.length;i++)if(ch.notes[i].pc===pc)return ch.notes[i].name;return ''}

function newTarget(){
  var pool=LEVELS[S.level-1].pool(),pick;
  do{pick=pool[Math.floor(Math.random()*pool.length)]}while(Q.target&&pick[0]===Q.target.pc&&pick[1]===Q.target.type&&pool.length>1);
  Q.target={pc:pick[0],type:pick[1]};Q.pressed={};Q.done=false;Q.hint=false;Q.msg='';
}
function viewPlay(){
  if(!Q.target)newTarget();
  var ch=chordOf(Q.target.pc,Q.target.type),t=CT[Q.target.type];
  var mids=voicing(ch,0),start=Math.min.apply(null,mids)<60||mids[mids.length-1]>83?48:60;
  var pcs=ch.notes.map(function(n){return n.pc});
  var got=Object.keys(Q.pressed).filter(function(m){return Q.pressed[m]===true}).length;
  var lv='<div class="chips">'+LEVELS.map(function(l){return '<button class="chip" data-pa="level" data-v="'+l.n+'" aria-pressed="'+(S.level===l.n)+'">'+l.n+' · '+l.t+'</button>'}).join('')+'</div>';
  return '<div class="card"><h3>Nivel</h3>'+lv+'<p class="small" style="margin:8px 0 0">'+LEVELS[S.level-1].desc+'</p></div>'
    +'<div class="card pa-hero pa-target'+(Q.done?' won':'')+'"><div class="small">Toca el acorde</div><div class="pa-name">'+esc(ch.rootName+' '+t.label.toLowerCase())+'</div>'
    +'<p class="sub" id="pa-msg">'+(Q.msg||(Q.done?'¡Muy bien! ✨':'Busca '+pcs.length+' teclas (en cualquier octava)'))+'</p>'
    +'<div class="pa-prog">'+pcs.map(function(p,i){var on=Object.keys(Q.pressed).some(function(m){return Q.pressed[m]===true&&pcOf(+m)===p});return '<i class="'+(on?'on':'')+'" style="--c:'+col(p,64)+'"></i>'}).join('')+'</div>'
    +'<div class="scroll-x pa-wrap">'+keyboard({mids:mids,start:start,pressed:Q.pressed,hideChord:!Q.hint&&!Q.done,hideFinger:!Q.hint&&!Q.done,fing:fingers(mids.length,'R')})+'</div>'
    +'<div class="row pa-act">'+(Q.done?'<button class="btn primary" data-pa="next">Siguiente acorde →</button>':'<button class="btn" data-pa="hint">'+(Q.hint?'Esconder pista':'💡 Pista')+'</button><button class="btn" data-pa="chord">'+R.PLAY+'Escuchar</button><button class="btn" data-pa="skip">Saltar</button>')
    +'<span class="pa-streak">🔥 Racha: <b>'+Q.streak+'</b> · Mejor: <b>'+Q.best+'</b></span></div></div>';
}

function render(el){
  el.innerHTML='<div class="stack pa">'+modeBar()+(S.mode==='ver'?viewLearn():viewPlay())+'</div>';
  if(!el.__pa){
    el.__pa=true;
    el.addEventListener('click',onClick);
    el.addEventListener('change',function(e){if(e.target.getAttribute&&e.target.getAttribute('data-pa')==='snd'){S.snd=e.target.value;save()}});
  }
  var sc=el.querySelector('.pa-wrap');
  if(sc)sc.scrollLeft=Math.max(0,(sc.scrollWidth-sc.clientWidth)/2);
}
var host=null;
function refresh(){if(host)render(host)}

function playBlock(ch,mids){mids.forEach(function(m,i){sound(m,i*.03,1.8,.26)})}
function onClick(e){
  var pk=e.target.closest&&e.target.closest('.pk');
  var b=e.target.closest&&e.target.closest('[data-pa]');
  if(pk&&!b){keyTap(+pk.getAttribute('data-m'));return}
  if(!b)return;
  var a=b.getAttribute('data-pa'),v=b.getAttribute('data-v');
  var ch=S.mode==='ver'?chordOf(S.root,S.type):(Q.target?chordOf(Q.target.pc,Q.target.type):null);
  switch(a){
    case 'mode':S.mode=v;save();refresh();break;
    case 'root':S.root=+v;S.inv=0;save();refresh();sound(60+(+v),0,.9,.28);break;
    case 'type':S.type=v;S.inv=0;save();refresh();playBlock(null,voicing(chordOf(S.root,v),0));break;
    case 'inv':S.inv=+v;save();refresh();playBlock(null,voicing(ch,+v));break;
    case 'hand':S.hand=v;save();refresh();break;
    case 'chord':playBlock(ch,voicing(ch,S.mode==='ver'?Math.min(S.inv,ch.notes.length-1):0));break;
    case 'arp':voicing(ch,Math.min(S.inv,ch.notes.length-1)).forEach(function(m,i){sound(m,i*.38,1.2,.28)});break;
    case 'learned':learned[S.root+'-'+S.type]=!learned[S.root+'-'+S.type];store.set('pa_ok',learned);refresh();break;
    case 'level':S.level=+v;save();Q.target=null;Q.streak=0;refresh();break;
    case 'hint':Q.hint=!Q.hint;refresh();break;
    case 'skip':Q.streak=0;newTarget();refresh();break;
    case 'next':newTarget();refresh();break;
  }
}
function keyTap(m){
  if(S.mode==='ver'){sound(m,0,1.2,.3);return}
  if(!Q.target||Q.done){sound(m,0,1.2,.3);return}
  var ch=chordOf(Q.target.pc,Q.target.type),pcs=ch.notes.map(function(n){return n.pc});
  sound(m,0,1.2,.3);
  var pc=pcOf(m);
  if(pcs.indexOf(pc)<0){
    Q.pressed={};Q.pressed[m]='bad';Q.msg='Esa no es parte del acorde. ¡Intenta otra vez!';Q.streak=0;
    refresh();
    setTimeout(function(){if(Q.pressed[m]==='bad'){Q.pressed={};Q.msg='';refresh()}},650);
    return;
  }
  Q.pressed[m]=true;Q.msg='';
  var okPcs={};Object.keys(Q.pressed).forEach(function(k){if(Q.pressed[k]===true)okPcs[pcOf(+k)]=1});
  if(pcs.every(function(p){return okPcs[p]})){
    Q.done=true;Q.streak++;if(Q.streak>Q.best){Q.best=Q.streak;store.set('pa_best',Q.best)}
    learned[Q.target.pc+'-'+Q.target.type]=true;store.set('pa_ok',learned);
    refresh();
    [0,4,7,12].forEach(function(s,i){sound(72+s,.2+i*.09,.8,.2)});
  }else refresh();
}

R.piano={keyboard:keyboard,voicing:voicing,fingers:fingers,col:col,pcOf:pcOf};
R.views.acordes={render:function(el){host=el;render(el)}};
})();
