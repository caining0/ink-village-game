export function releasePlaceholder(actor){for(const o of [...actor.body.children]){o.traverse(part=>part.geometry?.dispose());actor.body.remove(o);}}
export function disposeActor(actor,scene){if(actor.removed)return;actor.removed=true;scene.remove(actor.group);if(actor.warning){scene.remove(actor.warning);actor.warning.geometry.dispose();actor.warning.material.dispose();}actor.dispose?.();}
