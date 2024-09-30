import { Particle } from '../Particle'
import { PropertyList } from '../PropertyList'
import { PropertyNode, ValueList } from '../PropertyNode'
import { IEmitterBehavior, BehaviorOrder } from './Behaviors'
import { BehaviorEditorConfig } from './editor/Types'

/**
 * An Alpha behavior that applies an interpolated or stepped list of values to the particle's opacity.
 * ```javascript
 * {
 *     type: 'alpha',
 *     config: {
 *         alpha: {
 *              list: [{value: 0, time: 0}, {value: 1, time: 0.25}, {value: 0, time: 1}]
 *         },
 *     }
 * }
 * ```
 */
export class AlphaBehavior implements IEmitterBehavior {

    public static type: string = 'alpha'
    public static editorConfig: BehaviorEditorConfig = null

    public readonly order: BehaviorOrder = BehaviorOrder.Normal
    private list: PropertyList<number>

    constructor(config: {
        alpha: ValueList<number>
    }) {
        this.list = new PropertyList(false)
        this.list.reset(PropertyNode.createList(config.alpha))
        console.log('breakpoint')
    }

    initParticles(first: Particle): void {
        let next: Particle = first
        while (next) {
            next.alpha = this.list.first.value
            next = next.next
        }
    }

    updateParticle(particle: Particle): void {
        particle.alpha = this.list.interpolate(particle.agePercent)
    }

}

/**
 * An Alpha behavior that applies a static value to the particle's opacity at particle initialization.
 * ```javascript
 * {
 *     type: 'alphaStatic',
 *     config: {
 *         alpha: 0.75,
 *     }
 * }
 * ```
 */
export class StaticAlphaBehavior implements IEmitterBehavior {

    public static type: string = 'alphaStatic'
    public static editorConfig: BehaviorEditorConfig = null

    public readonly order: BehaviorOrder = BehaviorOrder.Normal
    private readonly value: number

    constructor(config: {
        alpha: number
    }) {
        this.value = config.alpha
    }

    initParticles(first: Particle): void {
        let next: Particle = first
        while (next) {
            next.alpha = this.value
            next = next.next
        }
    }

}
