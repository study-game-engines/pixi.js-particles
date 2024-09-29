import { Particle } from '../../Particle'
import { rotatePoint } from '../../ParticleUtils'
import { ObjectProperty } from '../editor/Types'
import { SpawnShape } from './SpawnShape'

/**
 * A class for spawning particles in a circle or ring. Can optionally apply rotation to particles so that they are aimed away from the center of the circle.
 * ```javascript
 * {
 *     type: 'torus',
 *     data: {
 *          radius: 30,
 *          x: 0,
 *          y: 0,
 *          innerRadius: 10,
 *          rotation: true
 *     }
 * }
 * ```
 */
export class Torus implements SpawnShape {

    public static type: string = 'torus'
    public static editorConfig: ObjectProperty = null

    public x: number
    public y: number
    public radius: number
    public innerRadius: number
    public rotation: boolean

    constructor(config: {
        radius: number // Radius of circle, or outer radius of a ring. Note that this uses the full name of 'radius', where earlier versions of the library may have used 'r'.
        x: number
        y: number
        innerRadius?: number // Inner radius of a ring. Omit, or use 0, to have a circle.
        affectRotation?: boolean // If rotation should be applied to particles, pointing them away from the center of the torus. Defaults to false.
    }) {
        this.x = config.x || 0
        this.y = config.y || 0
        this.radius = config.radius
        this.innerRadius = config.innerRadius || 0
        this.rotation = !!config.affectRotation
    }

    getRandomPosition(particle: Particle): void {
        if (this.innerRadius !== this.radius) {
            particle.x = (Math.random() * (this.radius - this.innerRadius)) + this.innerRadius
        } else {
            particle.x = this.radius
        }
        particle.y = 0
        const angle: number = Math.random() * Math.PI * 2
        if (this.rotation) {
            particle.rotation += angle
        }
        rotatePoint(angle, particle.position)
        particle.position.x += this.x
        particle.position.y += this.y
    }

}
