import { filter } from "rust-filter";


const canvas = document.getElementById('canvas');
const height = 500;
const width = 600;
canvas.width = width;
canvas.height = height;
const ctx = canvas.getContext('2d');

filter(ctx, width, height, [1]);
//
// const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height);
//
// const data = pixels.data
// for (let y = 0; y < height - 0; ++y) {
//     for (let x = 0; x < width - 0; ++x) {
//         const px = (y * width + x) * 4 // pixel index.
//         let r = 100,
//             g = 100,
//             b = 100
//
//
//         data[px + 0] = r > 255 ? 255 : r < 0 ? 0 : r
//         data[px + 1] = g > 255 ? 255 : g < 0 ? 0 : g
//         data[px + 2] = b > 255 ? 255 : b < 0 ? 0 : b
//         data[px + 3] = 255;
//         // data[px + 3] =
//         //   a / denominator > 255 ? 255 : a / denominator < 0 ? 0 : a / denominator
//     }
// }
//
// pixels.data.set(data)
// ctx.putImageData(pixels, 0, 0)