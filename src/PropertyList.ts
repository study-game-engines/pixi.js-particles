import { Color, combineRGBComponents, SimpleEase } from './ParticleUtils'
import { PropertyNode } from './PropertyNode'

function intValueSimple(this: PropertyList<number>, lerp: number): number {
    if (this.ease) {
        lerp = this.ease(lerp)
    }
    return ((this.first.next.value - this.first.value) * lerp) + this.first.value
}

function intColorSimple(this: PropertyList<Color>, lerp: number): number {
    if (this.ease) {
        lerp = this.ease(lerp)
    }
    const curVal: Color = this.first.value
    const nextVal: Color = this.first.next.value
    const r: number = ((nextVal.r - curVal.r) * lerp) + curVal.r
    const g: number = ((nextVal.g - curVal.g) * lerp) + curVal.g
    const b: number = ((nextVal.b - curVal.b) * lerp) + curVal.b
    return combineRGBComponents(r, g, b)
}

function intValueComplex(this: PropertyList<number>, lerp: number): number {
    if (this.ease) {
        lerp = this.ease(lerp)
    }
    let current: PropertyNode<number> = this.first
    let next: PropertyNode<number> = current.next
    while (lerp > next.time) {
        current = next
        next = next.next
    }
    lerp = (lerp - current.time) / (next.time - current.time) // convert the lerp value to the segment range
    return ((next.value - current.value) * lerp) + current.value
}

function intColorComplex(this: PropertyList<Color>, lerp: number): number {
    if (this.ease) {
        lerp = this.ease(lerp)
    }
    let current: PropertyNode<Color> = this.first
    let next: PropertyNode<Color> = current.next
    while (lerp > next.time) {
        current = next
        next = next.next
    }
    lerp = (lerp - current.time) / (next.time - current.time) // convert the lerp value to the segment range
    const curVal: Color = current.value
    const nextVal: Color = next.value
    const r: number = ((nextVal.r - curVal.r) * lerp) + curVal.r
    const g: number = ((nextVal.g - curVal.g) * lerp) + curVal.g
    const b: number = ((nextVal.b - curVal.b) * lerp) + curVal.b
    return combineRGBComponents(r, g, b)
}

function intValueStepped(this: PropertyList<number>, lerp: number): number {
    if (this.ease) {
        lerp = this.ease(lerp)
    }
    let current: PropertyNode<number> = this.first
    while (current.next && lerp > current.next.time) {
        current = current.next
    }
    return current.value
}

function intColorStepped(this: PropertyList<Color>, lerp: number): number {
    if (this.ease) {
        lerp = this.ease(lerp)
    }
    let current: PropertyNode<Color> = this.first
    while (current.next && lerp > current.next.time) {
        current = current.next
    }
    const color: Color = current.value
    return combineRGBComponents(color.r, color.g, color.b)
}

// Singly linked list container for keeping track of interpolated properties for particles. Each Particle will have one of these for each interpolated property.
export class PropertyList<V> {

    public first: PropertyNode<V> // The first property node in the linked list.
    public interpolate: (lerp: number) => number // Calculates the correct value for the current interpolation value. This method is set in the reset() method. @param lerp The interpolation value from 0-1. @return hex colors
    public ease: SimpleEase // A custom easing method for this list. @param lerp The interpolation value from 0-1. @return The eased value, also from 0-1.
    private readonly isColor: boolean // If this list manages colors, which requires a different method for interpolation.

    constructor(isColor = false) {
        this.first = null
        this.isColor = !!isColor
        this.interpolate = null
        this.ease = null
    }

    // Resets the list for use. @param first The first node in the list. @param first.isStepped If the values should be stepped instead of interpolated linearly.
    public reset(first: PropertyNode<V>): void {
        this.first = first
        const isSimple: boolean = first.next && first.next.time >= 1
        if (isSimple) {
            this.interpolate = this.isColor ? intColorSimple : intValueSimple
        } else if (first.isStepped) {
            this.interpolate = this.isColor ? intColorStepped : intValueStepped
        } else {
            this.interpolate = this.isColor ? intColorComplex : intValueComplex
        }
        this.ease = this.first.ease
    }

}
