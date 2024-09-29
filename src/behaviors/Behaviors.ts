import { Particle } from '../Particle'
import { BehaviorEditorConfig } from './editor/Types'

// All behaviors instances must implement this interface, and the class must match the {@link IEmitterBehaviorClass} interface. All behaviors must have an order property and `initParticles` method. Implementing the `updateParticle` or `recycleParticle` methods is optional.
export interface IEmitterBehavior {
    order: number // Order in which the behavior will be handled. Lower numbers are handled earlier, with an order of 0 getting special treatment before the Emitter's transformation is applied.
    initParticles(first: Particle): void // Called to initialize a wave of particles, with a reference to the first particle in the linked list. * @param first The first (maybe only) particle in a newly spawned wave of particles.
    updateParticle?(particle: Particle, deltaSec: number): void | boolean // Updates a single particle for a given period of time elapsed. Return `true` to recycle the particle. @param particle The particle to update. @param deltaSec The time to advance the particle by in seconds.
    recycleParticle?(particle: Particle, natural: boolean): void // A hook for when a particle is recycled. @param particle The particle that was just recycled. @param natural `true` if the reycling was due to natural lifecycle, `false` if it was due to emitter cleanup.
}

// All behavior classes must match this interface. The instances need to implement the {@link IEmitterBehavior} interface.
export interface IEmitterBehaviorClass {
    type: string // The unique type name that the behavior is registered under.
    editorConfig?: BehaviorEditorConfig // Configuration data for an editor to display this behavior. Does not need to exist in production code.
    new(config: any): IEmitterBehavior // The behavior constructor itself. @param config The config for the behavior, which should match its defined specifications.
}

/**
 * Standard behavior order values, specifying when/how they are used. Other numeric values can be used,
 * but only the Spawn value will be handled in a special way. All other values will be sorted numerically.
 * Behaviors with the same value will not be given any specific sort order, as they are assumed to not interfere with each other.
 */
export enum BehaviorOrder {
    Spawn = 0, // Spawn - initial placement and/or rotation. This happens before rotation/translation due to emitter rotation/position is applied.
    Normal = 2, // Normal priority, for things that don't matter when they are applied.
    Late = 5, // Delayed priority, for things that need to read other values in order to act correctly.
}
