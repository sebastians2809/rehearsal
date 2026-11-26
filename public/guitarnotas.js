/* Rehearsal · Guitarra: aprende todas las notas del mástil */
(function(){
'use strict';
var R=window.REH,store=R.store,esc=R.esc,K=R.piano;
var OPEN=[40,45,50,55,59,64];                 /* cuerdas 6..1: Mi La Re Sol Si Mi */
var STR_NAMES=['Mi grave','La','Re','Sol','Si','Mi agudo'];
var NAMES=['Do','Do♯','Re','Mi♭','Mi','Fa','Fa♯','Sol','La♭','La','Si♭','Si'];
var NATURAL={0:1,2:1,4:1,5:1,7:1,9:1,11:1};
var DOTS={3:1,5:1,7:1,9:1,12:2};
var FRETS=12;
var S=store.get('gn',{mode:'ver',show:'all',note:0,labels:'names'});
var Q={target:null,string:null,streak:0,best:store.get('gn_best',0),msg:'',won:false,bad:null,good:null};
function save(){store.set('gn',S)}
function pcOf(m){return ((m%12)+12)%12}
function snd(m){R.audioReady();R.inst.note('guitar',m,0,1.6,.32)}

function board(){
  var W=64,H=44,x0=46,y0=22,nstr=6,w=x0+FRETS*W+10,h=y0+(nstr-1)*H+30;
  var s='<svg viewBox="0 0 '+w+' '+h+'" class="gn-svg" role="img" aria-label="Mástil de guitarra con las notas">';
  s+='<rect x="'+x0+'" y="'+(y0-8)+'" width="'+(FRETS*W)+'" height="'+((nstr-1)*H+16)+'" rx="8" fill="var(--neck)"/>';
  for(var f=0;f<=FRETS;f++)s+='<line x1="'+(x0+f*W)+'" x2="'+(x0+f*W)+'" y1="'+(y0-8)+'" y2="'+(y0+(nstr-1)*H+8)+'" stroke="'+(f===0?'#efe5d0':'var(--fret)')+'" stroke-width="'+(f===0?6:2)+'"/>';
  for(var d in DOTS){
    var cx=x0+(+d-.5)*W,mid=y0+(nstr-1)*H/2;
    if(DOTS[d]===1)s+='<circle cx="'+cx+'" cy="'+mid+'" r="6" fill="var(--pearl)" opacity=".35"/>';
    else s+='<circle cx="'+cx+'" cy="'+(mid-H)+'" r="6" fill="var(--pearl)" opacity=".35"/><circle cx="'+cx+'" cy="'+(mid+H)+'" r="6" fill="var(--pearl)" opacity=".35"/>';
  }
  for(var f2=1;f2<=FRETS;f2++)s+='<text x="'+(x0+(f2-.5)*W)+'" y="'+(h-6)+'" class="gn-fn">'+f2+'</text>';
  /* cuerdas: la más aguda (1) arriba */
  for(var r=0;r<nstr;r++){
    var si=nstr-1-r,y=y0+r*H;
    s+='<line x1="'+x0+'" x2="'+(x0+FRETS*W)+'" y1="'+y+'" y2="'+y+'" stroke="var(--string)" stroke-width="'+(1+si*.45).toFixed(2)+'" opacity=".8"/>';
    s+='<text x="'+(x0-10)+'" y="'+(y+5)+'" class="gn-sn">'+NAMES[pcOf(OPEN[si])]+'</text>';
    for(var f3=0;f3<=FRETS;f3++){
      var m=OPEN[si]+f3,pc=pcOf(m),cx2=f3===0?x0-26:x0+(f3-.5)*W;
      var show=false,cls='';
      if(S.mode==='ver'){
        if(S.show==='all')show=true;
        else if(S.show==='nat')show=!!NATURAL[pc];
        else if(S.show==='one')show=pc===S.note;
      }else{
        if(Q.good&&Q.good.s===si&&Q.good.f===f3){show=true;cls=' good'}
        else if(Q.bad&&Q.bad.s===si&&Q.bad.f===f3){show=true;cls=' bad'}
      }
      if(f3===0)cx2=x0-26;
      s+='<g class="gn-n'+cls+'" data-s="'+si+'" data-f="'+f3+'" style="--c:'+K.col(pc,66)+'"><circle cx="'+cx2+'" cy="'+y+'" r="'+(show?17:19)+'" class="'+(show?'gn-dot':'gn-hit')+'"/>';
      if(show)s+='<text x="'+cx2+'" y="'+(y+5)+'" class="gn-lab">'+(S.mode==='play'?NAMES[pc]:NAMES[pc])+'</text>';
      s+='</g>';
    }
  }
  return s+'</svg>';
}
function bar(){
  return '<div class="card pa-bar"><div class="seg" role="group" aria-label="Modo"><button data-gn="mode" data-v="ver" aria-pressed="'+(S.mode==='ver')+'">Aprender</button><button data-gn="mode" data-v="play" aria-pressed="'+(S.mode==='play')+'">Juego</button></div></div>';
}
function newTarget(){
  var pc;do{pc=Math.floor(Math.random()*12)}while(Q.target!==null&&pc===Q.target&&true);
  Q.target=pc;
  Q.string=Math.random()<.6?Math.floor(Math.random()*6):null;
  Q.good=null;Q.bad=null;Q.won=false;Q.msg='';
}
function viewLearn(){
  var showSeg='<div class="seg" role="group" aria-label="Qué notas ver"><button data-gn="show" data-v="all" aria-pressed="'+(S.show==='all')+'">Todas</button><button data-gn="show" data-v="nat" aria-pressed="'+(S.show==='nat')+'">Sin sostenidos</button><button data-gn="show" data-v="one" aria-pressed="'+(S.show==='one')+'">Una nota</button></div>';
  var pick=S.show==='one'?'<div class="chips" style="margin-top:12px">'+NAMES.map(function(n,i){return '<button class="chip" data-gn="note" data-v="'+i+'" aria-pressed="'+(S.note===i)+'" style="'+(S.note===i?'':'border-color:'+K.col(i,60))+'">'+n+'</button>'}).join('')+'</div>':'';
  return '<div class="card"><h3>Todas las notas del mástil</h3>'+showSeg+pick
    +'<div class="scroll-x gn-wrap" style="margin-top:14px">'+board()+'</div>'
    +'<p class="small">Toca cualquier círculo para escucharlo. Los puntos del mástil están en los trastes 3, 5, 7, 9 y 12.</p></div>'
    +'<div class="card"><h3>Para no perderte</h3><ul class="gn-tips"><li>Las cuerdas al aire, de la más gruesa a la más fina: <b>Mi · La · Re · Sol · Si · Mi</b>.</li>'
    +'<li>Cada traste sube <b>medio tono</b>. Del <b>Mi</b> al <b>Fa</b> y del <b>Si</b> al <b>Do</b> hay solo un traste; en las demás notas naturales hay dos.</li>'
    +'<li>En el <b>traste 12</b> vuelves a la misma nota de la cuerda al aire, una octava más arriba.</li>'
    +'<li>Truco: la nota del traste 5 de una cuerda es la cuerda de abajo al aire (la 5 de Mi grave es La), menos entre Sol y Si, que es el traste 4.</li></ul></div>';
}
function viewPlay(){
  if(Q.target===null)newTarget();
  var where=Q.string!==null?' en la cuerda <b>'+(6-Q.string)+'</b> ('+STR_NAMES[Q.string]+')':' en cualquier cuerda';
  return '<div class="card pa-hero'+(Q.won?' pa-target won':'')+'"><div class="small">Encuentra la nota</div><div class="pa-name" style="color:'+K.col(Q.target,66)+'">'+NAMES[Q.target]+'</div>'
    +'<p class="sub">Toca '+where+'. '+(Q.msg||'')+'</p>'
    +'<div class="scroll-x gn-wrap" style="margin-top:12px">'+board()+'</div>'
    +'<div class="row pa-act">'+(Q.won?'<button class="btn primary" data-gn="next">Siguiente →</button>':'<button class="btn" data-gn="skip">Saltar</button>')
    +'<span class="pa-streak">🔥 Racha: <b>'+Q.streak+'</b> · Mejor: <b>'+Q.best+'</b></span></div></div>';
}
var host=null;
function render(el){
  host=el;
  el.innerHTML='<div class="stack">'+bar()+(S.mode==='ver'?viewLearn():viewPlay())+'</div>';
  if(!el.__gn){el.__gn=true;el.addEventListener('click',onClick)}
  var sc=el.querySelector('.gn-wrap');if(sc&&sc.scrollWidth>sc.clientWidth)sc.scrollLeft=0;
}
function onClick(e){
  var g=e.target.closest('.gn-n');
  var b=e.target.closest('[data-gn]');
  if(g&&!b){
    var si=+g.getAttribute('data-s'),f=+g.getAttribute('data-f'),m=OPEN[si]+f;
    snd(m);
    if(S.mode==='play'&&!Q.won){
      if(pcOf(m)===Q.target&&(Q.string===null||Q.string===si)){
        Q.won=true;Q.good={s:si,f:f};Q.bad=null;Q.streak++;if(Q.streak>Q.best){Q.best=Q.streak;store.set('gn_best',Q.best)}Q.msg='¡Muy bien! ✨';
        render(host);[0,4,7,12].forEach(function(x,i){R.audioReady();R.inst.note('piano',72+x,.15+i*.09,.7,.2)});
      }else{
        Q.bad={s:si,f:f};Q.streak=0;Q.msg='Esa es '+NAMES[pcOf(m)]+(pcOf(m)===Q.target?' (pero en otra cuerda)':'')+'. ¡Sigue buscando!';render(host);
        setTimeout(function(){if(Q.bad){Q.bad=null;render(host)}},900);
      }
    }
    return;
  }
  if(!b)return;
  var a=b.getAttribute('data-gn'),v=b.getAttribute('data-v');
  if(a==='mode'){S.mode=v;save();if(v==='play')newTarget();render(host)}
  else if(a==='show'){S.show=v;save();render(host)}
  else if(a==='note'){S.note=+v;save();render(host);snd(60+(+v))}
  else if(a==='next'){newTarget();render(host)}
  else if(a==='skip'){Q.streak=0;newTarget();render(host)}
}
R.views.gnotas={render:function(el){render(el)}};
})();
