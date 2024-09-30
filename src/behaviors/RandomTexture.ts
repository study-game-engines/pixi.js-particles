import { Texture } from '@pixi/core'
import { Particle } from '../Particle'
import { IEmitterBehavior, BehaviorOrder } from './Behaviors'
import { GetTextureFromString } from '../ParticleUtils'
import { BehaviorEditorConfig } from './editor/Types'

/**
 * A Texture behavior that assigns a random texture to each particle from its list
 * ```javascript
 * {
 *     type: 'textureRandom',
 *     config: {
 *         textures: ["myTex1Id", "myTex2Id", "myTex3Id", "myTex4Id"],
 *     }
 * }
 * ```
 */
export class RandomTextureBehavior implements IEmitterBehavior {

    public static type: string = 'textureRandom'
    public static editorConfig: BehaviorEditorConfig = null

    public readonly order: BehaviorOrder = BehaviorOrder.Normal
    private readonly textures: Texture[]

    constructor(config: {
        textures: (Texture | string)[] // Images to use for each particle, randomly chosen from the list.
    }) {
        this.textures = config.textures.map((tex) => (typeof tex === 'string' ? GetTextureFromString(tex) : tex))
    }

    initParticles(first: Particle): void {
        let next: Particle = first
        while (next) {
            const index: number = Math.floor(Math.random() * this.textures.length)
            next.texture = this.textures[index]
            next = next.next
        }
    }

}
