import { Particle } from '../Particle'
import { PropertyList } from '../PropertyList'
import { PropertyNode, ValueList } from '../PropertyNode'
import { BehaviorOrder, IEmitterBehavior } from './Behaviors'
import { BehaviorEditorConfig } from './editor/Types'

/**
 * A Scale behavior that applies an interpolated or stepped list of values to the particle's x & y scale.
 * ```javascript
 * {
 *     type: 'scale',
 *     config: {
 *          scale: {
 *              list: [{value: 0, time: 0}, {value: 1, time: 0.25}, {value: 0, time: 1}],
 *              isStepped: true
 *          },
 *          minMult: 0.5
 *     }
 * }
 * ```
 */
export class ScaleBehavior implements IEmitterBehavior {

    public static type: string = 'scale'
    public static editorConfig: BehaviorEditorConfig = null

    public order: BehaviorOrder = BehaviorOrder.Normal
    private list: PropertyList<number>
    private readonly minMult: number

    constructor(config: {
        scale: ValueList<number> // Scale of the particles, with a minimum value of 0
        minMult: number // A value between minimum scale multipler and 1 is randomly generated and multiplied with each scale value to provide the actual scale for each particle.
    }) {
        this.list = new PropertyList(false)
        this.list.reset(PropertyNode.createList(config.scale))
        this.minMult = config.minMult ?? 1
    }

    initParticles(first: Particle): void {
        let next: Particle = first
        while (next) {
            const mult = (Math.random() * (1 - this.minMult)) + this.minMult
            next.config.scaleMult = mult
            next.scale.x = next.scale.y = this.list.first.value * mult
            next = next.next
        }
    }

    updateParticle(particle: Particle): void {
        particle.scale.x = particle.scale.y = this.list.interpolate(particle.agePercent) * particle.config.scaleMult
    }

}

/**
 * A Scale behavior that applies a randomly picked value to the particle's x & y scale at initialization.
 * ```javascript
 * {
 *     type: 'scaleStatic',
 *     config: {
 *         min: 0.25,
 *         max: 0.75,
 *     }
 * }
 * ```
 */
export class StaticScaleBehavior implements IEmitterBehavior {

    public static type: string = 'scaleStatic'
    public static editorConfig: BehaviorEditorConfig = null

    public order: BehaviorOrder = BehaviorOrder.Normal
    private readonly min: number
    private readonly max: number

    constructor(config: {
        min: number // Minimum scale of the particles, with a minimum value of 0
        max: number // Maximum scale of the particles, with a minimum value of 0
    }) {
        this.min = config.min
        this.max = config.max
    }

    initParticles(first: Particle): void {
        let next: Particle = first
        while (next) {
            const scale = (Math.random() * (this.max - this.min)) + this.min
            next.scale.x = next.scale.y = scale
            next = next.next
        }
    }

}
