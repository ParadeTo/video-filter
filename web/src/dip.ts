export enum FilterOption {
  off = 'off',
  js = 'js',
  wasm = 'wasm',
}

const filterTimeRecordsMap: {[k: string]: number[]} = {
  [FilterOption.off]: [],
  [FilterOption.js]: [],
  [FilterOption.wasm]: [],
}

export enum Kernel {
  sharpen = 'sharpen',
  laplace = 'laplace',
  smoothing = 'smoothing',
}

const kernelMap = {
  [Kernel.smoothing]: [
    [1 / 9, 1 / 9, 1 / 9],
    [1 / 9, 1 / 9, 1 / 9],
    [1 / 9, 1 / 9, 1 / 9],
  ],
  [Kernel.sharpen]: [
    [-1, -1, -1],
    [-1, 9, -1],
    [-1, -1, -1],
  ],
  [Kernel.laplace]: [
    [1, 1, 1],
    [1, -8, 1],
    [1, 1, 1],
  ],
}

// function flipKernel(kernel: number[][]) {
//   const h = kernel.length
//   const half = Math.floor(h / 2)
//   for (let i = 0; i < half; ++i) {
//     for (let j = 0; j < h; ++j) {
//       let _t = kernel[i][j]
//       kernel[i][j] = kernel[h - i - 1][h - j - 1]
//       kernel[h - i - 1][h - j - 1] = _t
//     }
//   }
//   if (h & 1) {
//     for (let j = 0; j < half; ++j) {
//       let _t = kernel[half][j]
//       kernel[half][j] = kernel[half][h - j - 1]
//       kernel[half][h - j - 1] = _t
//     }
//   }
//   return kernel
// }

function calcFPS(arr: number[]) {
  const n = 20
  if (arr.length > n) {
    arr.shift()
  } else {
    return NaN
  }
  let averageTime =
    arr.reduce((pre, item) => {
      return pre + item
    }, 0) / n
  return 1000 / averageTime
}

function getDenominator(kernel: number[][]) {
  let sum = 0
  for (let i = 0; i < kernel.length; i++) {
    const arr = kernel[i]
    for (let j = 0; j < arr.length; j++) {
      sum += Math.abs(kernel[i][j])
    }
  }
  return sum
}

function filterByJS(
  data: Uint8ClampedArray,
  width: number,
  height: number,
  kernel: number[][]
) {
  // const newData = new Uint8ClampedArray(data)
  const h = kernel.length,
    w = h
  const half = Math.floor(h / 2)

  // picture iteration.
  for (let y = half; y < height - half; ++y) {
    for (let x = half; x < width - half; ++x) {
      const px = (y * width + x) * 4 // pixel index.
      let r = 0,
        g = 0,
        b = 0

      // core iteration.
      for (let cy = 0; cy < h; ++cy) {
        for (let cx = 0; cx < w; ++cx) {
          // dealing edge case.
          const cpx = ((y + (cy - half)) * width + (x + (cx - half))) * 4
          // if (px === 50216) debugger
          r += data[cpx + 0] * kernel[cy][cx]
          g += data[cpx + 1] * kernel[cy][cx]
          b += data[cpx + 2] * kernel[cy][cx]
          // a += data[cpx + 3] * kernel[cy][cx]
        }
      }
      data[px + 0] = r > 255 ? 255 : r < 0 ? 0 : r
      data[px + 1] = g > 255 ? 255 : g < 0 ? 0 : g
      data[px + 2] = b > 255 ? 255 : b < 0 ? 0 : b
      // data[px + 3] =
      //   a / denominator > 255 ? 255 : a / denominator < 0 ? 0 : a / denominator
    }
  }
  return data
}

type Pointer = number

function filterByGO(
  ptr: Pointer,
  width: number,
  height: number,
  kernel: number[][]
) {
  // @ts-ignore
  window.filterByGO()
}

export function getDrawFn(
  video: HTMLVideoElement,
  canvas: HTMLCanvasElement,
  goInstance: WebAssembly.Instance,
  afterEachFrame: (fps: number) => void,
  filterOption: FilterOption = FilterOption.off,
  kernel: Kernel = Kernel.sharpen
) {
  const context2D = canvas.getContext('2d')!
  const dataLen = canvas.height * canvas.width
  //@ts-ignore
  const {internalptr: ptr} = window.initShareMemory(dataLen * 4)
  const mem = new Uint8Array(
    goInstance.exports.mem.buffer,
    ptr,
    dataLen * 4 + 10000
  )

  // mem.set([1, 2, 3, 4, 5])
  // window.filterByGO(ptr, 1, 5)
  // console.log(mem[0], mem[4])
  // console.log(window.filterByGO(ptr, 1, 11))
  // console.log(mem[10])
  //@ts-ignore

  const draw = () => {
    // record performance.
    const timeStart = performance.now()

    // render the first frame from the top-left of the canvas.
    context2D.drawImage(
      video,
      0,
      0,
      video.videoWidth,
      video.videoHeight,
      0,
      0,
      canvas.width,
      canvas.height
    )

    // get current video data.
    const pixels = context2D.getImageData(0, 0, canvas.width, canvas.height)

    switch (filterOption) {
      case FilterOption.js: {
        pixels.data.set(
          filterByJS(
            pixels.data,
            canvas.width,
            canvas.height,
            kernelMap[kernel]
          )
        )
        break
      }
      case FilterOption.wasm: {
        mem.set(pixels.data)
        filterByGO(ptr, canvas.width, canvas.height, kernelMap[kernel])
        pixels.data.set(mem)
        // const a = window.filterByGOCopy(
        //   pixels.data,
        //   canvas.width,
        //   canvas.height,
        //   kernelMap[kernel].flat()
        // )

        // pixels.data.set(
        //   a
        //   //@ts-ignore
        // )
        break
      }
    }

    // append image onto the canvas.
    context2D.putImageData(pixels, 0, 0)

    let timeUsed = performance.now() - timeStart
    filterTimeRecordsMap[filterOption].push(timeUsed)

    afterEachFrame(calcFPS(filterTimeRecordsMap[filterOption]))

    // continue.
    requestAnimationFrame(draw)
  }

  return {
    draw,
    setFilterOption: (val: FilterOption) => (filterOption = val),
    setKernel: (val: Kernel) => {
      kernel = val
      // denominator = getDenominator(kernelMap[kernel])
    },
  }
}
