# Get Started

- code: 2800 loc
- install: `npm install`
- run: `npm run clean && npm run dist && http-server . -o examples`

# PixiJS Particle Emitter

[![Build Status](https://github.com/pixijs/particle-emitter/workflows/Build/badge.svg)](https://github.com/pixijs/particle-emitter/actions?query=workflow%3A%22Build%22) [![GitHub version](https://badge.fury.io/gh/pixijs%2Fparticle-emitter.svg)](https://github.com/pixijs/particle-emitter/releases/latest)

A particle system library for the [PixiJS](https://github.com/pixijs/pixi.js) library. Also, we created
an [interactive particle editor](http://pixijs.github.io/pixi-particles-editor/) to design and preview custom particle
emitters which utilitze PixiJS Particle Emitter. Note that the editor was built for an older version of the library - to
use its output you'll have to use
the [`upgradeConfig()`](https://pixijs.github.io/particle-emitter/docs/modules.html#upgradeConfig) function.

## Breaking changes in v5 from v4

* Project has been renamed from `pixi-particles` to `@pixi/particle-emitter`
* On `Emitter`, configuration format has drastically changed.
  Use [`upgradeConfig()`](https://pixijs.github.io/particle-emitter/docs/modules.html#upgradeConfig) to convert old
  configuration objects automatically.
* `PathParticle` and `AnimatedParticle` no longer exist, use the new behaviors instead.
* Dropped support for PixiJS v4. Please use v6 - while v5 may work, Typescript definitions won't work and will cause you
  a headache.
* The library now outputs ES6 code - if you need it in ES5 code, you'll need to make sure your build process transpiles
  it.

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

## License

Copyright (c) 2015 [CloudKid](http://github.com/cloudkidstudio)

Released under the MIT License.
