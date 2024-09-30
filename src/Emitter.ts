import { generateEase, rotatePoint, SimpleEase } from './ParticleUtils'
import { Particle } from './Particle'
import { EmitterConfigV3 } from './EmitterConfig'
import { Container } from '@pixi/display'
import { Point } from '@pixi/math'
import { Ticker } from '@pixi/ticker'
import { BehaviorOrder, IEmitterBehavior, IEmitterBehaviorClass } from './behaviors'

const ticker: Ticker = Ticker.shared

// Key used in sorted order to determine when to set particle position from the emitter position and rotation.
const PositionParticle: unique symbol = Symbol('Position particle per emitter position')

export class Emitter {

    private static knownBehaviors: { [key: string]: IEmitterBehaviorClass } = {}

    // Registers a new behavior, so that it will be recognized when initializing emitters. Behaviors registered later with duplicate types will override older ones, although there is no limit on the allowed types.
    public static registerBehavior(constructor: IEmitterBehaviorClass): void {
        Emitter.knownBehaviors[constructor.type] = constructor
    }

    protected initBehaviors: (IEmitterBehavior | typeof PositionParticle)[] // Active initialization behaviors for this emitter.
    protected updateBehaviors: IEmitterBehavior[] // Active update behaviors for this emitter.
    protected recycleBehaviors: IEmitterBehavior[] // Active recycle behaviors for this emitter.

    /* individual particles */

    public minLifetime: number // The minimum lifetime for a particle, in seconds.
    public maxLifetime: number // The maximum lifetime for a particle, in seconds.
    public customEase: SimpleEase // An easing function for nonlinear interpolation of values. Accepts a single parameter of time as a value from 0-1, inclusive. Expected outputs are values from 0-1, inclusive.

    /* spawning particles */

    protected _particlesContainer: Container // The container to add particles to.
    protected _frequency: number // Time between particle spawns in seconds.
    public spawnChance: number // Chance that a particle will be spawned on each opportunity to spawn one. 0 is 0%, 1 is 100%.
    public maxParticles: number // Maximum number of particles to keep alive at a time. If this limit is reached, no more particles will spawn until some have died.
    public emitterLifetime: number // The amount of time in seconds to emit for before setting emit to false. A value of -1 is an unlimited amount of time.
    public spawnPosition: Point // Position at which to spawn particles, relative to the emitter's owner's origin. For example, the flames of a rocket travelling right might have a spawnPos of {x:-50, y:0}. to spawn at the rear of the rocket. To change this, use updateSpawnPos().
    public particlesPerWave: number // Number of particles to spawn time that the frequency allows for particles to spawn.
    protected rotation: number // Rotation of the emitter or emitter's owner in degrees. This is added to the calculated spawn angle. To change this, use rotate().
    protected ownerPosition: Point // The world position of the emitter's owner, to add spawnPos to when spawning particles. To change this, use updateOwnerPos().
    protected _prevEmitterPosition: Point // The origin + spawnPos in the previous update, so that the spawn position can be interpolated to space out particles better.
    protected _prevPosIsValid: boolean // If _prevEmitterPos is valid, to prevent interpolation on the first update
    protected _posChanged: boolean // If either ownerPos or spawnPos has changed since the previous update.
    public addAtBack: boolean // If particles should be added at the back of the display list instead of the front.
    public particleCount: number // The current number of active particles.
    protected _emit: boolean // If particles should be emitted during update() calls. Setting this to false stops new particles from being created, but allows existing ones to die out.
    protected _spawnTimer: number // The timer for when to spawn particles in seconds, where numbers less than 0 mean that particles should be spawned.
    protected _emitterLife: number // The life of the emitter in seconds.
    protected _activeParticlesFirst: Particle // The particles that are active and on the display list. This is the first particle in a linked list.
    protected _activeParticlesLast: Particle // The particles that are active and on the display list. This is the last particle in a linked list.
    protected _poolFirst: Particle // The particles that are not currently being used. This is the first particle in a linked list.
    protected _origConfig: any // The original config object that this emitter was initialized with.
    protected _autoUpdate: boolean // If the update function is called automatically from the shared ticker. Setting this to false requires calling the update function manually.
    protected _destroyWhenComplete: boolean // If the emitter should destroy itself when all particles have died out. This is set by playOnceAndDestroy();
    protected _completeCallback: () => void // A callback for when all particles have died out. This is set by playOnceAndDestroy() or playOnce();

    /**
     * @param particleParent The container to add the particles to.
     * @param particleImages A texture or array of textures to use for the particles. Strings will be turned into textures via Texture.from().
     * @param config A configuration object containing settings for the emitter.
     * @param config.emit If config.emit is explicitly passed as false, the Emitter will start disabled.
     * @param config.autoUpdate If config.autoUpdate is explicitly passed as true, the Emitter will automatically call update via the PIXI shared ticker.
     */
    constructor(particleParent: Container, config: EmitterConfigV3) {
        this.initBehaviors = []
        this.updateBehaviors = []
        this.recycleBehaviors = []

        /* individual particles */

        this.minLifetime = 0
        this.maxLifetime = 0
        this.customEase = null

        /* spawning particles */

        this._frequency = 1
        this.spawnChance = 1
        this.maxParticles = 1000
        this.emitterLifetime = -1
        this.spawnPosition = new Point()
        this.particlesPerWave = 1
        // emitter properties
        this.rotation = 0
        this.ownerPosition = new Point()
        this._prevEmitterPosition = new Point()
        this._prevPosIsValid = false
        this._posChanged = false
        this._particlesContainer = null
        this.addAtBack = false
        this.particleCount = 0
        this._emit = false
        this._spawnTimer = 0
        this._emitterLife = -1
        this._activeParticlesFirst = null
        this._activeParticlesLast = null
        this._poolFirst = null
        this._origConfig = null
        this._autoUpdate = false
        this._destroyWhenComplete = false
        this._completeCallback = null

        /* initial parent */

        this.particlesContainer = particleParent

        if (config) {
            this.init(config)
        }

        /* save often used functions on the instance instead of the prototype for better speed */

        this.recycle = this.recycle
        this.update = this.update
        this.rotate = this.rotate
        this.updateSpawnPos = this.updateSpawnPos
        this.updateOwnerPosition = this.updateOwnerPosition
    }

    // Time between particle spawns in seconds. If this value is not a number greater than 0, it will be set to 1 (particle per second) to prevent infinite loops.
    public get frequency(): number {
        return this._frequency
    }

    public set frequency(value: number) {
        // do some error checking to prevent infinite loops
        if (typeof value === 'number' && value > 0) {
            this._frequency = value
        } else {
            this._frequency = 1
        }
    }

    public get particlesContainer(): Container {
        return this._particlesContainer
    }

    public set particlesContainer(value: Container) {
        this.cleanup()
        this._particlesContainer = value
    }

    // Sets up the emitter based on the config settings. @param config A configuration object containing settings for the emitter.
    public init(config: EmitterConfigV3): void {
        if (!config) {
            return
        }
        this.cleanup() // clean up any existing particles
        this._origConfig = config // store the original config and particle images, in case we need to re-initialize when the particle constructor is changed

        /* Particle Properties */

        // set up the lifetime
        this.minLifetime = config.lifetime.min
        this.maxLifetime = config.lifetime.max
        if (config.ease) {
            this.customEase = typeof config.ease === 'function' ? config.ease : generateEase(config.ease) // use the custom ease if provided
        } else {
            this.customEase = null
        }

        /* Emitter Properties */

        // reset spawn type specific settings
        this.particlesPerWave = 1
        if (config.particlesPerWave && config.particlesPerWave > 1) {
            this.particlesPerWave = config.particlesPerWave
        }
        this.frequency = config.frequency // set the spawning frequency
        this.spawnChance = (typeof config.spawnChance === 'number' && config.spawnChance > 0) ? config.spawnChance : 1
        this.emitterLifetime = config.emitterLifetime || -1 // set the emitter lifetime
        this.maxParticles = config.maxParticles > 0 ? config.maxParticles : 1000 // set the max particles
        this.addAtBack = !!config.addAtBack // determine if we should add the particle at the back of the list or not
        this.rotation = 0
        this.ownerPosition.set(0)
        if (config.pos) {
            this.spawnPosition.copyFrom(config.pos)
        } else {
            this.spawnPosition.set(0)
        }
        this._prevEmitterPosition.copyFrom(this.spawnPosition)
        this._prevPosIsValid = false // previous emitter position is invalid and should not be used for interpolation
        this._spawnTimer = 0
        this.emit = config.emit === undefined ? true : !!config.emit
        this.autoUpdate = !!config.autoUpdate

        /* Behaviors */

        const behaviors: (IEmitterBehavior | typeof PositionParticle)[] = config.behaviors.map((data) => {
            const constructor = Emitter.knownBehaviors[data.type]
            if (!constructor) {
                console.error(`Unknown behavior: ${data.type}`)
                return null
            }
            return new constructor(data.config)
        }).filter((b) => !!b)

        behaviors.push(PositionParticle)
        behaviors.sort((a, b) => {
            if (a === PositionParticle) {
                return (b as IEmitterBehavior).order === BehaviorOrder.Spawn ? 1 : -1
            } else if (b === PositionParticle) {
                return (a as IEmitterBehavior).order === BehaviorOrder.Spawn ? -1 : 1
            }
            return (a as IEmitterBehavior).order - (b as IEmitterBehavior).order
        })
        this.initBehaviors = behaviors.slice()
        this.updateBehaviors = behaviors.filter((b) => b !== PositionParticle && b.updateParticle) as IEmitterBehavior[]
        this.recycleBehaviors = behaviors.filter((b) => b !== PositionParticle && b.recycleParticle) as IEmitterBehavior[]
    }

    // Gets the instantiated behavior of the specified type, if it is present on this emitter. @param type The behavior type to find.
    public getBehavior(type: string): IEmitterBehavior | null {
        if (!Emitter.knownBehaviors[type]) {
            return null // bail if we don't know about such an emitter
        }
        return this.initBehaviors.find((b) => b instanceof Emitter.knownBehaviors[type]) as IEmitterBehavior || null // find one that is an instance of the specified type
    }

    // Fills the pool with the specified number of particles, so that they don't have to be instantiated later. @param count The number of particles to create.
    public fillPool(count: number): void {
        for (; count > 0; count--) {
            const particle: Particle = new Particle(this)
            particle.next = this._poolFirst
            this._poolFirst = particle
        }
    }

    // Recycles an individual particle. For internal use only. @param particle The particle to recycle. @param fromCleanup If this is being called to manually clean up all particles.
    public recycle(particle: Particle, fromCleanup = false): void {
        for (let i = 0; i < this.recycleBehaviors.length; ++i) {
            this.recycleBehaviors[i].recycleParticle(particle, !fromCleanup)
        }
        if (particle.next) {
            particle.next.prev = particle.prev
        }
        if (particle.prev) {
            particle.prev.next = particle.next
        }
        if (particle === this._activeParticlesLast) {
            this._activeParticlesLast = particle.prev
        }
        if (particle === this._activeParticlesFirst) {
            this._activeParticlesFirst = particle.next
        }
        particle.prev = null
        particle.next = this._poolFirst
        this._poolFirst = particle
        if (particle.parent) {
            particle.parent.removeChild(particle) // remove child from display, or make it invisible if it is in a ParticleContainer
        }
        this.particleCount-- // decrease count
    }

    // Sets the rotation of the emitter to a new value. This rotates the spawn position in addition to particle direction. @param newRot The new rotation, in degrees.
    public rotate(newRot: number): void {
        if (this.rotation === newRot) {
            return
        }
        const diff: number = newRot - this.rotation // caclulate the difference in rotation for rotating spawnPos
        this.rotation = newRot
        rotatePoint(diff, this.spawnPosition) // rotate spawnPos
        this._posChanged = true // mark the position as having changed
    }

    // Changes the spawn position of the emitter. @param x The new x value of the spawn position for the emitter. @param y The new y value of the spawn position for the emitter.
    public updateSpawnPos(x: number, y: number): void {
        this._posChanged = true
        this.spawnPosition.x = x
        this.spawnPosition.y = y
    }

    // Changes the position of the emitter's owner. You should call this if you are adding particles to the world container that your emitter's owner is moving around in.
    public updateOwnerPosition(x: number, y: number): void {
        this._posChanged = true
        this.ownerPosition.x = x
        this.ownerPosition.y = y
    }

    // Prevents emitter position interpolation in the next update. This should be used if you made a major position change of your emitter's owner that was not normal movement.
    public resetPositionTracking(): void {
        this._prevPosIsValid = false
    }

    // If particles should be emitted during update() calls. Setting this to false stops new particles from being created, but allows existing ones to die out.
    public get emit(): boolean {
        return this._emit
    }

    public set emit(value: boolean) {
        this._emit = !!value
        this._emitterLife = this.emitterLifetime
    }

    // If the update function is called automatically from the shared ticker. Setting this to false requires calling the update function manually.
    public get autoUpdate(): boolean {
        return this._autoUpdate
    }

    public set autoUpdate(value: boolean) {
        if (this._autoUpdate && !value) {
            ticker.remove(this.update, this)
        } else if (!this._autoUpdate && value) {
            ticker.add(this.update, this)
        }
        this._autoUpdate = !!value
    }

    // Starts emitting particles, sets autoUpdate to true, and sets up the Emitter to destroy itself when particle emission is complete. @param callback Callback for when emission is complete (all particles have died off)
    public playOnceAndDestroy(callback?: () => void): void {
        this.autoUpdate = true
        this.emit = true
        this._destroyWhenComplete = true
        this._completeCallback = callback
    }

    // Starts emitting particles and optionally calls a callback when particle emission is complete. @param callback Callback for when emission is complete (all particles have died off)
    public playOnce(callback?: () => void): void {
        this.emit = true
        this._completeCallback = callback
    }

    // Updates all particles spawned by this emitter and emits new ones. @param delta Time elapsed since the previous frame, in __seconds__.
    public update(delta: number): void {
        if (this._autoUpdate) {
            delta = ticker.elapsedMS * 0.001
        }
        if (!this._particlesContainer) {
            return // if we don't have a parent to add particles to, then don't do anything. this also works as a isDestroyed check
        }

        /* existing particles */

        // update all particle lifetimes before turning them over to behaviors
        for (let particle: Particle = this._activeParticlesFirst, next: Particle; particle; particle = next) {
            next = particle.next // save next particle in case we recycle this one
            particle.age += delta // increase age
            if (particle.age > particle.maxLife || particle.age < 0) {
                this.recycle(particle) // recycle particle if it is too old
            } else {
                // determine our interpolation value
                let lerp = particle.age * particle.oneOverLife // lifetime / maxLife;
                // global ease affects all interpolation calculations
                if (this.customEase) {
                    if (this.customEase.length === 4) {
                        lerp = (this.customEase as any)(lerp, 0, 1, 1) // the t, b, c, d parameters that some tween libraries use (time, initial value, end value, duration)
                    } else {
                        lerp = this.customEase(lerp) // the simplified version that we like that takes one parameter, time from 0-1. TweenJS eases provide this usage.
                    }
                }
                particle.agePercent = lerp // set age percent for all interpolation calculations
                // let each behavior run wild on the active particles
                for (let index = 0; index < this.updateBehaviors.length; index++) {
                    if (this.updateBehaviors[index].updateParticle(particle, delta)) {
                        this.recycle(particle)
                        break
                    }
                }
            }
        }

        let prevX: number
        let prevY: number

        // if the previous position is valid, store these for later interpolation
        if (this._prevPosIsValid) {
            prevX = this._prevEmitterPosition.x
            prevY = this._prevEmitterPosition.y
        }
        // store current position of the emitter as local variables
        const curX = this.ownerPosition.x + this.spawnPosition.x
        const curY = this.ownerPosition.y + this.spawnPosition.y

        /* new particles */

        if (this._emit) {
            this._spawnTimer -= delta < 0 ? 0 : delta // decrease spawn timer
            // while _spawnTimer < 0, we have particles to spawn
            while (this._spawnTimer <= 0) {
                // determine if the emitter should stop spawning
                if (this._emitterLife >= 0) {
                    this._emitterLife -= this._frequency
                    if (this._emitterLife <= 0) {
                        this._spawnTimer = 0
                        this._emitterLife = 0
                        this.emit = false
                        break
                    }
                }
                // determine if we have hit the particle limit
                if (this.particleCount >= this.maxParticles) {
                    this._spawnTimer += this._frequency
                    continue
                }
                let emitPosX: number
                let emitPosY: number

                // If the position has changed and this isn't the first spawn, interpolate the spawn position otherwise just set to the spawn position
                if (this._prevPosIsValid && this._posChanged) {
                    const lerp = 1 + (this._spawnTimer / delta) // 1 - _spawnTimer / delta, but _spawnTimer is negative
                    emitPosX = ((curX - prevX) * lerp) + prevX
                    emitPosY = ((curY - prevY) * lerp) + prevY
                } else {
                    emitPosX = curX
                    emitPosY = curY
                }

                let waveFirst: Particle
                let waveLast: Particle

                // create enough particles to fill the wave
                for (let len = Math.min(this.particlesPerWave, this.maxParticles - this.particleCount), i = 0; i < len; i++) {
                    if (this.spawnChance < 1 && Math.random() >= this.spawnChance) {
                        continue // see if we actually spawn one
                    }
                    let lifetime
                    if (this.minLifetime === this.maxLifetime) {
                        lifetime = this.minLifetime
                    } else {
                        lifetime = (Math.random() * (this.maxLifetime - this.minLifetime)) + this.minLifetime
                    }
                    if (-this._spawnTimer >= lifetime) {
                        continue // only make the particle if it wouldn't immediately destroy itself
                    }
                    let particle: Particle
                    if (this._poolFirst) {
                        particle = this._poolFirst
                        this._poolFirst = this._poolFirst.next
                        particle.next = null
                    } else {
                        particle = new Particle(this)
                    }

                    /* initialize */

                    particle.init(lifetime)
                    if (this.addAtBack) {
                        this._particlesContainer.addChildAt(particle, 0)
                    } else {
                        this._particlesContainer.addChild(particle)
                    }
                    // add particles to list of ones in this wave
                    if (waveFirst) {
                        waveLast.next = particle
                        particle.prev = waveLast
                        waveLast = particle
                    } else {
                        waveLast = waveFirst = particle
                    }
                    this.particleCount++ // increase our particle count
                }

                if (waveFirst) {
                    // add particle to list of active particles
                    if (this._activeParticlesLast) {
                        this._activeParticlesLast.next = waveFirst
                        waveFirst.prev = this._activeParticlesLast
                        this._activeParticlesLast = waveLast
                    } else {
                        this._activeParticlesFirst = waveFirst
                        this._activeParticlesLast = waveLast
                    }
                    // run behavior init on particles
                    for (let index = 0; index < this.initBehaviors.length; index++) {
                        const behavior = this.initBehaviors[index]
                        // if we hit our special key, interrupt behaviors to apply emitter position/rotation
                        if (behavior === PositionParticle) {
                            for (let particle: Particle = waveFirst, next: Particle; particle; particle = next) {
                                // save next particle in case we recycle this one
                                next = particle.next
                                // rotate the particle's position by the emitter's rotation
                                if (this.rotation !== 0) {
                                    rotatePoint(this.rotation, particle.position)
                                    particle.rotation += this.rotation
                                }
                                // offset by the emitter's position
                                particle.position.x += emitPosX
                                particle.position.y += emitPosY

                                // also, just update the particle's age properties while we are looping through
                                particle.age += -this._spawnTimer
                                // determine our interpolation value
                                let lerp = particle.age * particle.oneOverLife // lifetime / maxLife;
                                // global ease affects all interpolation calculations
                                if (this.customEase) {
                                    if (this.customEase.length === 4) {
                                        lerp = (this.customEase as any)(lerp, 0, 1, 1) // the t, b, c, d parameters that some tween libraries use (time, initial value, end value, duration)
                                    } else {
                                        lerp = this.customEase(lerp) // the simplified version that we like that takes one parameter, time from 0-1. TweenJS eases provide this usage.
                                    }
                                }
                                // set age percent for all interpolation calculations
                                particle.agePercent = lerp
                            }
                        } else {
                            behavior.initParticles(waveFirst)
                        }
                    }
                    for (let particle: Particle = waveFirst, next: Particle; particle; particle = next) {
                        next = particle.next // save next particle in case we recycle this one
                        for (let index = 0; index < this.updateBehaviors.length; index++) { // now update the particles by the time passed, so the particles are spread out properly
                            if (this.updateBehaviors[index].updateParticle(particle, -this._spawnTimer)) { // we want a positive delta, because a negative delta messes things up
                                this.recycle(particle) // bail if the particle got recycled
                                break
                            }
                        }
                    }
                }
                this._spawnTimer += this._frequency // increase timer and continue on to any other particles that need to be created
            }
        }

        // if the position changed before this update, then keep track of that
        if (this._posChanged) {
            this._prevEmitterPosition.x = curX
            this._prevEmitterPosition.y = curY
            this._prevPosIsValid = true
            this._posChanged = false
        }

        // if we are all done and should destroy ourselves, take care of that
        if (!this._emit && !this._activeParticlesFirst) {
            if (this._completeCallback) {
                const cb = this._completeCallback
                this._completeCallback = null
                cb()
            }
            if (this._destroyWhenComplete) {
                this.destroy()
            }
        }
    }

    // Emits a single wave of particles, using standard spawnChance & particlesPerWave settings. Does not affect regular spawning through the frequency, and ignores to emit property.
    // The max particle count is respected, however, so if there are already too many particles then nothing will happen.
    public emitNow(): void {
        const emitPosX: number = this.ownerPosition.x + this.spawnPosition.x
        const emitPosY: number = this.ownerPosition.y + this.spawnPosition.y
        let waveFirst: Particle
        let waveLast: Particle

        // create enough particles to fill the wave
        for (let len = Math.min(this.particlesPerWave, this.maxParticles - this.particleCount), i = 0; i < len; i++) {
            if (this.spawnChance < 1 && Math.random() >= this.spawnChance) {
                continue // see if we actually spawn one
            }

            let particle: Particle
            if (this._poolFirst) {
                particle = this._poolFirst
                this._poolFirst = this._poolFirst.next
                particle.next = null
            } else {
                particle = new Particle(this)
            }

            let lifetime: number
            if (this.minLifetime === this.maxLifetime) {
                lifetime = this.minLifetime
            } else {
                lifetime = (Math.random() * (this.maxLifetime - this.minLifetime)) + this.minLifetime
            }

            particle.init(lifetime)
            if (this.addAtBack) {
                this._particlesContainer.addChildAt(particle, 0)
            } else {
                this._particlesContainer.addChild(particle)
            }

            // add particles to list of ones in this wave
            if (waveFirst) {
                waveLast.next = particle
                particle.prev = waveLast
                waveLast = particle
            } else {
                waveLast = waveFirst = particle
            }
            this.particleCount++ // increase our particle count
        }

        if (waveFirst) {
            // add particle to list of active particles
            if (this._activeParticlesLast) {
                this._activeParticlesLast.next = waveFirst
                waveFirst.prev = this._activeParticlesLast
                this._activeParticlesLast = waveLast
            } else {
                this._activeParticlesFirst = waveFirst
                this._activeParticlesLast = waveLast
            }
            // run behavior init on particles
            for (let index = 0; index < this.initBehaviors.length; index++) {
                const behavior: IEmitterBehavior | typeof PositionParticle = this.initBehaviors[index]

                // if we hit our special key, interrupt behaviors to apply emitter position/rotation
                if (behavior === PositionParticle) {
                    for (let particle = waveFirst, next; particle; particle = next) {
                        next = particle.next // save next particle in case we recycle this one
                        // rotate the particle's position by the emitter's rotation
                        if (this.rotation !== 0) {
                            rotatePoint(this.rotation, particle.position)
                            particle.rotation += this.rotation
                        }
                        particle.position.x += emitPosX
                        particle.position.y += emitPosY
                    }
                } else {
                    behavior.initParticles(waveFirst)
                }
            }
        }
    }

    // Kills all active particles immediately.
    public cleanup(): void {
        let particle: Particle
        let next: Particle
        for (particle = this._activeParticlesFirst; particle; particle = next) {
            next = particle.next
            this.recycle(particle, true)
        }
        this._activeParticlesFirst = this._activeParticlesLast = null
        this.particleCount = 0
    }

    // If this emitter has been destroyed. Note that a destroyed emitter can still be reused, after having a new parent set and being reinitialized.
    public get destroyed(): boolean {
        return !(this._particlesContainer && this.initBehaviors.length)
    }

    // Destroys the emitter and all of its particles.
    public destroy(): void {
        this.autoUpdate = false // make sure we aren't still listening to any tickers
        this.cleanup() // puts all active particles in the pool, and removes them from the particle parent
        let next: Particle // wipe the pool clean
        for (let particle: Particle = this._poolFirst; particle; particle = next) {
            next = particle.next // store next value, so we don't lose it in our destroy call
            particle.destroy()
        }
        this._poolFirst = this._particlesContainer = this.spawnPosition = this.ownerPosition = this.customEase = this._completeCallback = null
        this.initBehaviors.length = this.updateBehaviors.length = this.recycleBehaviors.length = 0
    }

}
