/* Rehearsal · sonidos: sintetizador, piano, órgano, Rhodes, bajo y batería (todo con Web Audio, sin archivos) */
(function(){
'use strict';
var R=window.REH;
var noiseBuf=null;
function ctx(){return R.audio()}
function out(){return R.master()}
function noise(a){
  if(noiseBuf&&noiseBuf.sampleRate===a.sampleRate)return noiseBuf;
  var n=a.sampleRate*1,b=a.createBuffer(1,n,a.sampleRate),d=b.getChannelData(0);
  for(var i=0;i<n;i++)d[i]=Math.random()*2-1;
  noiseBuf=b;return b;
}
function T(a,when,abs){return abs?when:a.currentTime+(when||0)}
function env(a,g,t,v,att,dur,rel){
  g.gain.setValueAtTime(0.0001,t);
  g.gain.linearRampToValueAtTime(v,t+att);
  g.gain.exponentialRampToValueAtTime(Math.max(v*0.0005,0.00005),t+dur+(rel||0));
}
function osc(a,type,f,t,d,dest,detune){
  var o=a.createOscillator();o.type=type;o.frequency.value=f;if(detune)o.detune.value=detune;
  o.connect(dest);o.start(t);o.stop(t+d+.08);return o;
}

var VOICES={
  piano:function(a,f,t,d,v,dest){
    var g=a.createGain();g.connect(dest);
    env(a,g,t,v,.004,Math.max(d,1.2)*1.1,0);
    var lp=a.createBiquadFilter();lp.type='lowpass';lp.frequency.setValueAtTime(Math.min(9000,f*9),t);lp.frequency.exponentialRampToValueAtTime(Math.max(f*2,500),t+d);
    lp.connect(g);
    [[1,1,.9],[2,.5,.5],[3,.33,.35],[4,.25,.2],[5,.12,.12]].forEach(function(p){
      var gg=a.createGain();gg.gain.value=p[2]*.55;gg.connect(lp);osc(a,'sine',f*p[0],t,Math.max(d,1.2)*1.1,gg,p[0]>2?(Math.random()*4-2):0);
    });
    /* martillo */
    var n=a.createBufferSource();n.buffer=noise(a);var nf=a.createBiquadFilter();nf.type='bandpass';nf.frequency.value=Math.min(f*4,4000);
    var ng=a.createGain();ng.gain.setValueAtTime(v*.25,t);ng.gain.exponentialRampToValueAtTime(.0005,t+.04);
    n.connect(nf);nf.connect(ng);ng.connect(dest);n.start(t);n.stop(t+.06);
  },
  organ:function(a,f,t,d,v,dest){
    var g=a.createGain();g.connect(dest);
    g.gain.setValueAtTime(0.0001,t);g.gain.linearRampToValueAtTime(v*.8,t+.02);
    g.gain.setValueAtTime(v*.8,t+d);g.gain.linearRampToValueAtTime(0.0001,t+d+.12);
    [[.5,.5],[1,1],[2,.7],[3,.35],[4,.25],[6,.15]].forEach(function(p){
      var gg=a.createGain();gg.gain.value=p[1]*.35;gg.connect(g);osc(a,'sine',f*p[0],t,d+.14,gg);
    });
  },
  rhodes:function(a,f,t,d,v,dest){
    var g=a.createGain();g.connect(dest);
    env(a,g,t,v*.95,.006,Math.max(d,1.6),0);
    var car=a.createOscillator();car.type='sine';car.frequency.value=f;
    var mod=a.createOscillator();mod.type='sine';mod.frequency.value=f*14;
    var mg=a.createGain();mg.gain.setValueAtTime(f*1.4,t);mg.gain.exponentialRampToValueAtTime(f*.02,t+.35);
    var mod2=a.createOscillator();mod2.type='sine';mod2.frequency.value=f;
    var mg2=a.createGain();mg2.gain.setValueAtTime(f*.9,t);mg2.gain.exponentialRampToValueAtTime(f*.12,t+Math.max(d,1.2));
    mod.connect(mg);mg.connect(car.frequency);mod2.connect(mg2);mg2.connect(car.frequency);
    var trem=a.createGain();trem.gain.value=1;
    var lfo=a.createOscillator();lfo.frequency.value=5;var lg=a.createGain();lg.gain.value=.12;lfo.connect(lg);lg.connect(trem.gain);
    car.connect(trem);trem.connect(g);
    var e=t+Math.max(d,1.6)+.1;
    [car,mod,mod2,lfo].forEach(function(o){o.start(t);o.stop(e)});
  },
  synth:function(a,f,t,d,v,dest){
    var g=a.createGain();g.connect(dest);
    g.gain.setValueAtTime(0.0001,t);g.gain.linearRampToValueAtTime(v*.55,t+.015);
    g.gain.setValueAtTime(v*.5,t+Math.max(d-.08,.05));g.gain.exponentialRampToValueAtTime(.0005,t+d+.2);
    var lp=a.createBiquadFilter();lp.type='lowpass';lp.Q.value=6;
    lp.frequency.setValueAtTime(f*8,t);lp.frequency.exponentialRampToValueAtTime(f*2.2,t+Math.max(d,.3));
    lp.connect(g);
    osc(a,'sawtooth',f,t,d+.2,lp,-7);osc(a,'sawtooth',f,t,d+.2,lp,7);osc(a,'square',f/2,t,d+.2,lp,0);
  },
  bass:function(a,f,t,d,v,dest){
    var g=a.createGain();g.connect(dest);
    env(a,g,t,v*1.1,.008,Math.max(d,.25),0);
    var lp=a.createBiquadFilter();lp.type='lowpass';lp.frequency.setValueAtTime(900,t);lp.frequency.exponentialRampToValueAtTime(220,t+.3);lp.connect(g);
    osc(a,'sawtooth',f,t,d+.1,lp);var s=a.createGain();s.gain.value=.9;s.connect(g);osc(a,'sine',f,t,d+.1,s);
  },
  guitar:function(a,f,t,d,v,dest){
    var g=a.createGain();g.connect(dest);
    env(a,g,t,v*.8,.003,Math.max(d,1.4),0);
    var lp=a.createBiquadFilter();lp.type='lowpass';lp.frequency.setValueAtTime(Math.min(6000,f*10),t);lp.frequency.exponentialRampToValueAtTime(Math.max(f*1.5,300),t+1);lp.connect(g);
    osc(a,'triangle',f,t,Math.max(d,1.4),lp);osc(a,'sawtooth',f,t,Math.max(d,1.4),lp,3);
  }
};
var NAMES=[
  {id:'piano',label:'Piano'},{id:'rhodes',label:'Rhodes'},{id:'organ',label:'Órgano'},
  {id:'synth',label:'Sintetizador'},{id:'bass',label:'Bajo'},{id:'guitar',label:'Guitarra'}
];

var DRUMS={
  kick:function(a,t,v,dest){
    var o=a.createOscillator(),g=a.createGain();o.type='sine';
    o.frequency.setValueAtTime(160,t);o.frequency.exponentialRampToValueAtTime(42,t+.14);
    g.gain.setValueAtTime(v*1.3,t);g.gain.exponentialRampToValueAtTime(.001,t+.34);
    o.connect(g);g.connect(dest);o.start(t);o.stop(t+.36);
  },
  snare:function(a,t,v,dest){
    var n=a.createBufferSource();n.buffer=noise(a);var f=a.createBiquadFilter();f.type='highpass';f.frequency.value=1500;
    var g=a.createGain();g.gain.setValueAtTime(v*.7,t);g.gain.exponentialRampToValueAtTime(.001,t+.2);
    n.connect(f);f.connect(g);g.connect(dest);n.start(t);n.stop(t+.22);
    var o=a.createOscillator(),og=a.createGain();o.type='triangle';o.frequency.setValueAtTime(220,t);o.frequency.exponentialRampToValueAtTime(130,t+.1);
    og.gain.setValueAtTime(v*.6,t);og.gain.exponentialRampToValueAtTime(.001,t+.12);o.connect(og);og.connect(dest);o.start(t);o.stop(t+.14);
  },
  hat:function(a,t,v,dest){
    var n=a.createBufferSource();n.buffer=noise(a);var f=a.createBiquadFilter();f.type='highpass';f.frequency.value=7000;
    var g=a.createGain();g.gain.setValueAtTime(v*.38,t);g.gain.exponentialRampToValueAtTime(.001,t+.05);
    n.connect(f);f.connect(g);g.connect(dest);n.start(t);n.stop(t+.07);
  },
  ohat:function(a,t,v,dest){
    var n=a.createBufferSource();n.buffer=noise(a);var f=a.createBiquadFilter();f.type='highpass';f.frequency.value=6000;
    var g=a.createGain();g.gain.setValueAtTime(v*.35,t);g.gain.exponentialRampToValueAtTime(.001,t+.3);
    n.connect(f);f.connect(g);g.connect(dest);n.start(t);n.stop(t+.32);
  },
  clap:function(a,t,v,dest){
    var f=a.createBiquadFilter();f.type='bandpass';f.frequency.value=1500;f.Q.value=.8;f.connect(dest);
    [0,.012,.024,.04].forEach(function(dt,i){
      var n=a.createBufferSource();n.buffer=noise(a);var g=a.createGain();
      g.gain.setValueAtTime(v*.55,t+dt);g.gain.exponentialRampToValueAtTime(.001,t+dt+(i===3?.16:.02));
      n.connect(g);g.connect(f);n.start(t+dt);n.stop(t+dt+.18);
    });
  },
  tom:function(a,t,v,dest){
    var o=a.createOscillator(),g=a.createGain();o.type='sine';
    o.frequency.setValueAtTime(210,t);o.frequency.exponentialRampToValueAtTime(95,t+.2);
    g.gain.setValueAtTime(v,t);g.gain.exponentialRampToValueAtTime(.001,t+.32);
    o.connect(g);g.connect(dest);o.start(t);o.stop(t+.34);
  }
};
var DRUM_LIST=[
  {id:'kick',label:'Bombo',color:'#ff8a6a'},{id:'snare',label:'Caja',color:'#a98fff'},
  {id:'hat',label:'Hi-hat',color:'#58dcaa'},{id:'ohat',label:'Hat abierto',color:'#6fd0ff'},
  {id:'clap',label:'Palmas',color:'#ffd166'},{id:'tom',label:'Tom',color:'#ff7ab8'}
];

R.inst={
  names:NAMES,drums:DRUM_LIST,
  /* when: segundos desde ahora (o tiempo absoluto si abs=true) */
  note:function(name,midi,when,dur,vol,abs,dest){
    var a=ctx();if(!a)return;
    var fn=VOICES[name]||VOICES.piano;
    fn(a,R.midiFreq(midi),T(a,when,abs),dur||1,vol||.3,dest||out());
  },
  drum:function(name,when,vol,abs,dest){
    var a=ctx();if(!a)return;
    (DRUMS[name]||DRUMS.kick)(a,T(a,when,abs),vol||.6,dest||out());
  }
};
})();
