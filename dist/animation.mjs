const guard={arm:[-.3,-.12,.1],left:[-.55,.25,-.35],torso:[0,0,0],legs:[.08,-.1],elbow:.2,wrist:0,drop:0};
const moves={
 cloud:{title:'拨云',duration:.41,hitAt:.10,damage:27,reach:2.8,lunge:.7,pre:{arm:[.45,-.65,.35],left:[-.7,.3,-.6],torso:[.08,-.35,.08],legs:[-.2,.25],elbow:.7,wrist:-.3,drop:-.08},strike:{arm:[-1.5,.55,-1],left:[-.6,.35,-.8],torso:[-.05,.4,-.12],legs:[.3,-.2],elbow:.15,wrist:.4,drop:0}},
 river:{title:'横江',duration:.47,hitAt:.13,damage:31,reach:3,lunge:.8,pre:{arm:[-1.1,1.1,-.2],left:[-1,.2,-.5],torso:[0,.5,-.1],legs:[.2,-.3],elbow:.8,wrist:-.2,drop:-.05},strike:{arm:[-.8,-1.5,.1],left:[-.5,-.3,-1],torso:[0,-.6,.12],legs:[-.25,.4],elbow:.15,wrist:.8,drop:-.03}},
 wind:{title:'回风',duration:.64,hitAt:.21,damage:47,reach:3.4,lunge:1,pre:{arm:[-.3,-1.1,.8],left:[-.8,0,-1],torso:[.1,-.85,.2],legs:[-.4,.15],elbow:.7,wrist:0,drop:-.13},strike:{arm:[-1.2,1,-.6],left:[-1,.2,-.3],torso:[-.1,1,.08],legs:[.4,-.25],elbow:.1,wrist:.4,drop:.03}},
 heavy:{title:'落雁',duration:.9,hitAt:.4,damage:65,reach:3.5,lunge:1.15,pre:{arm:[-2.7,.1,-.25],left:[-2.3,-.3,-.2],torso:[-.22,-.15,0],legs:[-.2,.3],elbow:1,wrist:0,drop:-.09},strike:{arm:[-.4,0,-.1],left:[-.5,0,-.3],torso:[.4,.15,0],legs:[.5,-.3],elbow:.1,wrist:-.2,drop:-.2}},
 counter:{title:'燕返',duration:.42,hitAt:.09,damage:43,reach:3.5,lunge:1.3,pre:{arm:[.15,-.3,.4],left:[-.8,.3,-.7],torso:[.2,-.4,.15],legs:[-.35,.3],elbow:1.1,wrist:0,drop:-.2},strike:{arm:[-1.55,0,-.15],left:[-.8,0,-1],torso:[.1,.2,0],legs:[.5,-.3],elbow:0,wrist:0,drop:-.04}}
};
export function makeAttack(kind='light',combo=1){const id=kind==='light'?['cloud','river','wind'][(combo-1)%3]:kind;return {...moves[id],id,elapsed:0,hit:false};}
export function advanceAttack(a,dt){const before=a.elapsed;a.elapsed=Math.min(a.duration,a.elapsed+Math.max(0,dt));if(!a.hit&&before<a.hitAt&&a.elapsed>=a.hitAt){a.hit=true;return true}return false;}
const ease=t=>t*t*(3-2*t);
function blend(a,b,t){const o={};for(const key of Object.keys(a))o[key]=Array.isArray(a[key])?a[key].map((v,i)=>v+(b[key][i]-v)*t):a[key]+(b[key]-a[key])*t;return o;}
export function samplePose(a,t=a.elapsed){if(t<=0||t>=a.duration)return structuredClone(guard);if(t<a.hitAt*.85)return blend(guard,a.pre,ease(t/(a.hitAt*.85)));if(t<a.hitAt+.08)return blend(a.pre,a.strike,ease((t-a.hitAt*.85)/(.08+a.hitAt*.15)));return blend(a.strike,guard,ease((t-a.hitAt-.08)/(a.duration-a.hitAt-.08)));}
export function isCounterWindow(now,lastDodge){return now>=lastDodge&&now-lastDodge<.7;}
