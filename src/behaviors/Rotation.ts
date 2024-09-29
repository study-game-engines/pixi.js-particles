import { Particle } from '../Particle';
import { DEG_TO_RADS } from '../ParticleUtils';
import { BehaviorOrder, IEmitterBehavior } from './Behaviors';
import { BehaviorEditorConfig } from './editor/Types';

/**
 * A Rotation behavior that handles starting rotation, rotation speed, and rotational acceleration.
 * ```javascript
 * {
 *     "type": "rotation",
 *     "config": {
 *          "minStart": 0,
 *          "maxStart": 180,
 *          "minSpeed": 30,
 *          "maxSpeed": 45,
 *          "accel": 20
 *     }
 *}
 * ```
 */
export class RotationBehavior implements IEmitterBehavior {

    public static type = 'rotation';
    public static editorConfig: BehaviorEditorConfig = null;
    public order = BehaviorOrder.Normal;
    private minStart: number;
    private maxStart: number;
    private minSpeed: number;
    private maxSpeed: number;
    private accel: number;

    constructor(config: {
        minStart: number; // Minimum starting rotation of the particles, in degrees. 0 is facing right, 90 is upwards.
        maxStart: number; // Maximum starting rotation of the particles, in degrees. 0 is facing right, 90 is upwards.
        minSpeed: number; // Minimum rotation speed of the particles, in degrees/second. Positive is counter-clockwise.
        maxSpeed: number; // Maximum rotation speed of the particles, in degrees/second. Positive is counter-clockwise.
        accel: number; // Constant rotational acceleration of the particles, in degrees/second/second.
    }) {
        this.minStart = config.minStart * DEG_TO_RADS;
        this.maxStart = config.maxStart * DEG_TO_RADS;
        this.minSpeed = config.minSpeed * DEG_TO_RADS;
        this.maxSpeed = config.maxSpeed * DEG_TO_RADS;
        this.accel = config.accel * DEG_TO_RADS;
    }

    initParticles(first: Particle): void {
        let next = first;
        while (next) {
            if (this.minStart === this.maxStart) {
                next.rotation += this.maxStart;
            }
            else {
                next.rotation += (Math.random() * (this.maxStart - this.minStart)) + this.minStart;
            }
            next.config.rotSpeed = (Math.random() * (this.maxSpeed - this.minSpeed)) + this.minSpeed;
            next = next.next;
        }
    }

    updateParticle(particle: Particle, deltaSec: number): void {
        if (this.accel) {
            const oldSpeed = particle.config.rotSpeed;
            particle.config.rotSpeed += this.accel * deltaSec;
            particle.rotation += (particle.config.rotSpeed + oldSpeed) / 2 * deltaSec;
        }
        else {
            particle.rotation += particle.config.rotSpeed * deltaSec;
        }
    }

}

/**
 * A Rotation behavior that handles starting rotation.
 * ```javascript
 * {
 *     "type": "rotationStatic",
 *     "config": {
 *          "min": 0,
 *          "max": 180,
 *     }
 *}
 * ```
 */
export class StaticRotationBehavior implements IEmitterBehavior {

    public static type = 'rotationStatic';
    public static editorConfig: BehaviorEditorConfig = null;
    public order = BehaviorOrder.Normal;
    private min: number;
    private max: number;

    constructor(config: {
        min: number; // Minimum starting rotation of the particles, in degrees. 0 is facing right, 90 is upwards.
        max: number; // Maximum starting rotation of the particles, in degrees. 0 is facing right, 90 is upwards.
    }) {
        this.min = config.min * DEG_TO_RADS;
        this.max = config.max * DEG_TO_RADS;
    }

    initParticles(first: Particle): void {
        let next = first;
        while (next) {
            if (this.min === this.max) {
                next.rotation += this.max;
            }
            else {
                next.rotation += (Math.random() * (this.max - this.min)) + this.min;
            }
            next = next.next;
        }
    }

}

/**
 * A Rotation behavior that blocks all rotation caused by spawn settings, by resetting it to the specified rotation (or 0).
 * ```javascript
 * {
 *     "type": "noRotation",
 *     "config": {
 *          "rotation": 0
 *     }
 *}
 * ```
 */
export class NoRotationBehavior implements IEmitterBehavior {

    public static type = 'noRotation';
    public static editorConfig: BehaviorEditorConfig = null;
    public order = BehaviorOrder.Late + 1;
    private rotation: number;

    constructor(config: {
        rotation?: number; // Locked rotation of the particles, in degrees. 0 is facing right, 90 is upwards.
    }) {
        this.rotation = (config.rotation || 0) * DEG_TO_RADS;
    }

    initParticles(first: Particle): void {
        let next = first;
        while (next) {
            next.rotation = this.rotation;
            next = next.next;
        }
    }

}
