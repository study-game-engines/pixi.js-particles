import { Texture } from '@pixi/core'
import { Particle } from '../Particle'
import { BehaviorOrder, IEmitterBehavior } from './Behaviors'
import { GetTextureFromString } from '../ParticleUtils'
import { BehaviorEditorConfig } from './editor/Types'

// The format of a single animation to be used on a particle.
export interface AnimatedParticleArt {
    framerate: -1 | number // Framerate for the animation (in frames per second). A value of -1 will tie the framerate to the particle's lifetime so that the animation lasts exactly as long as the particle.
    loop?: boolean // If the animation should loop. Defaults to false.
    textures: (string | Texture | { texture: string | Texture; count: number })[] // A list of textures or frame descriptions for duplicated frames. Example of a texture repeated for 5 frames, followed by a second texture for one frame: ```[{texture: 'myFirstTex', count: 5}, 'mySecondTex']```
}

// Internal data format for playback.
export interface ParsedAnimatedParticleArt {
    textures: Texture[]
    duration: number
    framerate: number
    loop: boolean
}

function getTextures(textures: (string | Texture | { texture: string | Texture; count: number })[]): Texture[] {
    const outTextures: Texture[] = []
    for (let j = 0; j < textures.length; ++j) {
        let tex = textures[j]
        if (typeof tex === 'string') {
            outTextures.push(GetTextureFromString(tex))
        } else if (tex instanceof Texture) {
            outTextures.push(tex)
        } else {
            let dupe = tex.count || 1
            if (typeof tex.texture === 'string') {
                tex = GetTextureFromString(tex.texture)
            } else /* if(tex.texture instanceof Texture) */ {
                tex = tex.texture
            }
            for (; dupe > 0; --dupe) {
                outTextures.push(tex)
            }
        }
    }
    return outTextures
}

/**
 * A Texture behavior that picks a random animation for each particle to play.
 * ```javascript
 * {
 *     type: 'animatedRandom',
 *     config: {
 *         anims: [
 *              {
 *                  framerate: 25,
 *                  loop: true,
 *                  textures: ['frame1', 'frame2', 'frame3']
 *              },
 *              {
 *                  framerate: 25,
 *                  loop: true,
 *                  textures: ['frame3', 'frame2', 'frame1']
 *              }
 *         ],
 *     }
 * }
 * ```
 */
export class RandomAnimatedTextureBehavior implements IEmitterBehavior {

    public static type = 'animatedRandom'
    public static editorConfig: BehaviorEditorConfig = null

    public order = BehaviorOrder.Normal
    private anims: ParsedAnimatedParticleArt[]

    constructor(config: {
        anims: AnimatedParticleArt[] // Animation configuration to use for each particle, randomly chosen from the list.
    }) {
        this.anims = []
        for (let i = 0; i < config.anims.length; ++i) {
            const anim = config.anims[i]
            const textures = getTextures(anim.textures)
            const framerate = anim.framerate < 0 ? -1 : (anim.framerate > 0 ? anim.framerate : 60)
            const parsedAnim: ParsedAnimatedParticleArt = {
                textures,
                duration: framerate > 0 ? textures.length / framerate : 0,
                framerate,
                loop: framerate > 0 ? !!anim.loop : false,
            }
            this.anims.push(parsedAnim)
        }
    }

    initParticles(first: Particle): void {
        let next = first
        while (next) {
            const index = Math.floor(Math.random() * this.anims.length)
            const anim = next.config.anim = this.anims[index]
            next.texture = anim.textures[0]
            next.config.animElapsed = 0
            // if anim should match particle life exactly
            if (anim.framerate === -1) {
                next.config.animDuration = next.maxLife
                next.config.animFramerate = anim.textures.length / next.maxLife
            } else {
                next.config.animDuration = anim.duration
                next.config.animFramerate = anim.framerate
            }
            next = next.next
        }
    }

    updateParticle(particle: Particle, deltaSec: number): void {
        const config = particle.config
        const anim = config.anim
        config.animElapsed += deltaSec
        if (config.animElapsed >= config.animDuration) {
            if (config.anim.loop) {
                config.animElapsed = config.animElapsed % config.animDuration // loop elapsed back around
            } else {
                config.animElapsed = config.animDuration - 0.000001 // subtract a small amount to prevent attempting to go past the end of the animation
            }
        }
        const frame = ((config.animElapsed * config.animFramerate) + 0.0000001) | 0 // add a very small number to the frame and then floor it to avoid the frame being one short due to floating point errors.
        particle.texture = anim.textures[frame] || anim.textures[anim.textures.length - 1] || Texture.EMPTY // in the very rare case that framerate * elapsed math ends up going past the end, use the last texture
    }
}

/**
 * A Texture behavior that uses a single animation for each particle to play.
 * ```javascript
 * {
 *     type: 'animatedSingle',
 *     config: {
 *         anim: {
 *              framerate: 25,
 *              loop: true,
 *              textures: ['frame1', 'frame2', 'frame3']
 *         }
 *     }
 * }
 * ```
 */
export class SingleAnimatedTextureBehavior implements IEmitterBehavior {

    public static type = 'animatedSingle'
    public static editorConfig: BehaviorEditorConfig = null
    public order = BehaviorOrder.Normal
    private anim: ParsedAnimatedParticleArt

    constructor(config: {
        anim: AnimatedParticleArt // Animation configuration to use for each particle.
    }) {
        const anim = config.anim
        const textures = getTextures(anim.textures)
        const framerate = anim.framerate < 0 ? -1 : (anim.framerate > 0 ? anim.framerate : 60)
        this.anim = {
            textures,
            duration: framerate > 0 ? textures.length / framerate : 0,
            framerate,
            loop: framerate > 0 ? !!anim.loop : false,
        }
    }

    initParticles(first: Particle): void {
        let next = first
        const anim = this.anim
        while (next) {
            next.texture = anim.textures[0]
            next.config.animElapsed = 0
            // if anim should match particle life exactly
            if (anim.framerate === -1) {
                next.config.animDuration = next.maxLife
                next.config.animFramerate = anim.textures.length / next.maxLife
            } else {
                next.config.animDuration = anim.duration
                next.config.animFramerate = anim.framerate
            }
            next = next.next
        }
    }

    updateParticle(particle: Particle, deltaSec: number): void {
        const anim = this.anim
        const config = particle.config
        config.animElapsed += deltaSec
        if (config.animElapsed >= config.animDuration) {
            if (anim.loop) {
                config.animElapsed = config.animElapsed % config.animDuration // loop elapsed back around
            } else {
                config.animElapsed = config.animDuration - 0.000001 // subtract a small amount to prevent attempting to go past the end of the animation
            }
        }
        const frame = ((config.animElapsed * config.animFramerate) + 0.0000001) | 0 // add a very small number to the frame and then floor it to avoid the frame being one short due to floating point errors.
        particle.texture = anim.textures[frame] || anim.textures[anim.textures.length - 1] || Texture.EMPTY // in the very rare case that framerate * elapsed math ends up going past the end, use the last texture
    }

}
