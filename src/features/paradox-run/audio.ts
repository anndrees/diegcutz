type Sound='jump'|'land'|'gravity'|'checkpoint'|'collect'|'finish';
class RunAudio {
 ctx:AudioContext|null=null;gain:GainNode|null=null;wind:GainNode|null=null;
 private noise:AudioBuffer|null=null;private source:AudioBufferSourceNode|null=null;private steps=0;private sliding=false;
 init(volume:number){
  if(!this.ctx){
   this.ctx=new AudioContext();this.gain=this.ctx.createGain();const compressor=this.ctx.createDynamicsCompressor();this.gain.connect(compressor);compressor.connect(this.ctx.destination);
   this.noise=this.ctx.createBuffer(1,this.ctx.sampleRate*2,this.ctx.sampleRate);const data=this.noise.getChannelData(0);for(let i=0;i<data.length;i++)data[i]=Math.random()*2-1;
   this.source=this.ctx.createBufferSource();this.source.buffer=this.noise;this.source.loop=true;const filter=this.ctx.createBiquadFilter();filter.type='lowpass';filter.frequency.value=850;
   this.wind=this.ctx.createGain();this.wind.gain.value=0;this.source.connect(filter);filter.connect(this.wind);this.wind.connect(this.gain);this.source.start();
  }
  this.setVolume(volume);void this.ctx.resume();
 }
 setVolume(volume:number){if(this.ctx&&this.gain)this.gain.gain.setTargetAtTime(Math.max(0,Math.min(1,volume)),this.ctx.currentTime,.04);}
 speed(speed:number,active:boolean){if(this.ctx&&this.wind)this.wind.gain.setTargetAtTime(active?Math.min(.12,speed*.004):0,this.ctx.currentTime,.12);if(!active){this.steps=0;this.sliding=false;}}
 private burst(frequency:number,duration:number,volume:number){
  if(!this.ctx||!this.gain||!this.noise)return;
  const ctx=this.ctx,source=ctx.createBufferSource(),filter=ctx.createBiquadFilter(),g=ctx.createGain(),t=ctx.currentTime;
  source.buffer=this.noise;filter.type='lowpass';filter.frequency.setValueAtTime(frequency,t);filter.frequency.exponentialRampToValueAtTime(Math.max(70,frequency*.25),t+duration);
  g.gain.setValueAtTime(volume,t);g.gain.exponentialRampToValueAtTime(.0001,t+duration);source.connect(filter);filter.connect(g);g.connect(this.gain);source.start();source.stop(t+duration+.02);source.onended=()=>{source.disconnect();filter.disconnect();g.disconnect();};
 }
 private note(freq:number,end:number,duration:number,delay=0,type:OscillatorType='sine'){
  if(!this.ctx||!this.gain)return;const osc=this.ctx.createOscillator(),g=this.ctx.createGain(),t=this.ctx.currentTime+delay;
  osc.type=type;osc.frequency.setValueAtTime(freq,t);osc.frequency.exponentialRampToValueAtTime(Math.max(20,end),t+duration);g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(.07,t+.012);g.gain.exponentialRampToValueAtTime(.0001,t+duration);
  osc.connect(g);g.connect(this.gain);osc.start(t);osc.stop(t+duration+.02);osc.onended=()=>{osc.disconnect();g.disconnect();};
 }
 event(sound:Sound){
  if(sound==='jump'){this.burst(1100,.13,.09);this.note(130,210,.12);}
  if(sound==='land'){this.burst(480,.22,.18);this.note(80,35,.17);}
  if(sound==='gravity'){this.burst(2200,.5,.1);this.note(85,520,.4);this.note(260,130,.48,.08,'triangle');}
  if(sound==='checkpoint'){this.note(660,660,.15);this.note(990,990,.24,.08);}
  if(sound==='collect'){[523,659,784,1047].forEach((f,i)=>this.note(f,f,.22,i*.055,'triangle'));}
  if(sound==='finish'){[392,523,659,784,1047].forEach((f,i)=>this.note(f,f,.7,i*.12,'triangle'));this.burst(1600,.5,.06);}
 }
 motion(distance:number,grounded:boolean,sliding:boolean){
  if(sliding&&!this.sliding)this.burst(1800,.55,.07);this.sliding=sliding;
  if(!grounded||sliding){this.steps=0;return;}this.steps+=distance;
  if(this.steps>1.45){this.steps%=1.45;this.burst(650,.08,.08);this.note(90,48,.075);}
 }
 tone(freq=500){this.note(freq,freq*.8,.2);}
 dispose(){this.source?.stop();void this.ctx?.close();this.ctx=null;this.gain=null;this.wind=null;this.noise=null;this.source=null;this.steps=0;this.sliding=false;}
}
export const runAudio=new RunAudio();
