import {it,expect} from 'bun:test';
import {DEFAULT_CITY} from '../src/features/paradox-run/city';
import {ghostAt} from '../src/features/paradox-run/rules';
import {architecturalGeometry} from '../src/features/paradox-run/renderGeometry';
it('connectors fill only the gaps without coplanar base overlaps',()=>{
 const get=(id:string)=>{const e=DEFAULT_CITY.entities.find(e=>e.id===id);if(!e)throw Error(id);return e;};
 for(const [link,left,right] of [['link-one','plaza','terrace-base'],['link-two','terrace-base','tower-base']]){
  const e=get(link),a=get(left),b=get(right);expect(e.position[0]-e.size[0]/2).toBe(a.position[0]+a.size[0]/2);expect(e.position[0]+e.size[0]/2).toBe(b.position[0]-b.size[0]/2);
 }
});
it('ghost rotation interpolates continuously through a gravity turn',()=>{
 const f=ghostAt([{t:0,p:[0,0,0],q:[0,0,0,1]},{t:1,p:[1,0,0],q:[0,0,1,0]}],.5);
 expect(f?.q[2]).toBeCloseTo(Math.SQRT1_2,5);expect(f?.q[3]).toBeCloseTo(Math.SQRT1_2,5);
});
it('architectural UV coverage scales with metres rather than each object',()=>{
 const e=DEFAULT_CITY.entities[0],g=architecturalGeometry([e]);if(!g)throw Error('geometry');
 const uv=g.getAttribute('uv');let max=0;for(let i=0;i<uv.count;i++)max=Math.max(max,Math.abs(uv.getX(i)));expect(max).toBeGreaterThan(10);g.dispose();
});