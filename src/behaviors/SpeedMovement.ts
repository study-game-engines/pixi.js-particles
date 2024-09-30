import { IPointData, Point } from '@pixi/math'
import { Particle } from '../Particle'
import { rotatePoint, normalize, scaleBy } from '../ParticleUtils'
import { PropertyList } from '../PropertyList'
import { PropertyNode, ValueList } from '../PropertyNode'
import { IEmitterBehavior, BehaviorOrder } from './Behaviors'
import { BehaviorEditorConfig } from './editor/Types'

/**
 * A Movement behavior that uses an interpolated or stepped list of values for a particles speed at any given moment. Movement direction is controlled by the particle's starting rotation.
 * ```javascript
 * {
 *     type: 'moveSpeed',
 *     config: {
 *          speed: {
 *              list: [{value: 10, time: 0}, {value: 100, time: 0.25}, {value: 0, time: 1}],
 *          },
 *          minMultiplier: 0.8
 *     }
 * }
 * ```
 */
export class SpeedBehavior implements IEmitterBehavior {

    public static type: string = 'moveSpeed'
    public static editorConfig: BehaviorEditorConfig = null

    public order: BehaviorOrder = BehaviorOrder.Late
    private list: PropertyList<number>
    private readonly minMultiplier: number

    constructor(config: {
        speed: ValueList<number> // Speed of the particles in world units/second, with a minimum value of 0
        minMultiplier: number // A value between minimum speed multipler and 1 is randomly generated and multiplied with each speed value to generate the actual speed for each particle.
    }) {
        this.list = new PropertyList(false)
        this.list.reset(PropertyNode.createList(config.speed))
        this.minMultiplier = config.minMultiplier ?? 1
    }

    initParticles(first: Particle): void {
        let next: Particle = first
        while (next) {
            const multiplier: number = (Math.random() * (1 - this.minMultiplier)) + this.minMultiplier
            next.config.speedMult = multiplier
            if (!next.config.velocity) {
                next.config.velocity = new Point(this.list.first.value * multiplier, 0)
            } else {
                (next.config.velocity as Point).set(this.list.first.value * multiplier, 0)
            }
            rotatePoint(next.rotation, next.config.velocity)
            next = next.next
        }
    }

    updateParticle(particle: Particle, deltaSec: number): void {
        const speed: number = this.list.interpolate(particle.agePercent) * particle.config.speedMult
        const vel: IPointData = particle.config.velocity
        normalize(vel)
        scaleBy(vel, speed)
        particle.x += vel.x * deltaSec
        particle.y += vel.y * deltaSec
    }

}

/**
 * A Movement behavior that uses a randomly picked constant speed throughout a particle's lifetime. Movement direction is controlled by the particle's starting rotation.
 * ```javascript
 * {
 *     type: 'moveSpeedStatic',
 *     config: {
 *          min: 100,
 *          max: 150
 *     }
 * }
 * ```
 */
export class StaticSpeedBehavior implements IEmitterBehavior {

    public static type: string = 'moveSpeedStatic'
    public static editorConfig: BehaviorEditorConfig = null

    public order: BehaviorOrder = BehaviorOrder.Late
    private readonly min: number
    private readonly max: number

    constructor(config: {
        min: number // Minimum speed when initializing the particle.
        max: number // Maximum speed when initializing the particle.
    }) {
        this.min = config.min
        this.max = config.max
    }

    initParticles(first: Particle): void {
        let next: Particle = first
        while (next) {
            const speed = (Math.random() * (this.max - this.min)) + this.min
            if (!next.config.velocity) {
                next.config.velocity = new Point(speed, 0)
            } else {
                (next.config.velocity as Point).set(speed, 0)
            }
            rotatePoint(next.rotation, next.config.velocity)
            next = next.next
        }
    }

    updateParticle(particle: Particle, deltaSec: number): void {
        const velocity: any = particle.config.velocity
        particle.x += velocity.x * deltaSec
        particle.y += velocity.y * deltaSec
    }

}
