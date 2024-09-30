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
    const result: Texture[] = []
    for (let j = 0; j < textures.length; j++) {
        let tex = textures[j]
        if (typeof tex === 'string') {
            result.push(GetTextureFromString(tex))
        } else if (tex instanceof Texture) {
            result.push(tex)
        } else {
            let dupe = tex.count || 1
            if (typeof tex.texture === 'string') {
                tex = GetTextureFromString(tex.texture)
            } else /* if(tex.texture instanceof Texture) */ {
                tex = tex.texture
            }
            for (; dupe > 0; dupe--) {
                result.push(tex)
            }
        }
    }
    return result
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

    public static type: string = 'animatedRandom'
    public static editorConfig: BehaviorEditorConfig = null

    public readonly order: BehaviorOrder = BehaviorOrder.Normal
    private anims: ParsedAnimatedParticleArt[]

    constructor(config: {
        anims: AnimatedParticleArt[] // Animation configuration to use for each particle, randomly chosen from the list.
    }) {
        this.anims = []
        for (let index = 0; index < config.anims.length; index++) {
            const anim: AnimatedParticleArt = config.anims[index]
            const textures: Texture[] = getTextures(anim.textures)
            const framerate: -1 | number = anim.framerate < 0 ? -1 : (anim.framerate > 0 ? anim.framerate : 60)
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
        let next: Particle = first
        while (next) {
            const index: number = Math.floor(Math.random() * this.anims.length)
            const anim: ParsedAnimatedParticleArt = next.config.anim = this.anims[index]
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
        const config: { [p: string]: any } = particle.config
        const anim = config.anim
        config.animElapsed += deltaSec
        if (config.animElapsed >= config.animDuration) {
            if (config.anim.loop) {
                config.animElapsed = config.animElapsed % config.animDuration // loop elapsed back around
            } else {
                config.animElapsed = config.animDuration - 0.000001 // subtract a small amount to prevent attempting to go past the end of the animation
            }
        }
        const frame: number = ((config.animElapsed * config.animFramerate) + 0.0000001) | 0 // add a very small number to the frame and then floor it to avoid the frame being one short due to floating point errors.
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

    public static type: string = 'animatedSingle'
    public static editorConfig: BehaviorEditorConfig = null

    public readonly order: BehaviorOrder = BehaviorOrder.Normal
    private readonly anim: ParsedAnimatedParticleArt

    constructor(config: {
        anim: AnimatedParticleArt // Animation configuration to use for each particle.
    }) {
        const anim: AnimatedParticleArt = config.anim
        const textures: Texture[] = getTextures(anim.textures)
        const framerate: -1 | number = anim.framerate < 0 ? -1 : (anim.framerate > 0 ? anim.framerate : 60)
        this.anim = {
            textures,
            duration: framerate > 0 ? textures.length / framerate : 0,
            framerate,
            loop: framerate > 0 ? !!anim.loop : false,
        }
    }

    initParticles(first: Particle): void {
        let next: Particle = first
        const anim: ParsedAnimatedParticleArt = this.anim
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
        const anim: ParsedAnimatedParticleArt = this.anim
        const config: { [p: string]: any } = particle.config
        config.animElapsed += deltaSec
        if (config.animElapsed >= config.animDuration) {
            if (anim.loop) {
                config.animElapsed = config.animElapsed % config.animDuration // loop elapsed back around
            } else {
                config.animElapsed = config.animDuration - 0.000001 // subtract a small amount to prevent attempting to go past the end of the animation
            }
        }
        const frame: number = ((config.animElapsed * config.animFramerate) + 0.0000001) | 0 // add a very small number to the frame and then floor it to avoid the frame being one short due to floating point errors.
        particle.texture = anim.textures[frame] || anim.textures[anim.textures.length - 1] || Texture.EMPTY // in the very rare case that framerate * elapsed math ends up going past the end, use the last texture
    }

}
