onmessage = async (e: MessageEvent) => {
  const {
    data: {start, end, kernel, width, sharedArrayBuffer, useWasm},
  } = e
  if (useWasm) {
    const {take_pointer_by_value, return_pointer, filter_by_block} =
      await import('rust-filter/rust_filter')
    const {memory} = await import('rust-filter/rust_filter_bg.wasm')
    const ptr = return_pointer()

    const uint8ClampedArrayForMemBuf = new Uint8ClampedArray(memory.buffer)
    uint8ClampedArrayForMemBuf[0] = 255
    // uint8ClampedArrayForMemBuf.set(new Uint8ClampedArray(sharedArrayBuffer))
    // uint8ClampedArrayForMemBuf[0] = 255
    take_pointer_by_value(ptr)
    console.log(uint8ClampedArrayForMemBuf[0])
    // debugger
    // filter_by_block(
    //   ptr,
    //   width,
    //   start,
    //   end,
    //   new Float32Array([].concat(...kernel))
    // )
    // const uint8ClampedArrayForSharedBuf = new Uint8ClampedArray(
    //   sharedArrayBuffer
    // )
    // debugger
    // uint8ClampedArrayForSharedBuf.set(uint8ClampedArrayForMemBuf)
    // debugger
  } else {
    const uint8ClampedArray = new Uint8ClampedArray(sharedArrayBuffer)
    const h = kernel.length,
      w = h
    const half = Math.floor(h / 2)

    for (let y = start + half; y < end - half; ++y) {
      for (let x = half; x < width - half; ++x) {
        const px = (y * width + x) * 4
        let r = 0,
          g = 0,
          b = 0

        for (let cy = 0; cy < h; ++cy) {
          for (let cx = 0; cx < w; ++cx) {
            const cpx = ((y + (cy - half)) * width + (x + (cx - half))) * 4
            r += uint8ClampedArray[cpx + 0] * kernel[cy][cx]
            g += uint8ClampedArray[cpx + 1] * kernel[cy][cx]
            b += uint8ClampedArray[cpx + 2] * kernel[cy][cx]
          }
        }
        uint8ClampedArray[px + 0] = r > 255 ? 255 : r < 0 ? 0 : r
        uint8ClampedArray[px + 1] = g > 255 ? 255 : g < 0 ? 0 : g
        uint8ClampedArray[px + 2] = b > 255 ? 255 : b < 0 ? 0 : b
      }
    }
  }

  postMessage({type: 'done'})
}
