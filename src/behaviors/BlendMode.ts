import { Particle } from '../Particle'
import { getBlendMode } from '../ParticleUtils'
import { IEmitterBehavior, BehaviorOrder } from './Behaviors'
import { BehaviorEditorConfig } from './editor/Types'

/**
 * A Blend Mode behavior that applies a blend mode value to the particle at initialization.
 * ```javascript
 * {
 *     type: 'blendMode',
 *     config: {
 *         blendMode: 'multiply',
 *     }
 * }
 * ```
 */
export class BlendModeBehavior implements IEmitterBehavior {

    public static type: string = 'blendMode'
    public static editorConfig: BehaviorEditorConfig | null = null

    public readonly order: BehaviorOrder = BehaviorOrder.Normal
    private readonly value: string

    constructor(config: {
        blendMode: string // Blend mode of all particles https://pixijs.download/release/docs/PIXI.html#BLEND_MODES
    }) {
        this.value = config.blendMode
    }

    initParticles(first: Particle): void {
        let next: Particle = first
        while (next) {
            next.blendMode = getBlendMode(this.value)
            next = next.next
        }
    }

}
