import { EaseSegment, SimpleEase } from './ParticleUtils'
import { ValueList } from './PropertyNode'
import { IPointData } from '@pixi/math'

export interface EmitterConfigV3 {
    lifetime: RandNumber // Random number configuration for picking the lifetime for each particle.
    ease?: SimpleEase | EaseSegment[] // Easing to be applied to all interpolated or stepped values across the particle lifetime.
    particlesPerWave?: number // How many particles to spawn at once, each time that it is determined that particles should be spawned. If omitted, only one particle will spawn at a time.
    frequency: number // How often to spawn particles. This is a value in seconds, so a value of 0.5 would be twice a second.
    spawnChance?: number // Defines a chance to not spawn particles. Values lower than 1 mean particles may not be spawned each time. If omitted, particles will always spawn.
    emitterLifetime?: number // How long to run the Emitter before it stops spawning particles. If omitted, runs forever (or until told to stop manually).
    maxParticles?: number // Maximum number of particles that can be alive at any given time for this emitter.
    addAtBack?: boolean // If newly spawned particles should be added to the back of the parent container (to make them less conspicuous as they pop in). If omitted, particles will be added to the top of the container.
    pos: { x: number; y: number } // Default position to spawn particles from inside the parent container.
    emit?: boolean // If the emitter should start out emitting particles. If omitted, it will be treated as `true` and will emit particles immediately.
    autoUpdate?: boolean // If the Emitter should hook into shared ticker. If this is false or emitted, you will be responsible for connecting it to update ticks.
    behaviors: BehaviorEntry[] // The list of behaviors to apply to this emitter. See the behaviors namespace for a list of built-in behaviors. Custom behaviors may be registered with {@link Emitter.registerBehavior}.
}

export interface BehaviorEntry {
    type: string // The behavior type, as defined as the static `type` property of a behavior class.
    config: any // Configuration data specific to that behavior.
}

// Configuration for how to pick a random number (inclusive)
export interface RandNumber {
    max: number // Maximum pickable value.
    min: number // Minimum pickable value.
}

/**
 * Converts emitter configuration from pre-5.0.0 library values into the current version.
 * ```javascript
 * const emitter = new Emitter(myContainer, upgradeConfig(myOldConfig, [myTexture, myOtherTexture]))
 * ```
 * @param config The old emitter config to upgrade.
 * @param art The old art values as would have been passed into the Emitter constructor or `Emitter.init()`
 */
export function upgradeConfig(config: EmitterConfigV2 | EmitterConfigV1, art: any): EmitterConfigV3 {
    if ('behaviors' in config) {
        return config // ensure we aren't given any V3 config data
    }
    const result: EmitterConfigV3 = {
        lifetime: config.lifetime,
        ease: config.ease,
        particlesPerWave: config.particlesPerWave,
        frequency: config.frequency,
        spawnChance: config.spawnChance,
        emitterLifetime: config.emitterLifetime,
        maxParticles: config.maxParticles,
        addAtBack: config.addAtBack,
        pos: config.pos,
        emit: config.emit,
        autoUpdate: config.autoUpdate,
        behaviors: [],
    }
    if (config.alpha) {
        if ('start' in config.alpha) {
            if (config.alpha.start === config.alpha.end) {
                if (config.alpha.start !== 1) {
                    result.behaviors.push({
                        type: 'alphaStatic',
                        config: { alpha: config.alpha.start },
                    })
                }
            } else {
                const list: ValueList<number> = {
                    list: [
                        { time: 0, value: config.alpha.start },
                        { time: 1, value: config.alpha.end },
                    ],
                }

                result.behaviors.push({
                    type: 'alpha',
                    config: { alpha: list },
                })
            }
        } else if (config.alpha.list.length === 1) {
            if (config.alpha.list[0].value !== 1) {
                result.behaviors.push({
                    type: 'alphaStatic',
                    config: { alpha: config.alpha.list[0].value },
                })
            }
        } else {
            result.behaviors.push({
                type: 'alpha',
                config: { alpha: config.alpha },
            })
        }
    }
    if (config.acceleration && (config.acceleration.x || config.acceleration.y)) {
        let minStart: number
        let maxStart: number
        if ('start' in config.speed) {
            minStart = config.speed.start * (config.speed.minimumSpeedMultiplier ?? 1)
            maxStart = config.speed.start
        } else {
            minStart = config.speed.list[0].value * ((config as EmitterConfigV2).minimumSpeedMultiplier ?? 1)
            maxStart = config.speed.list[0].value
        }
        result.behaviors.push({
            type: 'moveAcceleration',
            config: {
                accel: config.acceleration,
                minStart,
                maxStart,
                rotate: !config.noRotation,
                maxSpeed: config.maxSpeed,
            },
        })
    } else if (config.extraData?.path) {
        let list: ValueList<number>
        let multiplier: number
        if ('start' in config.speed) {
            multiplier = config.speed.minimumSpeedMultiplier ?? 1
            if (config.speed.start === config.speed.end) {
                list = {
                    list: [{ time: 0, value: config.speed.start }],
                }
            } else {
                list = {
                    list: [
                        { time: 0, value: config.speed.start },
                        { time: 1, value: config.speed.end },
                    ],
                }
            }
        } else {
            list = config.speed
            multiplier = ((config as EmitterConfigV2).minimumSpeedMultiplier ?? 1)
        }
        result.behaviors.push({
            type: 'movePath',
            config: {
                path: config.extraData.path,
                speed: list,
                minMultiplier: multiplier,
            },
        })
    } else {
        if (config.speed) {
            if ('start' in config.speed) {
                if (config.speed.start === config.speed.end) {
                    result.behaviors.push({
                        type: 'moveSpeedStatic',
                        config: {
                            min: config.speed.start * (config.speed.minimumSpeedMultiplier ?? 1),
                            max: config.speed.start,
                        },
                    })
                } else {
                    const list: ValueList<number> = {
                        list: [
                            { time: 0, value: config.speed.start },
                            { time: 1, value: config.speed.end },
                        ],
                    }
                    result.behaviors.push({
                        type: 'moveSpeed',
                        config: { speed: list, minMultiplier: config.speed.minimumSpeedMultiplier },
                    })
                }
            } else if (config.speed.list.length === 1) {
                result.behaviors.push({
                    type: 'moveSpeedStatic',
                    config: {
                        min: config.speed.list[0].value * ((config as EmitterConfigV2).minimumSpeedMultiplier ?? 1),
                        max: config.speed.list[0].value,
                    },
                })
            } else {
                result.behaviors.push({
                    type: 'moveSpeed',
                    config: { speed: config.speed, minMultiplier: ((config as EmitterConfigV2).minimumSpeedMultiplier ?? 1) },
                })
            }
        }
    }
    if (config.scale) {
        if ('start' in config.scale) {
            const multiplier: number = config.scale.minimumScaleMultiplier ?? 1
            if (config.scale.start === config.scale.end) {
                result.behaviors.push({
                    type: 'scaleStatic',
                    config: {
                        min: config.scale.start * multiplier,
                        max: config.scale.start,
                    },
                })
            } else {
                const list: ValueList<number> = {
                    list: [
                        { time: 0, value: config.scale.start },
                        { time: 1, value: config.scale.end },
                    ],
                }
                result.behaviors.push({
                    type: 'scale',
                    config: { scale: list, minMultiplier: multiplier },
                })
            }
        } else if (config.scale.list.length === 1) {
            const multiplier: number = (config as EmitterConfigV2).minimumScaleMultiplier ?? 1
            const scale: number = config.scale.list[0].value
            result.behaviors.push({
                type: 'scaleStatic',
                config: { min: scale * multiplier, max: scale },
            })
        } else {
            result.behaviors.push({
                type: 'scale',
                config: { scale: config.scale, minMultiplier: (config as EmitterConfigV2).minimumScaleMultiplier ?? 1 },
            })
        }
    }
    if (config.color) {
        if ('start' in config.color) {
            if (config.color.start === config.color.end) {
                if (config.color.start !== 'ffffff') {
                    result.behaviors.push({
                        type: 'colorStatic',
                        config: { color: config.color.start },
                    })
                }
            } else {
                const list: ValueList<string> = {
                    list: [
                        { time: 0, value: config.color.start },
                        { time: 1, value: config.color.end },
                    ],
                }
                result.behaviors.push({
                    type: 'color',
                    config: { color: list },
                })
            }
        } else if (config.color.list.length === 1) {
            if (config.color.list[0].value !== 'ffffff') {
                result.behaviors.push({
                    type: 'colorStatic',
                    config: { color: config.color.list[0].value },
                })
            }
        } else {
            result.behaviors.push({
                type: 'color',
                config: { color: config.color },
            })
        }
    }
    if (config.rotationAcceleration || config.rotationSpeed?.min || config.rotationSpeed?.max) {
        result.behaviors.push({
            type: 'rotation',
            config: {
                accel: config.rotationAcceleration || 0,
                minSpeed: config.rotationSpeed?.min || 0,
                maxSpeed: config.rotationSpeed?.max || 0,
                minStart: config.startRotation?.min || 0,
                maxStart: config.startRotation?.max || 0,
            },
        })
    } else if (config.startRotation?.min || config.startRotation?.max) {
        result.behaviors.push({
            type: 'rotationStatic',
            config: {
                min: config.startRotation?.min || 0,
                max: config.startRotation?.max || 0,
            },
        })
    }
    if (config.noRotation) {
        result.behaviors.push({
            type: 'noRotation',
            config: {},
        })
    }
    if (config.blendMode && config.blendMode !== 'normal') {
        result.behaviors.push({
            type: 'blendMode',
            config: {
                blendMode: config.blendMode,
            },
        })
    }
    if (Array.isArray(art) && typeof art[0] !== 'string' && 'framerate' in art[0]) {
        for (let index = 0; index < art.length; index++) {
            if (art[index].framerate === 'matchLife') {
                art[index].framerate = -1
            }
        }
        result.behaviors.push({
            type: 'animatedRandom',
            config: {
                anims: art,
            },
        })
    } else if (typeof art !== 'string' && 'framerate' in art) {
        if (art.framerate === 'matchLife') {
            art.framerate = -1
        }
        result.behaviors.push({
            type: 'animatedSingle',
            config: {
                anim: art,
            },
        })
    } else if (config.orderedArt && Array.isArray(art)) {
        result.behaviors.push({
            type: 'textureOrdered',
            config: {
                textures: art,
            },
        })
    } else if (Array.isArray(art)) {
        result.behaviors.push({
            type: 'textureRandom',
            config: {
                textures: art,
            },
        })
    } else {
        result.behaviors.push({
            type: 'textureSingle',
            config: {
                texture: art,
            },
        })
    }
    if (config.spawnType === 'burst') {
        result.behaviors.push({
            type: 'spawnBurst',
            config: {
                start: config.angleStart || 0,
                spacing: config.particleSpacing,
                // older formats bursted from a single point
                distance: 0,
            },
        })
    } else if (config.spawnType === 'point') {
        result.behaviors.push({
            type: 'spawnPoint',
            config: {},
        })
    } else {
        let shape: any
        if (config.spawnType === 'ring') {
            shape = {
                type: 'torus',
                data: {
                    x: config.spawnCircle.x,
                    y: config.spawnCircle.y,
                    radius: config.spawnCircle.r,
                    innerRadius: config.spawnCircle.minR,
                    affectRotation: true,
                },
            }
        } else if (config.spawnType === 'circle') {
            shape = {
                type: 'torus',
                data: {
                    x: config.spawnCircle.x,
                    y: config.spawnCircle.y,
                    radius: config.spawnCircle.r,
                    innerRadius: 0,
                    affectRotation: false,
                },
            }
        } else if (config.spawnType === 'rect') {
            shape = {
                type: 'rect',
                data: config.spawnRect,
            }
        } else if (config.spawnType === 'polygonalChain') {
            shape = {
                type: 'polygonalChain',
                data: config.spawnPolygon,
            }
        }
        if (shape) {
            result.behaviors.push({
                type: 'spawnShape',
                config: shape,
            })
        }
    }
    return result
}

// The obsolete emitter configuration format from version 3.0.0 of the library. This type information is kept to make it easy to upgrade, but otherwise configuration should be made as {@link EmitterConfigV3}.
export interface EmitterConfigV2 {
    alpha?: ValueList<number>
    speed?: ValueList<number>
    minimumSpeedMultiplier?: number
    maxSpeed?: number
    acceleration?: { x: number; y: number }
    scale?: ValueList<number>
    minimumScaleMultiplier?: number
    color?: ValueList<string>
    startRotation?: RandNumber
    noRotation?: boolean
    rotationSpeed?: RandNumber
    rotationAcceleration?: number
    lifetime: RandNumber
    blendMode?: string
    ease?: SimpleEase | EaseSegment[]
    extraData?: any
    particlesPerWave?: number
    spawnType?: string // Really "rect" | "circle" | "ring" | "burst" | "point" | "polygonalChain", but that tends to be too strict for random object creation.
    spawnRect?: { x: number; y: number; w: number; h: number }
    spawnCircle?: { x: number; y: number; r: number; minR?: number }
    particleSpacing?: number
    angleStart?: number
    spawnPolygon?: IPointData[] | IPointData[][]
    frequency: number
    spawnChance?: number
    emitterLifetime?: number
    maxParticles?: number
    addAtBack?: boolean
    pos: { x: number; y: number }
    emit?: boolean
    autoUpdate?: boolean
    orderedArt?: boolean
}

export interface BasicTweenable<T> {
    start: T
    end: T
}

// The obsolete emitter configuration format of the initial library release. This type information is kept to maintain compatibility with the older particle tool,
// but otherwise configuration should be made as {@link EmitterConfigV3}.
export interface EmitterConfigV1 {
    alpha?: BasicTweenable<number>
    speed?: BasicTweenable<number> & { minimumSpeedMultiplier?: number }
    maxSpeed?: number
    acceleration?: { x: number; y: number }
    scale?: BasicTweenable<number> & { minimumScaleMultiplier?: number }
    color?: BasicTweenable<string>
    startRotation?: RandNumber
    noRotation?: boolean
    rotationSpeed?: RandNumber
    rotationAcceleration?: number
    lifetime: RandNumber
    blendMode?: string
    ease?: SimpleEase | EaseSegment[]
    extraData?: any
    particlesPerWave?: number
    spawnType?: string // because "rect" | "circle" | "ring" | "burst" | "point" | "polygonalChain" is too strict for random object creation
    spawnRect?: { x: number; y: number; w: number; h: number }
    spawnCircle?: { x: number; y: number; r: number; minR?: number }
    particleSpacing?: number
    angleStart?: number
    spawnPolygon?: IPointData[] | IPointData[][]
    frequency: number
    spawnChance?: number
    emitterLifetime?: number
    maxParticles?: number
    addAtBack?: boolean
    pos: { x: number; y: number }
    emit?: boolean
    autoUpdate?: boolean
    orderedArt?: boolean
}
