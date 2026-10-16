import type { City, Entity, Race, Vec3, Checkpoint } from './types';
const entities: Entity[] = [];
const add = (id: string, p: Vec3, s: Vec3, kind: Entity['kind'] = 'concrete', gravity?: Vec3[], rotation: Vec3 = [0,0,0]) => entities.push({ id, position:p, size:s, kind, gravity, rotation });
const cp = (position: Vec3, up: Vec3 = [0,1,0], radius=3.2): Checkpoint => ({position,up,radius});
// Metres; traversable architecture and visual detailing share these transforms.
add('plaza', [0,-1,0], [76,2,72], 'concrete', [[0,1,0]]);
add('terrace-base',[88,-1,0],[92,2,72],'concrete',[[0,1,0]]);
add('tower-base',[190,-1,0],[110,2,72],'concrete',[[0,1,0]]);
add('link-one',[43,-.5,0],[16,1,18]);add('link-two',[140,-.5,0],[22,1,18]);
// Plaza monumental colonnade; generous central running lane.
for(let i=0;i<7;i++) {
 add(`colonnade-${i}`,[-28+i*9,7,-29],[2.2,14,2.2]);
 add(`rear-column-${i}`,[-28+i*9,7,29],[2.2,14,2.2]);
}
add('colonnade-crown',[0,14.5,-29],[68,2,4]);add('rear-crown',[0,14.5,29],[68,2,4]);
add('plaza-gravity-wall',[28,8,-13],[2,16,30],'dark',[[-1,0,0],[0,1,0]]);
add('plaza-upper', [14,15,-13],[22,2,30],'concrete',[[0,1,0]]);
add('plaza-return', [14,15.9,3],[22,.3,3],'red',[[0,1,0]]);
add('plaza-hurdle',[-3,.5,-8],[9,1,1],'dark');
add('plaza-slide-roof',[-8,1.65,-16],[8,.45,5],'dark');
add('slide-post-left',[-12.3,.9,-16],[.5,1.8,5]);add('slide-post-right',[-3.7,.9,-16],[.5,1.8,5]);
// Terrace axis: climb via a broad, sloped promenade; bridges connect every roof.
for(let i=0;i<4;i++) {
 const x=64+i*18, h=6+i*3;
 add(`terrace-${i}`,[x,h/2,-12],[15,h,24],'concrete',[[0,1,0],[0,0,1]]);
 if(i<3) add(`terrace-bridge-${i}`,[x+9,h-.3,-12],[5,.6,8],'dark',[[0,1,0]]);
}
add('promenade-ramp',[55,3,12],[12,.5,28],'concrete',undefined,[Math.atan2(6,28),0,0]);
add('promenade-upper',[65,6,-4],[30,.6,4]);
add('terrace-backbone',[91,12,-27],[76,.8,5],'concrete',[[0,1,0]]);
add('wallrun-left',[90,11,7],[40,8,1.2],'dark');
add('wallrun-right',[90,11,13],[40,8,1.2],'dark');
add('wallrun-floor',[90,6,10],[44,1,6]);
add('terrace-gravity',[131,12,-8],[2,24,36],'dark',[[-1,0,0],[0,1,0]]);
add('terrace-top',[117,24,-8],[20,1,36],'concrete',[[0,1,0]]);
add('terrace-return-landing',[123,-1,41],[18,2,22],'concrete',[[0,1,0]]);
add('terrace-return-link',[141,-1,22],[26,2,34],'concrete',[[0,1,0]]);
add('terrace-return-ramp',[123,12,19],[10,.5,50],'concrete',undefined,[Math.atan2(24,50),0,0]);
// Towers: solid fluted structures with traversable ledges and marked facades.
add('tower-a',[174,18,-10],[20,36,28],'concrete',[[0,1,0],[1,0,0],[0,0,1]]);
add('tower-b',[207,26,-16],[22,52,22],'dark',[[0,1,0],[-1,0,0],[0,0,1]]);
add('tower-c',[226,15,16],[20,30,24],'concrete',[[0,1,0],[-1,0,0],[0,0,-1]]);
add('tower-canopy',[192,36,-10],[14,1,14],'red',[[0,1,0],[0,-1,0]]);
add('tower-skybridge',[211,30,4],[12,1,22],'concrete',[[0,1,0],[0,-1,0]]);
add('tower-entry-wall',[157,9,12],[2,18,30],'dark',[[1,0,0],[0,1,0]]);
add('tower-entry-deck',[170,18,12],[18,1,30],'concrete',[[0,1,0]]);
add('tower-exit-ramp',[238,15,0],[12,.6,65],'concrete',undefined,[Math.atan2(30,65),0,0]);
// Small stepping structures provide optional rooftop shortcuts.
for(let i=0;i<5;i++) add(`step-${i}`,[45+i*3, .35+i*.6, -2],[3,.7+i*1.2,8]);
const races: Race[] = [
 {id:'impulse',name:'Primer impulso',district:'01 / ÁGORA',description:'La plaza. Saltos limpios y una primera línea de velocidad.',start:cp([-20,1,18]),yaw:0,checkpoints:[cp([-20,1,3]),cp([-17,1,-12]),cp([2,1,-20]),cp([17,1,-20]),cp([17,1,-2])],medals:[15,23,35]},
 {id:'terraces',name:'Entre terrazas',district:'02 / TERRAZAS',description:'Sube por el paseo y encadena las azoteas. Busca el atajo.',start:cp([55,1,25]),yaw:0,checkpoints:[cp([55,4,12]),cp([55,7,-1]),cp([64,7,-12]),cp([82,10,-12]),cp([100,13,-12]),cp([118,16,-12])],medals:[23,34,50]},
 {id:'wallline',name:'Línea de pared',district:'02 / TERRAZAS',description:'Un corredor estrecho elevado. Usa las paredes para conservar altura.',start:cp([72,7,10]),yaw:-Math.PI/2,checkpoints:[cp([84,7,10]),cp([96,7,10]),cp([108,7,10]),cp([115,1,24])],medals:[12,20,30]},
 {id:'axis',name:'Cambio de eje',district:'01 / ÁGORA',description:'La fachada se convierte en suelo. Cambia de gravedad y asciende.',start:cp([17,1,-18]),yaw:-Math.PI/2,checkpoints:[cp([26,3,-18],[-1,0,0]),cp([26,10,-12],[-1,0,0]),cp([20,17,-12]),cp([12,17,-2])],medals:[18,29,45]},
 {id:'inverted',name:'La ciudad invertida',district:'03 / VÉRTICE',description:'Cruza fachadas, alcanza el puente y corre bajo el voladizo.',start:cp([187,1,-5]),yaw:-Math.PI/2,checkpoints:[cp([195,8,-5],[-1,0,0]),cp([195,24,-5],[-1,0,0]),cp([192,34.5,-10],[0,-1,0]),cp([185.8,34.5,-10],[0,-1,0]),cp([178,37,-10])],medals:[30,45,65]},
 {id:'paradox',name:'Paradox Run',district:'CIUDAD / TRAVESÍA',description:'La ciudad entera en una carrera. Elige tus conexiones y domina los tres distritos.',start:cp([-20,1,18]),yaw:-Math.PI/2,checkpoints:[cp([25,1,15]),cp([55,1,25]),cp([82,10,-12]),cp([118,16,-12]),cp([129,16,-8],[-1,0,0]),cp([120,25.5,-8]),cp([155,1,20]),cp([159,9,12],[1,0,0]),cp([170,19.5,12]),cp([185,25,-10],[1,0,0]),cp([174,37,-10])],medals:[80,115,165]},
];
const secretPositions: Vec3[]=[[-30,1,-23],[-8,1,-16],[0,15.7,-29],[12,16,-23],[26,9,0],[32,1,25],[64,7,-21],[82,10,-21],[100,13,-21],[118,16,-21],[80,7,10],[120,25,-20],[159,15,22],[170,19,24],[174,37,-20],[207,53,-16],[226,31,22],[192,34.5,-14]];
export const DEFAULT_CITY: City={version:1,id:'paradox-city-v1',name:'CIUDAD / 001',spawn:[-20,1,18],entities,races,secrets:secretPositions.map((position,i)=>({id:`secret-${i+1}`,position}))};
export const SKINS=[{id:'signal',name:'SIGNAL / 01',token:'--pr-signal'},{id:'chalk',name:'CHALK / 02',token:'--pr-paper'},{id:'carbon',name:'CARBON / 03',token:'--pr-ink'},{id:'volt',name:'VOLT / 04',token:'--pr-volt'}];
