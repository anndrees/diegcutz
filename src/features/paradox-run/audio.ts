class RunAudio {
 ctx:AudioContext|null=null;gain:GainNode|null=null;wind:GainNode|null=null;
 init(volume:number){if(!this.ctx){this.ctx=new AudioContext();this.gain=this.ctx.createGain();this.gain.connect(this.ctx.destination);const buffer=this.ctx.createBuffer(1,this.ctx.sampleRate*2,this.ctx.sampleRate),data=buffer.getChannelData(0);for(let i=0;i<data.length;i++)data[i]=Math.random()*2-1;const source=this.ctx.createBufferSource();source.buffer=buffer;source.loop=true;const filter=this.ctx.createBiquadFilter();filter.type='lowpass';filter.frequency.value=650;this.wind=this.ctx.createGain();this.wind.gain.value=0;source.connect(filter);filter.connect(this.wind);this.wind.connect(this.gain);source.start();}this.gain?.gain.setTargetAtTime(volume,this.ctx.currentTime,.05);void this.ctx.resume();}
 speed(speed:number,active:boolean){if(this.ctx&&this.wind)this.wind.gain.setTargetAtTime(active?Math.min(.14,speed*.005):0,this.ctx.currentTime,.1);}
 tone(freq:number=500){if(!this.ctx||!this.gain)return;const osc=this.ctx.createOscillator(),g=this.ctx.createGain(),t=this.ctx.currentTime;osc.type='sine';osc.frequency.setValueAtTime(freq,t);osc.frequency.exponentialRampToValueAtTime(freq*.5,t+.22);g.gain.setValueAtTime(.14,t);g.gain.exponentialRampToValueAtTime(.001,t+.25);osc.connect(g);g.connect(this.gain);osc.start();osc.stop(t+.26);}
 dispose(){void this.ctx?.close();this.ctx=null;this.gain=null;this.wind=null;}
}
export const runAudio=new RunAudio();
