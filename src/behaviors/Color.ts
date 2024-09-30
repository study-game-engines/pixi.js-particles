import { Particle } from '../Particle'
import { Color, combineRGBComponents } from '../ParticleUtils'
import { PropertyList } from '../PropertyList'
import { PropertyNode, ValueList } from '../PropertyNode'
import { IEmitterBehavior, BehaviorOrder } from './Behaviors'
import { BehaviorEditorConfig } from './editor/Types'

/**
 * A Color behavior that applies an interpolated or stepped list of values to the particle's tint property.
 * ```javascript
 * {
 *     type: 'color',
 *     config: {
 *         color: {
 *              list: [{value: '#ff0000' time: 0}, {value: '#00ff00', time: 0.5}, {value: '#0000ff', time: 1}]
 *         },
 *     }
 * }
 * ```
 */
export class ColorBehavior implements IEmitterBehavior {

    public static type: string = 'color'
    public static editorConfig: BehaviorEditorConfig = null

    public readonly order: BehaviorOrder = BehaviorOrder.Normal
    private list: PropertyList<Color>

    constructor(config: {
        color: ValueList<string> // Color of the particles as 6 digit hex codes.
    }) {
        this.list = new PropertyList(true)
        this.list.reset(PropertyNode.createList(config.color))
    }

    initParticles(first: Particle): void {
        let next: Particle = first
        const color: Color = this.list.first.value
        const tint: number = combineRGBComponents(color.r, color.g, color.b)
        while (next) {
            next.tint = tint
            next = next.next
        }
    }

    updateParticle(particle: Particle): void {
        particle.tint = this.list.interpolate(particle.agePercent)
    }

}

/**
 * A Color behavior that applies a single color to the particle's tint property at initialization.
 * ```javascript
 * {
 *     type: 'colorStatic',
 *     config: {
 *         color: '#ffff00',
 *     }
 * }
 * ```
 */
export class StaticColorBehavior implements IEmitterBehavior {

    public static type: string = 'colorStatic'
    public static editorConfig: BehaviorEditorConfig = null

    public readonly order: BehaviorOrder = BehaviorOrder.Normal
    private readonly value: number

    constructor(config: {
        color: string // Color of the particles as 6 digit hex codes.
    }) {
        let color: string = config.color
        if (color.charAt(0) === '#') {
            color = color.substr(1)
        } else if (color.indexOf('0x') === 0) {
            color = color.substr(2)
        }
        this.value = parseInt(color, 16)
    }

    initParticles(first: Particle): void {
        let next: Particle = first
        while (next) {
            next.tint = this.value
            next = next.next
        }
    }

}
