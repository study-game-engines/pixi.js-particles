# Examples

`npm run clean && npm run dist && http-server . -o examples`

## Example

```js
var emitter = new PIXI.particles.Emitter(
    container, // The PIXI.Container to put the emitter in if using blend modes, it's important to put this on top of a bitmap, and not use the root stage Container    
    {
        lifetime: {
            min: 0.5,
            max: 0.5
        },
        frequency: 0.008,
        spawnChance: 1,
        particlesPerWave: 1,
        emitterLifetime: 0.31,
        maxParticles: 1000,
        pos: {
            x: 0,
            y: 0
        },
        addAtBack: false,
        behaviors: [
            {
                type: 'alpha',
                config: {
                    alpha: {
                        list: [
                            {
                                value: 0.8,
                                time: 0
                            },
                            {
                                value: 0.1,
                                time: 1
                            }
                        ],
                    },
                }
            },
            {
                type: 'scale',
                config: {
                    scale: {
                        list: [
                            {
                                value: 1,
                                time: 0
                            },
                            {
                                value: 0.3,
                                time: 1
                            }
                        ],
                    },
                }
            },
            {
                type: 'color',
                config: {
                    color: {
                        list: [
                            {
                                value: "fb1010",
                                time: 0
                            },
                            {
                                value: "f5b830",
                                time: 1
                            }
                        ],
                    },
                }
            },
            {
                type: 'moveSpeed',
                config: {
                    speed: {
                        list: [
                            {
                                value: 200,
                                time: 0
                            },
                            {
                                value: 100,
                                time: 1
                            }
                        ],
                        isStepped: false
                    },
                }
            },
            {
                type: 'rotationStatic',
                config: {
                    min: 0,
                    max: 360
                }
            },
            {
                type: 'spawnShape',
                config: {
                    type: 'torus',
                    data: {
                        x: 0,
                        y: 0,
                        radius: 10
                    }
                }
            },
            {
                type: 'textureSingle',
                config: {
                    texture: PIXI.Texture.from('image.jpg')
                }
            }
        ],
    }
);

var elapsed = Date.now();
var update = function () {
    requestAnimationFrame(update);
    var now = Date.now();
    emitter.update((now - elapsed) * 0.001);
    elapsed = now;
};
emitter.emit = true;
update();
```

# Particle Editor

[Particle Editor](http://pixijs.github.io/pixi-particles-editor/) to design and preview custom particle emitters which
utilitze PixiJS Particle Emitter. The editor was built for an older version of the library, so to use its output use the
[`upgradeConfig()`](https://pixijs.github.io/particle-emitter/docs/modules.html#upgradeConfig) function.

## Breaking changes in v5 from v4

* Project has been renamed from `pixi-particles` to `@pixi/particle-emitter`
* On `Emitter`, configuration format has drastically changed.
* `PathParticle` and `AnimatedParticle` no longer exist, use the new behaviors instead.
* Dropped support for PixiJS v4. Please use v6, because v5 will cause you a headache.
* The library now outputs ES6, so if you need it in ES5, you'll need to make sure your build process transpiles it.

## License

Copyright (c) 2015 [CloudKid](http://github.com/cloudkidstudio)

Released under the MIT License.
