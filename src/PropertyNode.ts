import { generateEase, hexToRGB, EaseSegment, SimpleEase, Color } from './ParticleUtils';
import { BasicTweenable } from './EmitterConfig';

// A single step of a ValueList.
export interface ValueStep<T> {
    value: T; // The color or number to use at this step.
    time: number; // The percentage time of the particle's lifespan that this step happens at. Values are between 0 and 1, inclusive.
}

// Configuration for an interpolated or stepped list of numeric or color particle values.
export interface ValueList<T> {
    list: ValueStep<T>[]; // The ordered list of values.
    isStepped?: boolean; // If the list is stepped. Stepped lists don't determine any in-between values, instead sticking with each value until its time runs out.
    ease?: SimpleEase | EaseSegment[]; // Easing that should be applied to this list, in order to alter how quickly the steps progress.
}

// A single node in a PropertyList.
export class PropertyNode<V> {

    public value: V; // Value for the node.
    public time: number; // Time value for the node. Between 0-1.
    public next: PropertyNode<V>; // The next node in line.
    public isStepped: boolean; // If this is the first node in the list, controls if the entire list is stepped or not.
    public ease: SimpleEase;

    // @param value The value for this node, @param time The time for this node, between 0-1, @param [ease] Custom ease for this list. Only relevant for the first node.
    constructor(value: V, time: number, ease?: SimpleEase | EaseSegment[]) {
        this.value = value;
        this.time = time;
        this.next = null;
        this.isStepped = false;
        if (ease) {
            this.ease = typeof ease === 'function' ? ease : generateEase(ease);
        } else {
            this.ease = null;
        }
    }

    /**
     * Creates a list of property values from a data object {list, isStepped} with a list of objects in the form {value, time}. Alternatively, the data object can be in the deprecated form of {start, end}.
     * @param data The data for the list.
     * @param data.list The array of value and time objects.
     * @param data.isStepped If the list is stepped rather than interpolated.
     * @param data.ease Custom ease for this list.
     * @return The first node in the list
     */
    public static createList<T extends (string | number)>(data: ValueList<T> | BasicTweenable<T>): PropertyNode<T extends string ? Color : T> {
        if ('list' in data) {
            const array = data.list;
            let node;
            const { value, time } = array[0];
            const first = node = new PropertyNode(typeof value === 'string' ? hexToRGB(value) : value, time, data.ease);
            // only set up subsequent nodes if there are a bunch or the 2nd one is different from the first
            if (array.length > 2 || (array.length === 2 && array[1].value !== value)) {
                for (let i = 1; i < array.length; ++i) {
                    const { value, time } = array[i];

                    node.next = new PropertyNode(typeof value === 'string' ? hexToRGB(value) : value, time);
                    node = node.next;
                }
            }
            first.isStepped = !!data.isStepped;
            return first as PropertyNode<T extends string ? Color : T>;
        }
        const start = new PropertyNode(typeof data.start === 'string' ? hexToRGB(data.start) : data.start, 0); // Handle deprecated version here
        if (data.end !== data.start) {
            start.next = new PropertyNode(typeof data.end === 'string' ? hexToRGB(data.end) : data.end, 1); // only set up a next value if it is different from the starting value
        }
        return start as PropertyNode<T extends string ? Color : T>;
    }

}
