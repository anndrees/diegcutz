export interface Service {
  id: string;
  name: string;
  price: number;
}

export interface Pack {
  id: string;
  name: string;
  price: number;
  includedServices: string[];
}

export const SERVICES: Service[] = [
  { id: 'degradado', name: 'DEGRADADO', price: 7 },
  { id: 'cejas', name: 'CEJAS', price: 1.5 },
  { id: 'vaciar', name: 'VACIAR O TEXTURIZADO', price: 1 },
  { id: 'barba', name: 'BARBA', price: 2 },
  { id: 'diseno', name: 'DISEÑO', price: 0.5 },
];

export const PACKS: Pack[] = [
  {
    id: 'fresh',
    name: 'PACK FRESH',
    price: 8,
    includedServices: ['degradado', 'cejas'],
  },
  {
    id: 'urban',
    name: 'PACK URBAN',
    price: 8,
    includedServices: ['degradado', 'diseno', 'vaciar'],
  },
  {
    id: 'full_style',
    name: 'PACK FULL STYLE',
    price: 9,
    includedServices: ['degradado', 'diseno', 'vaciar', 'cejas'],
  },
];
