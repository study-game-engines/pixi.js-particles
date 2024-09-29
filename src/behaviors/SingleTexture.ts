import { Texture } from '@pixi/core';
import { Particle } from '../Particle';
import { IEmitterBehavior, BehaviorOrder } from './Behaviors';
import { GetTextureFromString } from '../ParticleUtils';
import { BehaviorEditorConfig } from './editor/Types';

/**
 * A Texture behavior that assigns a single texture to each particle.
 * String values will be converted to textures with {@link ParticleUtils.GetTextureFromString}.
 *
 * Example config:
 * ```javascript
 * {
 *     type: 'textureSingle',
 *     config: {
 *         texture: Texture.from('myTexId'),
 *     }
 * }
 * ```
 */
export class SingleTextureBehavior implements IEmitterBehavior {

    public static type = 'textureSingle';
    public static editorConfig: BehaviorEditorConfig = null;
    public order = BehaviorOrder.Normal;
    private texture: Texture;

    constructor(config: {
        texture: Texture | string; // Image to use for each particle.
    }) {
        this.texture = typeof config.texture === 'string' ? GetTextureFromString(config.texture) : config.texture;
    }

    initParticles(first: Particle): void {
        let next = first;
        while (next) {
            next.texture = this.texture;
            next = next.next;
        }
    }

}
