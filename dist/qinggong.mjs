// Physics-independent lightness skill. Heights refer to the Cannon sphere centre.
export const FLIGHT_CEILING=22.39;
export const createFlight=()=>({mode:'ground',vertical:0});
export function toggleFlight(f){
 if(f.mode==='flight'){f.mode='glide';f.vertical=Math.min(0,f.vertical);}
 else {f.mode='flight';f.vertical=6;}
}
export function stepFlight(f,{height,ascend=false,descend=false,dash=false},dt){
 const step=Math.max(0,Math.min(.1,dt));
 if(f.mode!=='ground'&&height<=.46&&(descend||f.mode==='glide')){f.mode='ground';f.vertical=0;}
 if(f.mode==='ground')return {active:false,vertical:0,speed:4.4};
 const target=descend?-4.5:ascend&&f.mode==='flight'?5.5:f.mode==='glide'?-2.4:0;
 f.vertical+=(target-f.vertical)*(1-Math.exp(-step*5));
 // Brake softly before the ceiling, then prevent any positive overshoot.
 if(f.vertical>0)f.vertical=Math.min(f.vertical,Math.max(0,(FLIGHT_CEILING-height)*3));
 return {active:true,vertical:f.vertical,speed:dash?13:f.mode==='glide'?6:8};
}
