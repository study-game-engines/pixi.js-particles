(function (window) {
    class ParticleExample {
        constructor(imagePaths, config, testContainers, stepColors) {
            const canvas = document.getElementById('stage');
            const rendererOptions = {
                width: canvas.width,
                height: canvas.height,
                view: canvas,
            };
            this.stage = new PIXI.Container();
            this.emitter = null;
            this.renderer = new PIXI.Renderer(rendererOptions);
            this.bg = null;
            this.updateHook = null;
            this.containerHook = null;
            const framerate = document.getElementById('framerate');
            const particleCount = document.getElementById('particleCount');
            const containerType = document.getElementById('containerType');
            let elapsed = Date.now();
            let updateId;
            const update = () => {
                updateId = requestAnimationFrame(update);
                const now = Date.now();
                if (this.emitter) {
                    this.emitter.update((now - elapsed) * 0.001);
                }
                if (this.updateHook) {
                    this.updateHook(now - elapsed);
                }
                framerate.innerHTML = `${(1000 / (now - elapsed)).toFixed(2)} fps`;
                elapsed = now;
                if (this.emitter && particleCount) {
                    particleCount.innerHTML = `${this.emitter.particleCount} particles`;
                }
                this.renderer.render(this.stage);
            };
            window.onresize = () => {
                canvas.width = window.innerWidth;
                canvas.height = window.innerHeight;
                this.renderer.resize(canvas.width, canvas.height);
                if (this.bg) {
                    // bg is a 1px by 1px image
                    this.bg.scale.x = canvas.width;
                    this.bg.scale.y = canvas.height;
                }
            };
            window.onresize();
            let urls;
            if (imagePaths.spritesheet) {
                urls = [imagePaths.spritesheet];
            }
            else if (imagePaths.textures) {
                urls = imagePaths.textures.slice();
            }
            else {
                urls = imagePaths.slice();
            }
            const loader = PIXI.Loader.shared;
            for (let i = 0; i < urls.length; ++i) {
                loader.add('img' + i, urls[i]);
            }
            loader.load(() => {
                this.bg = new PIXI.Sprite(PIXI.Texture.WHITE);
                this.bg.scale.x = canvas.width;
                this.bg.scale.y = canvas.height;
                this.bg.tint = 0x000000;
                this.stage.addChild(this.bg);
                let parentType = 0;

                function getContainer() {
                    switch (parentType) {
                        case 1:
                            const pc = new PIXI.ParticleContainer();
                            pc.setProperties({
                                scale: true,
                                position: true,
                                rotation: true,
                                uvs: true,
                                alpha: true,
                            });
                            return [pc, 'PIXI.ParticleContainer'];
                        case 2:
                            return [new PIXI.particles.LinkedListContainer(), 'PIXI.particles.LinkedListContainer'];
                        default:
                            return [new PIXI.Container(), 'PIXI.Container'];
                    }
                }

                let [emitterContainer, containerName] = getContainer();
                this.stage.addChild(emitterContainer);
                if (containerType) containerType.innerHTML = containerName;
                window.emitter = this.emitter = new PIXI.particles.Emitter(emitterContainer, config);
                if (stepColors) {
                    this.emitter.getBehavior('color')
                        .list
                        .reset(PIXI.particles.ParticleUtils.createSteppedGradient(config.behaviors.find((b) => b.type === 'color').config.color.list, stepColors));
                }
                this.emitter.updateOwnerPos(window.innerWidth / 2, window.innerHeight / 2);
                canvas.addEventListener('mouseup', (e) => {
                    if (!this.emitter) return;
                    if (e.button) {
                        if (testContainers) {
                            if (++parentType >= 3) parentType = 0;
                            const oldParent = emitterContainer;
                            [emitterContainer, containerName] = getContainer();
                            if (containerType) containerType.innerHTML = containerName;
                            this.stage.addChild(emitterContainer);
                            this.emitter.parent = emitterContainer;
                            this.stage.removeChild(oldParent);
                            oldParent.destroy();
                            if (this.containerHook) {
                                this.containerHook();
                            }
                        }
                    }
                    else {
                        this.emitter.emit = true;
                        this.emitter.resetPositionTracking();
                        this.emitter.updateOwnerPos(e.offsetX || e.layerX, e.offsetY || e.layerY);
                    }
                });
                document.body.addEventListener('contextmenu', (e) => {
                    e.preventDefault();
                    return false;
                });
                update();
                window.destroyEmitter = () => {
                    this.emitter.destroy();
                    this.emitter = null;
                    window.destroyEmitter = null;
                    this.renderer.render(this.stage);
                };
            });
        }
    }

    window.ParticleExample = ParticleExample;
})(window);
