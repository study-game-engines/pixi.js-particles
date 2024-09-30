import { Texture } from '@pixi/core'
import { Particle } from '../Particle'
import { BehaviorOrder, IEmitterBehavior } from './Behaviors'
import { GetTextureFromString } from '../ParticleUtils'
import { BehaviorEditorConfig } from './editor/Types'

/**
 * A Texture behavior that assigns a single texture to each particle.
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

    public static type: string = 'textureSingle'
    public static editorConfig: BehaviorEditorConfig | null = null

    public readonly order: BehaviorOrder = BehaviorOrder.Normal
    private readonly texture: Texture

    constructor(config: {
        texture: Texture | string // Image to use for each particle.
    }) {
        this.texture = typeof config.texture === 'string' ? GetTextureFromString(config.texture) : config.texture
    }

    initParticles(first: Particle): void {
        let next: Particle = first
        while (next) {
            next.texture = this.texture
            next = next.next
        }
    }

}
