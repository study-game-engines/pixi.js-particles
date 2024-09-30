import { BlendModeBehavior } from '../../BlendMode'
import { BLEND_MODES } from '@pixi/constants'

function makeReadable(input: string) {
    const words: string[] = input.split('_')
    for (let index = 0; index < words.length; index++) {
        if (words[index] === 'SRC') {
            words[index] = 'Source'
        } else if (words[index] === 'DST') {
            words[index] = 'Destination'
        } else {
            words[index] = words[index][0] + words[index].substring(1).toLowerCase()
        }
    }
    return words.join(' ')
}

BlendModeBehavior.editorConfig = {
    category: 'blend',
    title: 'Blend Mode',
    props: [
        {
            type: 'select',
            name: 'blendMode',
            title: 'Blend Mode',
            description: 'Blend mode of all particles. IMPORTANT - The WebGL renderer only supports the Normal, Add, Multiply and Screen blend modes. Anything else will silently act like Normal.',
            default: 'NORMAL',
            options: Object.keys(BLEND_MODES).filter((key) => !(/\d/).test(key)).map((key) => ({ value: key, label: makeReadable(key) })),
        },
    ],
}
