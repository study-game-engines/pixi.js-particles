import { Particle } from '../../Particle';
import type { ObjectProperty } from '../editor/Types';
import { SpawnShape } from './SpawnShape';

/**
 * A SpawnShape that randomly picks locations inside a rectangle.
 *
 * Example config:
 * ```javascript
 * {
 *     type: 'rect',
 *     data: {
 *          x: 0,
 *          y: 0,
 *          w: 10,
 *          h: 100
 *     }
 * }
 * ```
 */
export class Rectangle implements SpawnShape {

    public static type = 'rect';
    public static editorConfig: ObjectProperty = null;
    public x: number;
    public y: number;
    public w: number;
    public h: number;

    constructor(config: {
        x: number;
        y: number;
        w: number;
        h: number;
    }) {
        this.x = config.x;
        this.y = config.y;
        this.w = config.w;
        this.h = config.h;
    }

    getRandPos(particle: Particle): void {
        particle.x = (Math.random() * this.w) + this.x;
        particle.y = (Math.random() * this.h) + this.y;
    }

}
