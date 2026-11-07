export function createState(){return {started:false,hp:100,stamina:100,kills:0,quest:0,enemies:[],nextId:1,spawnTimer:0,dodge:0,invulnerable:0,attackCd:0,ultimateCd:0,combo:0,dead:false,time:0};}
export function damageEnemy(s,id,damage){const e=s.enemies.find(e=>e.id===id);if(!e||e.hp<=0)return false;e.hp=Math.max(0,e.hp-damage);if(e.hp===0){s.kills++;return true}return false}
export function hurtPlayer(s,damage){if(s.dead||s.dodge>0||s.invulnerable>0)return false;s.hp=Math.max(0,s.hp-damage);s.invulnerable=0.8;if(s.hp===0)s.dead=true;return true}
export function tickState(s,dt){if(!s.started||s.dead)return;dt=Math.min(dt,3);s.time+=dt;for(const k of ['dodge','invulnerable','attackCd','ultimateCd'])s[k]=Math.max(0,s[k]-dt);s.enemies=s.enemies.filter(e=>e.hp>0||s.time-e.deathTime<1.2);s.spawnTimer-=dt;if(s.spawnTimer<=0&&s.enemies.filter(e=>e.hp>0).length<6){s.enemies.push({id:s.nextId++,hp:72,deathTime:Infinity});s.spawnTimer=2.6;}}
export function canRingBell(s){return s.quest>=1&&s.kills>=5}
export function resetState(s){Object.assign(s,createState())}
export function castUltimate(s){if(!s.started||s.dead||s.ultimateCd>0)return false;s.ultimateCd=12;s.invulnerable=Math.max(s.invulnerable,1.2);return true}
