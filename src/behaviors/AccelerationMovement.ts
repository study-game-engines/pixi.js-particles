import { Point } from '@pixi/math'
import { Particle } from '../Particle'
import { length, rotatePoint, scaleBy } from '../ParticleUtils'
import { BehaviorOrder, IEmitterBehavior } from './Behaviors'
import { BehaviorEditorConfig } from './editor/Types'

/**
 * A Movement behavior that handles movement by applying a constant acceleration to all particles.
 * ```javascript
 * {
 *     "type": "moveAcceleration",
 *     "config": {
 *          "accel": {
 *               "x": 0,
 *               "y": 2000
 *          },
 *          "minStart": 600,
 *          "maxStart": 600,
 *          "rotate": true
 *     }
 *}
 * ```
 */
export class AccelerationBehavior implements IEmitterBehavior {

    public static type: string = 'moveAcceleration'
    public static editorConfig: BehaviorEditorConfig | null = null

    public readonly order: BehaviorOrder = BehaviorOrder.Late // doesn't *really* need to be late, but doing so ensures that we can override any rotation behavior that is mistakenly added
    private readonly minStart: number
    private readonly maxStart: number
    private accel: { x: number; y: number }
    private readonly rotate: boolean
    private readonly maxSpeed: number

    constructor(config: {
        minStart: number // Minimum speed when initializing the particle, in world units/second.
        maxStart: number // Maximum speed when initializing the particle. in world units/second.
        accel: { x: number; y: number } // Constant acceleration, in the coordinate space of the particle parent, in world units/second.
        rotate?: boolean // Rotate the particle with its direction of movement. While initial movement direction reacts to rotation settings, this overrides any dynamic rotation. Defaults to false.
        maxSpeed?: number // Maximum linear speed. 0 is unlimited. Defaults to 0.
    }) {
        this.minStart = config.minStart
        this.maxStart = config.maxStart
        this.accel = config.accel
        this.rotate = !!config.rotate
        this.maxSpeed = config.maxSpeed ?? 0
    }

    initParticles(first: Particle): void {
        let next: Particle = first
        while (next) {
            const speed: number = (Math.random() * (this.maxStart - this.minStart)) + this.minStart
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
        const oldVX: any = velocity.x
        const oldVY: any = velocity.y
        velocity.x += this.accel.x * deltaSec
        velocity.y += this.accel.y * deltaSec
        if (this.maxSpeed) {
            const currentSpeed = length(velocity)
            if (currentSpeed > this.maxSpeed) {
                scaleBy(velocity, this.maxSpeed / currentSpeed) // if we are going faster than we should, clamp at the max speed DO NOT recalculate vector length
            }
        }
        particle.x += (oldVX + velocity.x) / 2 * deltaSec
        particle.y += (oldVY + velocity.y) / 2 * deltaSec
        if (this.rotate) {
            particle.rotation = Math.atan2(velocity.y, velocity.x)
        }
    }

}
