import Konva from "konva"
import { RangeLabel } from "../render/RangleLabel"
import { DATA_COUNT, THINKNESS } from "../Constants"

const randomData = (layer: Konva.Layer) => {
    let labels: any = {}

    for (let i = 0; i < DATA_COUNT; i++) {

        const label = new RangeLabel({

            id: i,
            start: {
                x: Math.floor(500 * Math.random()), y: Math.floor(10 + 500 * Math.random())
            },

            end: {
                x: Math.floor(500 * Math.random()), y: Math.floor(10 + 500 * Math.random())
            },

            thinkness: Math.floor(THINKNESS * (Math.random() < 0.5 ? -1 : 1)),
            offset: [0, 0]
        }, layer)

        label.render()

        labels[i] = (label)

    }

    return labels

}


export {
    randomData
}