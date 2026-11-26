/* Rehearsal · Canciones: pega letra con acordes, detecta la tonalidad, transpone y enseña cada acorde y la melodía */
(function(){
'use strict';
var R=window.REH,CT=R.CT,store=R.store,esc=R.esc,K=R.piano;

/* ---------- acordes: lectura ---------- */
var LAT={Do:'C',Re:'D',Mi:'E',Fa:'F',Sol:'G',La:'A',Si:'B'};
var LETPC={C:0,D:2,E:4,F:5,G:7,A:9,B:11};
var CHORD_RE=/^(Do|Re|Mi|Fa|Sol|La|Si|[A-G])([#b♯♭]?)((?:maj|min|dim|aug|sus|add|m|M|[0-9]|[+\-°ø°Δ()#b♯♭]|no)*)(?:\/(Do|Re|Mi|Fa|Sol|La|Si|[A-G])([#b♯♭]?))?$/;
var SHARP=['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];
var FLAT=['C','Db','D','Eb','E','F','Gb','G','Ab','A','Bb','B'];
var ES_SH=['Do','Do♯','Re','Re♯','Mi','Fa','Fa♯','Sol','Sol♯','La','La♯','Si'];
var ES_FL=['Do','Re♭','Re','Mi♭','Mi','Fa','Sol♭','Sol','La♭','La','Si♭','Si'];
var TYPE_SUF={maj:'',min:'m',dom7:'7',maj7:'maj7',min7:'m7',m7b5:'m7b5',dim:'dim',dim7:'dim7',aug:'aug',sus2:'sus2',sus4:'sus4',six:'6',m6:'m6',dom9:'9',add9:'add9'};

function suffixType(sfx){
  var s=sfx.replace(/[()]/g,''),m;
  var map={'':'maj','m':'min','min':'min','-':'min','7':'dom7','maj7':'maj7','M7':'maj7','Δ':'maj7','Δ7':'maj7','maj':'maj7','m7':'min7','min7':'min7','-7':'min7',
    'dim':'dim','°':'dim','dim7':'dim7','°7':'dim7','aug':'aug','+':'aug','sus2':'sus2','sus4':'sus4','sus':'sus4','6':'six','m6':'m6','9':'dom9','add9':'add9',
    'm7b5':'m7b5','m7♭5':'m7b5','ø':'m7b5','ø7':'m7b5','M':'maj'};
  if(map.hasOwnProperty(s))return {type:map[s],approx:false};
  if(/^m(?!aj)/.test(s)||/^min/.test(s))return {type:'min',approx:true};
  if(/^maj/.test(s))return {type:'maj7',approx:true};
  if(/^dim/.test(s))return {type:'dim',approx:true};
  if(/^aug|^\+/.test(s))return {type:'aug',approx:true};
  if(/sus/.test(s))return {type:'sus4',approx:true};
  if(/^\d|^add/.test(s))return {type:/^(7|9|11|13)/.test(s)?'dom7':'maj',approx:true};
  return {type:'maj',approx:true};
}
function parseChord(tok){
  var m=CHORD_RE.exec(tok);if(!m)return null;
  var root=LAT[m[1]]||m[1],acc=m[2]==='#'||m[2]==='♯'?1:(m[2]==='b'||m[2]==='♭')?-1:0;
  var st=suffixType(m[3]);
  var pc=((LETPC[root]+acc)%12+12)%12;
  var bass=null;
  if(m[4]){var br=LAT[m[4]]||m[4],ba=m[5]==='#'||m[5]==='♯'?1:(m[5]==='b'||m[5]==='♭')?-1:0;bass=((LETPC[br]+ba)%12+12)%12}
  return {tok:tok,pc:pc,type:st.type,approx:st.approx,bass:bass,sfx:m[3],latin:!!LAT[m[1]],flat:acc<0};
}
var SKIP=/^(\||\|\||\/|-|--|:|x\d+|\d+x|\(?x\d+\)?|\(?\d+x\)?|N\.?C\.?|nc|%|\.\.\.|…|~|\(|\)|\[|\]|repite|bis)$/i;
var SECT=/^\s*\[?\s*(intro|verso|estrofa|coro|estribillo|pre-?coro|puente|solo|interludio|final|outro|instrumental|verse|chorus|bridge|pre-?chorus|riff|parte)\b[^\]:]*\]?\s*:?\s*/i;

function tokenize(line){var out=[],re=/\S+/g,m;while((m=re.exec(line)))out.push({txt:m[0],col:m.index});return out}
function chordLineFrom(line,offset){
  var toks=tokenize(line),found=[],plain=[],chords=0;
  for(var i=0;i<toks.length;i++){
    var t=toks[i],c=parseChord(t.txt);
    if(c){found.push({col:t.col+(offset||0),txt:t.txt,ch:c});chords++}
    else if(SKIP.test(t.txt))found.push({col:t.col+(offset||0),txt:t.txt,ch:null});
    else return null;
  }
  return chords?found:null;
}
function parseSong(text){
  var out=[];
  String(text||'').replace(/\r/g,'').split('\n').forEach(function(raw){
    var l=raw.replace(/\t/g,'    ').replace(/\s+$/,'');
    if(!l.trim()){out.push({t:'blank'});return}
    /* ChordPro inline [Am]palabra */
    if(/\[[^\]]+\]/.test(l)){
      var re=/\[([^\]]+)\]/g,m,okAll=true,parts=[],last=0,lyric='',marks=[],any=false;
      while((m=re.exec(l))){
        var c=parseChord(m[1]);
        lyric+=l.slice(last,m.index);
        if(c){marks.push({col:lyric.length,txt:m[1],ch:c});any=true}else okAll=false;
        last=m.index+m[0].length;
      }
      lyric+=l.slice(last);
      if(any&&okAll){
        out.push({t:'chords',items:marks});
        if(lyric.trim())out.push({t:'lyric',text:lyric});
        return;
      }
      if(!any&&/^\s*\[[^\]]+\]\s*$/.test(l)){out.push({t:'section',text:l.replace(/[\[\]]/g,'').trim()});return}
    }
    var sm=SECT.exec(l);
    if(sm){
      var rest=l.slice(sm[0].length);
      if(!rest.trim()){out.push({t:'section',text:sm[0].replace(/[\[\]:]/g,'').trim()});return}
      var cl=chordLineFrom(rest,sm[0].length);
      if(cl){out.push({t:'section',text:sm[0].replace(/[\[\]:]/g,'').trim()});out.push({t:'chords',items:cl});return}
    }
    var items=chordLineFrom(l,0);
    if(items){out.push({t:'chords',items:items});return}
    out.push({t:'lyric',text:l});
  });
  return out;
}
function allChords(model){
  var a=[];model.forEach(function(ln){if(ln.t==='chords')ln.items.forEach(function(it){if(it.ch)a.push(it.ch)})});return a;
}

/* ---------- tonalidad ---------- */
var MAJ_S=[0,2,4,5,7,9,11],MAJ_Q=['maj','min','min','maj','maj','min','dim'];
var MIN_S=[0,2,3,5,7,8,10],MIN_Q=['min','dim','maj','min','min','maj','maj'];
function fam(t){return /^(maj|dom7|maj7|six|add9|dom9|sus2|sus4|aug)$/.test(t)?'maj':/^(min|min7|m6)$/.test(t)?'min':'dim'}
function detectKey(chs){
  if(!chs.length)return null;
  var best=null;
  for(var tonic=0;tonic<12;tonic++){
    [['maj',MAJ_S,MAJ_Q],['min',MIN_S,MIN_Q]].forEach(function(M){
      var sc=0;
      chs.forEach(function(c){
        var d=(c.pc-tonic+12)%12,ix=M[1].indexOf(d);
        if(ix>=0)sc+=fam(c.type)===M[2][ix]?2:.4;
        else if(M[0]==='min'&&d===7&&fam(c.type)==='maj')sc+=1.8;
        else if(M[0]==='min'&&d===11&&fam(c.type)==='dim')sc+=1.2;
        else sc-=1;
        if(d===0&&fam(c.type)===M[2][0])sc+=.3;
      });
      var f=chs[0],l=chs[chs.length-1];
      if(f.pc===tonic&&fam(f.type)===M[2][0])sc+=1.6;
      if(l.pc===tonic&&fam(l.type)===M[2][0])sc+=2.2;
      if(!best||sc>best.sc)best={pc:tonic,mode:M[0],sc:sc};
    });
  }
  return best;
}
var FLAT_MAJ={5:1,10:1,3:1,8:1,1:1,6:1},FLAT_MIN={2:1,7:1,0:1,5:1,10:1,3:1};
function keyUsesFlats(k){return k?!!(k.mode==='maj'?FLAT_MAJ[k.pc]:FLAT_MIN[k.pc]):false}
function keyName(k){
  if(!k)return '—';
  var fl=keyUsesFlats(k),nm=(fl?ES_FL:ES_SH)[k.pc];
  return nm+(k.mode==='maj'?' mayor':' menor');
}

/* ---------- melodía ---------- */
var NOTE_RE=/^(Do|Re|Mi|Fa|Sol|La|Si|[A-G])([#b♯♭]?)(\d)?([',]*)(?::(\d+(?:\.\d+)?))?$/;
function parseMelody(txt){
  var out=[];
  String(txt||'').split(/[\s,|]+/).forEach(function(tok){
    if(!tok)return;
    if(/^[-_.]$/.test(tok)){out.push({rest:true,beats:1});return}
    var m=NOTE_RE.exec(tok);if(!m)return;
    var L=LAT[m[1]]||m[1],acc=m[2]==='#'||m[2]==='♯'?1:(m[2]==='b'||m[2]==='♭')?-1:0;
    var oct=m[3]!==undefined?+m[3]:4;
    (m[4]||'').split('').forEach(function(ch){oct+=ch==="'"?1:-1});
    var midi=12*(oct+1)+LETPC[L]+acc;
    out.push({midi:midi,pc:((midi%12)+12)%12,beats:m[5]?+m[5]:1,name:(m[1].length>1||/^[DRMFSL]/.test(m[1])&&LAT[m[1]]?m[1]:ES_SH[((midi%12)+12)%12])+(m[2]||'')});
  });
  return out;
}
function noteLabel(n){return ES_SH[n.pc]}

/* ---------- estado ---------- */
var songs=store.get('songs',[]);
var V={screen:'list',id:null,q:'',tr:0,easy:false,melIdx:-1,practice:false,pIdx:0,bpm:90,playing:null,tab:'piano',edit:null};
function save(){store.set('songs',songs)}
function uid(){return 's'+Date.now().toString(36)+Math.floor(Math.random()*1e4).toString(36)}
function byId(id){return songs.filter(function(s){return s.id===id})[0]}
function cache(s){
  if(!s._c||s._c.src!==s.text){
    var model=parseSong(s.text),chs=allChords(model);
    s._c={src:s.text,model:model,chs:chs,key:detectKey(chs),latin:chs.length?chs[0].latin:false};
  }
  return s._c;
}
function snd(m,when,dur,vol){R.audioReady();R.inst.note(store.get('pa',{snd:'piano'}).snd||'piano',m,when||0,dur||1.4,vol||.28)}

/* ---------- transposición / nombres ---------- */
function chordDisp(ch,c,tr,easy){
  var pc=(ch.pc+tr+120)%12;
  var k=c.key?{pc:(c.key.pc+tr+120)%12,mode:c.key.mode}:null;
  var useFlat=k?keyUsesFlats(k):ch.flat;
  var names=c.latin?(useFlat?ES_FL:ES_SH):(useFlat?FLAT:SHARP);
  var type=easy?simple(ch.type):ch.type;
  var sfx=easy?TYPE_SUF[type]:ch.sfx;
  var txt=names[pc]+sfx;
  if(ch.bass!==null&&!easy)txt+='/'+names[(ch.bass+tr+120)%12];
  return {txt:txt,pc:pc,type:type,bass:ch.bass!==null?(ch.bass+tr+120)%12:null,sfx:sfx,name:names[pc]};
}
function simple(t){
  if(t==='min7'||t==='m6')return 'min';
  if(t==='m7b5'||t==='dim7')return 'dim';
  if(t==='sus2'||t==='sus4'||t==='dom7'||t==='maj7'||t==='six'||t==='dom9'||t==='add9')return 'maj';
  return t;
}
function theory(d){
  var nm=SHARP[d.pc].charAt(0),acc=SHARP[d.pc].length>1?1:0;
  /* respell usando la misma letra que el nombre mostrado */
  var disp=d.name,L=LAT[disp.replace(/[♯♭#b]+$/,'')]||disp.charAt(0),ac=/[#♯]/.test(disp)?1:/[b♭]/.test(disp.slice(1))?-1:0;
  var ch=R.buildChord(L,ac,d.type);
  return ch;
}
function chordKey(d){return d.txt}

/* ---------- renderizado de línea de acordes ---------- */
function chordLineHTML(ln,c){
  var out='',vis=0,items=ln.items.slice().sort(function(a,b){return a.col-b.col});
  items.forEach(function(it){
    var col=it.col;
    while(vis<col){out+=' ';vis++}
    if(vis>0&&out.slice(-1)!==' '){out+=' ';vis++}
    if(it.ch){
      var d=chordDisp(it.ch,c,V.tr,V.easy);
      out+='<button class="sg-ch" data-sg="chord" data-pc="'+d.pc+'" data-type="'+d.type+'" data-name="'+esc(d.name)+'" data-txt="'+esc(d.txt)+'" data-bass="'+(d.bass===null?'':d.bass)+'">'+esc(d.txt)+'</button>';
      vis+=d.txt.length;
    }else{out+=esc(it.txt);vis+=it.txt.length}
  });
  return '<div class="sg-line sg-cl">'+out+'</div>';
}
function songTextHTML(c){
  return c.model.map(function(ln){
    if(ln.t==='blank')return '<div class="sg-line">&nbsp;</div>';
    if(ln.t==='section')return '<div class="sg-sec">'+esc(ln.text)+'</div>';
    if(ln.t==='chords')return chordLineHTML(ln,c);
    return '<div class="sg-line sg-ly">'+(esc(ln.text)||'&nbsp;')+'</div>';
  }).join('');
}
function uniqueChords(c){
  var seen={},list=[];
  c.chs.forEach(function(ch){var d=chordDisp(ch,c,V.tr,V.easy);if(!seen[d.txt]){seen[d.txt]=1;list.push(d)}});
  return list;
}

/* ---------- pantallas ---------- */
function listHTML(){
  var q=V.q.trim().toLowerCase();
  var items=songs.filter(function(s){return !q||(s.title+' '+(s.artist||'')).toLowerCase().indexOf(q)>=0});
  var cards=items.map(function(s){
    var c=cache(s);
    return '<button class="sg-card" data-sg="open" data-id="'+s.id+'"><span class="sg-t">'+esc(s.title||'Sin título')+'</span><span class="sg-a">'+esc(s.artist||'')+'</span>'
      +'<span class="sg-m"><i>'+esc(keyName(c.key))+'</i><i>'+uniqueChords(c).length+' acordes</i>'+(s.melody?'<i>con melodía</i>':'')+'</span></button>';
  }).join('');
  var empty='<div class="card sg-empty"><h3>Aquí van tus canciones</h3><p class="sub">Pega la letra con acordes de La Cuerda, Cifra Club o Ultimate Guitar y la app detecta la tonalidad, te dice qué acordes usar y te enseña cada uno en piano y guitarra.</p>'
    +'<div class="row"><button class="btn primary" data-sg="new">+ Nueva canción</button><button class="btn" data-sg="sample">Cargar canción de ejemplo</button></div></div>';
  return '<div class="stack sg"><div class="card sg-head"><div class="row" style="justify-content:space-between"><h2>Canciones</h2><button class="btn primary" data-sg="new">+ Nueva</button></div>'
    +(songs.length?'<input class="sg-search" type="search" placeholder="Buscar canción o artista" value="'+esc(V.q)+'" data-sg="search" aria-label="Buscar">':'')+'</div>'
    +(songs.length?'<div class="sg-grid">'+cards+(items.length?'':'<p class="empty">No encontré ninguna.</p>')+'</div>':empty)+'</div>';
}
function editorHTML(){
  var s=V.edit;
  return '<div class="stack sg"><div class="card"><div class="row" style="justify-content:space-between"><button class="btn" data-sg="back">← Volver</button><h3 style="margin:0">'+(s.isNew?'Nueva canción':'Editar canción')+'</h3></div>'
    +'<label class="field" style="margin-top:14px">Título<input class="sg-in" data-f="title" value="'+esc(s.title)+'" placeholder="Nombre de la canción"></label>'
    +'<label class="field" style="margin-top:10px">Artista<input class="sg-in" data-f="artist" value="'+esc(s.artist||'')+'" placeholder="Artista o banda"></label>'
    +'<label class="field" style="margin-top:10px">Letra con acordes<textarea class="sg-ta" data-f="text" rows="14" spellcheck="false" placeholder="Pega aquí el texto tal como lo copias de la página. Por ejemplo:\n\nAm        F\nLetra de la primera línea\nC         G\nLetra de la segunda línea">'+esc(s.text)+'</textarea></label>'
    +'<p class="small" id="sg-live"></p>'
    +'<label class="field" style="margin-top:10px">Melodía (opcional) para aprender nota por nota<textarea class="sg-ta" data-f="melody" rows="3" spellcheck="false" placeholder="Mi Mi Fa Sol Sol Fa Mi Re Do Do Re Mi Mi:2 Re Re:2">'+esc(s.melody||'')+'</textarea></label>'
    +'<p class="small">Escribe las notas separadas por espacio: <b>Do Re Mi Fa Sol La Si</b> (o C D E F G A B). Agrega <b>♯</b> o <b>b</b>, un número para la octava (<b>Do5</b>), <b>:2</b> para que dure 2 tiempos y <b>-</b> para un silencio.</p>'
    +'<div class="row" style="margin-top:12px"><button class="btn primary" data-sg="save">Guardar</button>'+(s.isNew?'':'<button class="btn" data-sg="del">Borrar</button>')+'</div></div></div>';
}
function melodyHTML(s){
  var mel=parseMelody(s.melody);if(!mel.length)return '';
  var notes=mel.filter(function(n){return !n.rest});
  var mn=Math.min.apply(null,notes.map(function(n){return n.midi})),mx=Math.max.apply(null,notes.map(function(n){return n.midi}));
  var start=Math.floor(mn/12)*12,span=(mx-start)<24?24:36;
  var cur=V.practice?V.pIdx:V.melIdx;
  var boxes=mel.map(function(n,i){
    var cls='sg-n'+(i===cur?' cur':'')+(V.practice&&i<V.pIdx?' done':'');
    if(n.rest)return '<span class="'+cls+' rest">·</span>';
    return '<span class="'+cls+'" style="--c:'+K.col(n.pc,68)+'">'+noteLabel(n)+(n.beats>1?'<sup>'+n.beats+'</sup>':'')+'</span>';
  }).join('');
  var target=cur>=0&&mel[cur]&&!mel[cur].rest?[mel[cur].midi]:[];
  var keys=K.keyboard({mids:target,start:start,span:span,hideFinger:true});
  return '<div class="card"><h3>Melodía</h3><div class="sg-notes">'+boxes+'</div>'
    +'<div class="scroll-x pa-wrap" style="margin-top:12px">'+keys+'</div>'
    +'<div class="row pa-act">'+(V.playing?'<button class="btn" data-sg="mstop">■ Parar</button>':'<button class="btn primary" data-sg="mplay">'+R.PLAY+'Escuchar</button>')
    +'<button class="btn'+(V.practice?' primary':'')+'" data-sg="mprac">'+(V.practice?'Salir de práctica':'Practicar tocando')+'</button>'
    +'<div class="stepper" aria-label="Velocidad"><button data-sg="bpm" data-v="-10" aria-label="Más lento">−</button><output>'+V.bpm+' bpm</output><button data-sg="bpm" data-v="10" aria-label="Más rápido">+</button></div></div>'
    +(V.practice?'<p class="small">'+(V.pIdx>=mel.length?'¡Terminaste la melodía! 🎉':'Toca la tecla iluminada para avanzar por cada nota.')+'</p>':'')+'</div>';
}
function readerHTML(s){
  var c=cache(s),list=uniqueChords(c);
  var key=c.key?{pc:(c.key.pc+V.tr+120)%12,mode:c.key.mode}:null;
  var chips=list.map(function(d){return '<button class="chip sg-chip" data-sg="chord" data-pc="'+d.pc+'" data-type="'+d.type+'" data-name="'+esc(d.name)+'" data-txt="'+esc(d.txt)+'" data-bass="'+(d.bass===null?'':d.bass)+'">'+esc(d.txt)+'</button>'}).join('');
  var approx=c.chs.some(function(x){return x.approx});
  return '<div class="stack sg"><div class="card"><div class="row" style="justify-content:space-between"><button class="btn" data-sg="back">← Canciones</button><div class="row"><button class="btn" data-sg="share">Copiar enlace</button><button class="btn" data-sg="edit">Editar</button></div></div>'
    +'<h2 style="margin-top:14px">'+esc(s.title||'Sin título')+'</h2><p class="sub">'+esc(s.artist||'')+'</p>'
    +'<div class="facts"><span class="fact">Tonalidad: <b>'+esc(keyName(key))+'</b></span><span class="fact"><b>'+list.length+'</b> acordes distintos</span></div></div>'
    +'<div class="card"><div class="row sg-ctl"><div class="stepper" aria-label="Transponer"><button data-sg="tr" data-v="-1" aria-label="Bajar medio tono">−</button><output>'+(V.tr>0?'+':'')+V.tr+'</output><button data-sg="tr" data-v="1" aria-label="Subir medio tono">+</button></div><span class="small">Cambiar de tono (semitonos)</span></div>'
    +'<div class="row" style="margin-top:10px"><div class="seg" role="group" aria-label="Dificultad"><button data-sg="easy" data-v="0" aria-pressed="'+(!V.easy)+'">Acordes originales</button><button data-sg="easy" data-v="1" aria-pressed="'+V.easy+'">Versión fácil</button></div>'
    +'<button class="btn" data-sg="prog">'+R.PLAY+'Escuchar acordes</button></div>'
    +(approx&&!V.easy?'<p class="small" style="margin:10px 0 0">Algunos acordes raros se muestran con el acorde básico más parecido en el piano y la guitarra.</p>':'')+'</div>'
    +'<div class="card"><h3>Acordes de esta canción</h3><div class="chips">'+chips+'</div><p class="small" style="margin:10px 0 0">Toca un acorde para ver cómo se hace en piano y en guitarra.</p></div>'
    +melodyHTML(s)
    +'<div class="card"><div class="sg-text">'+songTextHTML(c)+'</div></div></div>';
}

/* ---------- hoja de acorde ---------- */
var sheet=null,sheetState={tab:'piano',d:null};
function ensureSheet(){
  if(sheet)return;
  sheet=document.createElement('div');sheet.className='sheet';sheet.hidden=true;sheet.id='sg-sheet';
  sheet.innerHTML='<div class="sheet-bd" data-x="close"></div><div class="sheet-p" role="dialog" aria-modal="true" aria-label="Acorde"></div>';
  document.body.appendChild(sheet);
  sheet.addEventListener('click',function(e){
    var b=e.target.closest('[data-x]'),pk=e.target.closest('.pk');
    if(pk&&!b){snd(+pk.getAttribute('data-m'),0,1.2,.3);return}
    if(!b)return;var a=b.getAttribute('data-x');
    if(a==='close')closeSheet();
    else if(a==='tab'){sheetState.tab=b.getAttribute('data-v');drawSheet()}
    else if(a==='play'){playChordD(sheetState.d)}
  });
}
function playChordD(d){
  var ch=theory(d),mids=K.voicing(ch,0);
  mids.forEach(function(m,i){snd(m,i*.03,1.8,.26)});
  if(d.bass!==null){var bm=36+d.bass;snd(bm,0,1.8,.3)}
}
function drawSheet(){
  var d=sheetState.d,ch=theory(d),p=sheet.querySelector('.sheet-p');
  var body;
  if(sheetState.tab==='piano'){
    var mids=K.voicing(ch,0),start=Math.min.apply(null,mids)<60||mids[mids.length-1]>83?48:60;
    body='<div class="scroll-x pa-wrap">'+K.keyboard({mids:mids,fing:K.fingers(mids.length,'R'),start:start})+'</div><p class="small">Mano derecha: los números son los dedos (1 = pulgar).</p>';
  }else{
    var vs=R.voicings(ch);
    body=vs.length?'<div class="diagram"><svg-wrap>'+R.diagramSVG(ch,vs[0].v)+'</svg-wrap></div>':'<p class="empty">No encontré una forma cómoda para este acorde.</p>';
    body=body.replace(/<\/?svg-wrap>/g,'');
  }
  p.innerHTML='<div class="sheet-h"><div><h3 style="margin:0">'+esc(d.txt)+'</h3><p class="small" style="margin:0">'+ch.notes.map(function(n){return n.name}).join(' · ')+(d.bass!==null?' · bajo en '+esc(['Do','Do♯','Re','Mi♭','Mi','Fa','Fa♯','Sol','La♭','La','Si♭','Si'][d.bass]):'')+'</p></div>'
    +'<button class="icon-btn" data-x="close" aria-label="Cerrar"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg></button></div>'
    +'<div class="seg" role="group" style="margin:6px 0 12px"><button data-x="tab" data-v="piano" aria-pressed="'+(sheetState.tab==='piano')+'">Piano</button><button data-x="tab" data-v="guitar" aria-pressed="'+(sheetState.tab==='guitar')+'">Guitarra</button></div>'
    +body+'<div class="row" style="margin-top:14px"><button class="btn primary" data-x="play">'+R.PLAY+'Escuchar</button></div>';
  var sc=p.querySelector('.pa-wrap');if(sc)sc.scrollLeft=Math.max(0,(sc.scrollWidth-sc.clientWidth)/2);
}
function openSheet(d){ensureSheet();sheetState.d=d;sheet.hidden=false;document.body.classList.add('no-scroll');drawSheet();playChordD(d)}
function closeSheet(){if(sheet){sheet.hidden=true;document.body.classList.remove('no-scroll')}}

/* ---------- reproducción ---------- */
var timers=[];
function clearTimers(){timers.forEach(clearTimeout);timers=[];V.playing=null}
function playMelody(s){
  var mel=parseMelody(s.melody),beat=60/V.bpm,t=0;
  clearTimers();V.playing='mel';V.practice=false;
  mel.forEach(function(n,i){
    var at=t;
    timers.push(setTimeout(function(){V.melIdx=i;if(!n.rest)snd(n.midi,0,Math.max(.4,n.beats*beat*.95),.3);redrawMelody(s)},at*1000));
    t+=n.beats*beat;
  });
  timers.push(setTimeout(function(){V.melIdx=-1;V.playing=null;redraw()},t*1000+100));
  redraw();
}
function playProg(s){
  var c=cache(s),list=[];
  c.chs.forEach(function(ch,i){var d=chordDisp(ch,c,V.tr,V.easy);if(!list.length||list[list.length-1].txt!==d.txt)list.push(d)});
  list.slice(0,24).forEach(function(d,i){setTimeout(function(){playChordD(d);hilite(d.txt)},i*1100)});
}
function hilite(txt){
  Array.prototype.forEach.call(document.querySelectorAll('#view-canciones .sg-chip'),function(b){b.classList.toggle('now',b.getAttribute('data-txt')===txt)});
}
function redrawMelody(){redraw(true)}

/* ---------- vista principal ---------- */
var host=null;
function redraw(keepScroll){
  if(!host)return;
  var y=window.scrollY,x=host.querySelector('.sg-text'),sx=x?x.scrollLeft:0;
  render(host);
  if(keepScroll)window.scrollTo(0,y);
}
function render(el){
  host=el;
  var s=V.id?byId(V.id):null;
  if(V.screen==='edit')el.innerHTML=editorHTML();
  else if(V.screen==='read'&&s)el.innerHTML=readerHTML(s);
  else{V.screen='list';el.innerHTML=listHTML()}
  if(!el.__sg){
    el.__sg=true;
    el.addEventListener('click',onClick);
    el.addEventListener('input',onInput);
  }
  if(V.screen==='edit')liveEdit();
}
function liveEdit(){
  var box=document.getElementById('sg-live');if(!box)return;
  var tmp={text:V.edit.text},c=parseSong(tmp.text),chs=allChords(c),k=detectKey(chs);
  var seen={};chs.forEach(function(x){seen[x.pc+x.type]=1});
  box.textContent=chs.length?'Detecté '+chs.length+' acordes ('+Object.keys(seen).length+' distintos). Tonalidad: '+keyName(k)+'.':'Todavía no veo acordes. Pega el texto con los acordes sobre la letra.';
}
function onInput(e){
  var f=e.target.getAttribute&&e.target.getAttribute('data-f');
  if(f&&V.edit){V.edit[f]=e.target.value;if(f==='text')liveEdit()}
  if(e.target.getAttribute&&e.target.getAttribute('data-sg')==='search'){V.q=e.target.value;var pos=e.target.selectionStart;render(host);var n=host.querySelector('.sg-search');if(n){n.focus();n.setSelectionRange(pos,pos)}}
}
function toast(t){
  var d=document.createElement('div');d.className='sg-toast';d.textContent=t;document.body.appendChild(d);
  setTimeout(function(){d.classList.add('out')},1800);setTimeout(function(){d.remove()},2300);
}
function b64e(o){return btoa(unescape(encodeURIComponent(JSON.stringify(o)))).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'')}
function b64d(s){s=s.replace(/-/g,'+').replace(/_/g,'/');while(s.length%4)s+='=';return JSON.parse(decodeURIComponent(escape(atob(s))))}
function shareLink(s){
  var url=location.origin+location.pathname+'#song='+b64e({t:s.title,a:s.artist||'',x:s.text,m:s.melody||''});
  if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(url).then(function(){toast('Enlace copiado: pégalo en WhatsApp para Bruno')},function(){window.prompt('Copia este enlace',url)})}
  else window.prompt('Copia este enlace',url);
}
var SAMPLE={title:'Ejemplo: cuatro acordes',artist:'Canción de práctica',text:
'[Intro]\nC   G   Am  F\n\n[Verso]\nC            G\nEsta es una canción de ejemplo\nAm           F\nPara practicar los cuatro acordes\nC            G\nLos de casi todas las canciones\nAm           F\nSube y baja, sube y baja\n\n[Coro]\nF        C\nLa la la la la\nG        Am\nLa la la la la\nF        C      G    C\nHasta llegar al final',
  melody:'Mi Mi Fa Sol Sol Fa Mi Re Do Do Re Mi Mi:2 Re Re:2'};
function onClick(e){
  var pk=e.target.closest('.pk');
  if(pk){keyPress(+pk.getAttribute('data-m'));return}
  var b=e.target.closest('[data-sg]');if(!b)return;
  var a=b.getAttribute('data-sg'),v=b.getAttribute('data-v'),s=V.id?byId(V.id):null;
  switch(a){
    case 'new':V.edit={isNew:true,title:'',artist:'',text:'',melody:''};V.screen='edit';render(host);window.scrollTo(0,0);break;
    case 'sample':var n={id:uid(),title:SAMPLE.title,artist:SAMPLE.artist,text:SAMPLE.text,melody:SAMPLE.melody};songs.unshift(n);save();V.id=n.id;V.screen='read';V.tr=0;V.easy=false;render(host);break;
    case 'open':V.id=b.getAttribute('data-id');V.screen='read';V.tr=0;V.easy=false;V.melIdx=-1;V.practice=false;clearTimers();render(host);window.scrollTo(0,0);break;
    case 'back':clearTimers();V.practice=false;V.screen='list';render(host);break;
    case 'edit':V.edit={isNew:false,id:s.id,title:s.title,artist:s.artist||'',text:s.text,melody:s.melody||''};V.screen='edit';render(host);break;
    case 'save':
      var ed=V.edit;if(!ed.text.trim()&&!ed.title.trim()){toast('Escribe al menos un título o pega la letra');break}
      if(ed.isNew){var ns={id:uid(),title:ed.title.trim()||'Sin título',artist:ed.artist.trim(),text:ed.text,melody:ed.melody};songs.unshift(ns);V.id=ns.id}
      else{var o=byId(ed.id);o.title=ed.title.trim()||'Sin título';o.artist=ed.artist.trim();o.text=ed.text;o.melody=ed.melody;delete o._c}
      save();V.screen='read';V.tr=0;render(host);window.scrollTo(0,0);toast('Guardada');break;
    case 'del':if(window.confirm('¿Borrar esta canción?')){songs=songs.filter(function(x){return x.id!==V.edit.id});save();V.screen='list';render(host)}break;
    case 'tr':V.tr=Math.max(-11,Math.min(11,V.tr+(+v)));render(host);break;
    case 'easy':V.easy=v==='1';render(host);break;
    case 'chord':
      openSheet({pc:+b.getAttribute('data-pc'),type:b.getAttribute('data-type'),name:b.getAttribute('data-name'),txt:b.getAttribute('data-txt'),bass:b.getAttribute('data-bass')===''?null:+b.getAttribute('data-bass')});break;
    case 'prog':R.audioReady();playProg(s);break;
    case 'share':shareLink(s);break;
    case 'mplay':R.audioReady();playMelody(s);break;
    case 'mstop':clearTimers();V.melIdx=-1;redraw(true);break;
    case 'mprac':V.practice=!V.practice;V.pIdx=0;clearTimers();V.melIdx=-1;if(V.practice)skipRests(s);redraw(true);break;
    case 'bpm':V.bpm=Math.max(40,Math.min(200,V.bpm+(+v)));redraw(true);break;
  }
}
function skipRests(s){var mel=parseMelody(s.melody);while(V.pIdx<mel.length&&mel[V.pIdx].rest)V.pIdx++}
function keyPress(m){
  var s=V.id?byId(V.id):null;
  snd(m,0,1.1,.3);
  if(!V.practice||!s)return;
  var mel=parseMelody(s.melody);if(V.pIdx>=mel.length)return;
  var n=mel[V.pIdx];
  if(((m%12)+12)%12===n.pc){V.pIdx++;skipRests(s);redraw(true);if(V.pIdx>=mel.length)[0,4,7,12].forEach(function(x,i){snd(72+x,.1+i*.09,.7,.2)})}
}

/* ---------- importar por enlace ---------- */
function importFromHash(){
  var h=location.hash||'';
  if(h.indexOf('#song=')!==0)return false;
  try{
    var o=b64d(h.slice(6));
    var n={id:uid(),title:o.t||'Canción',artist:o.a||'',text:o.x||'',melody:o.m||''};
    var dup=songs.filter(function(x){return x.title===n.title&&x.text===n.text})[0];
    if(!dup){songs.unshift(n);save();V.id=n.id}else V.id=dup.id;
    V.screen='read';
    history.replaceState(null,'',location.pathname+'#canciones');
    return true;
  }catch(e){return false}
}
R.views.canciones={render:function(el){render(el)},leave:function(){clearTimers();closeSheet()}};
document.addEventListener('keydown',function(e){if(e.key==='Escape')closeSheet()});
if(importFromHash()){R.setTab('canciones');toast('Canción guardada en tu biblioteca')}
})();
