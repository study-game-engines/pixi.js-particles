import { Particle } from '../Particle'
import { IEmitterBehavior, BehaviorOrder } from './Behaviors'
import { BehaviorEditorConfig } from './editor/Types'

/**
 * A Spawn behavior that sends particles out from a single point at the emitter's position.
 * ```javascript
 * {
 *     type: 'spawnPoint',
 *     config: {}
 * }
 * ```
 */
export class PointSpawnBehavior implements IEmitterBehavior {

    public static type: string = 'spawnPoint'
    public static editorConfig: BehaviorEditorConfig | null = null

    public readonly order: BehaviorOrder = BehaviorOrder.Spawn

    initParticles(first: Particle): void {
        // no op
    }

}
