import { Emitter } from './Emitter'
import * as behaviors from './behaviors'

Emitter.registerBehavior(behaviors.AccelerationBehavior)
Emitter.registerBehavior(behaviors.AlphaBehavior)
Emitter.registerBehavior(behaviors.StaticAlphaBehavior)
Emitter.registerBehavior(behaviors.RandomAnimatedTextureBehavior)
Emitter.registerBehavior(behaviors.SingleAnimatedTextureBehavior)
Emitter.registerBehavior(behaviors.BlendModeBehavior)
Emitter.registerBehavior(behaviors.BurstSpawnBehavior)
Emitter.registerBehavior(behaviors.ColorBehavior)
Emitter.registerBehavior(behaviors.StaticColorBehavior)
Emitter.registerBehavior(behaviors.OrderedTextureBehavior)
Emitter.registerBehavior(behaviors.PathBehavior)
Emitter.registerBehavior(behaviors.PointSpawnBehavior)
Emitter.registerBehavior(behaviors.RandomTextureBehavior)
Emitter.registerBehavior(behaviors.RotationBehavior)
Emitter.registerBehavior(behaviors.StaticRotationBehavior)
Emitter.registerBehavior(behaviors.NoRotationBehavior)
Emitter.registerBehavior(behaviors.ScaleBehavior)
Emitter.registerBehavior(behaviors.StaticScaleBehavior)
Emitter.registerBehavior(behaviors.ShapeSpawnBehavior)
Emitter.registerBehavior(behaviors.SingleTextureBehavior)
Emitter.registerBehavior(behaviors.SpeedBehavior)
Emitter.registerBehavior(behaviors.StaticSpeedBehavior)

export * as behaviors from './behaviors'
export * as ParticleUtils from './ParticleUtils'
export * from './Particle'
export * from './Emitter'
export * from './EmitterConfig'
export * from './PropertyList'
export * from './PropertyNode'
export * from './LinkedListContainer'
