import { Particle } from '../Particle'
import { IEmitterBehavior, BehaviorOrder } from './Behaviors'
import { DEG_TO_RADS, rotatePoint } from '../ParticleUtils'
import { BehaviorEditorConfig } from './editor/Types'

/**
 * A Spawn behavior that sends particles out from a single point or ring, and is capable of evenly spacing the particle's starting angles.
 * ```javascript
 * {
 *     type: 'spawnBurst',
 *     config: {
 *          spacing: 90,
 *          start: 0,
 *          distance: 40,
 *     }
 * }
 * ```
 */
export class BurstSpawnBehavior implements IEmitterBehavior {

    public static type = 'spawnBurst'
    public static editorConfig: BehaviorEditorConfig = null

    order = BehaviorOrder.Spawn
    private readonly spacing: number
    private readonly start: number
    private readonly distance: number

    constructor(config: {
        spacing: number // Description: Spacing between each particle spawned in a wave, in degrees.
        start: number // Description: Angle to start placing particles at, in degrees. 0 is facing right, 90 is facing upwards.
        distance: number // Description: Distance from the emitter to spawn particles, forming a ring/arc.
    }) {
        this.spacing = config.spacing * DEG_TO_RADS
        this.start = config.start * DEG_TO_RADS
        this.distance = config.distance
    }

    initParticles(first: Particle): void {
        let count = 0
        let next = first
        while (next) {
            let angle: number
            if (this.spacing) {
                angle = this.start + (this.spacing * count)
            } else {
                angle = Math.random() * Math.PI * 2
            }
            next.rotation = angle
            if (this.distance) {
                next.position.x = this.distance
                rotatePoint(angle, next.position)
            }
            next = next.next
            ++count
        }
    }

}
