export type Vec3 = [number, number, number];
export type SurfaceKind = 'concrete' | 'dark' | 'red' | 'glass';
export interface Entity { id: string; position: Vec3; size: Vec3; rotation: Vec3; kind: SurfaceKind; gravity?: Vec3[]; }
export interface Checkpoint { position: Vec3; up: Vec3; radius: number; }
export interface Race { id: string; name: string; district: string; description: string; start: Checkpoint; yaw: number; checkpoints: Checkpoint[]; medals: [number, number, number]; }
export interface Secret { id: string; position: Vec3; kind?:'pole'|'scissors'|'clipper'; }
export interface City { version: 1; id: string; name: string; spawn: Vec3; entities: Entity[]; races: Race[]; secrets: Secret[]; }
export interface GhostFrame { t: number; p: Vec3; q: [number, number, number, number]; }
export interface RecordRun { time: number; frames: GhostFrame[]; splits: number[]; worldId: string; signature: string; }
export interface Settings { sensitivity: number; invertY: boolean; volume: number; quality: 'low' | 'high'; fov: number; comfort: boolean; ghost: boolean; camera: 'first' | 'third'; skin: string; }
export interface Save { version: 1; settings: Settings; secrets: string[]; records: Record<string, RecordRun>; }
export type Screen = 'menu' | 'playing' | 'paused' | 'races' | 'skins' | 'options' | 'map' | 'help' | 'result' | 'editor';
