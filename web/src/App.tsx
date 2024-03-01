import {useEffect, useRef, useState} from 'react'
import {getDrawFn, Kernel, FilterOption} from './dip'
import './App.css'

const CANVAS_WIDTH = 600

function App() {
  const setFilterOption = useRef<(val: FilterOption) => void>(() => {})
  const setKernel = useRef<(val: Kernel) => void>(() => {})
  // const setUseWebWorker = useRef<(val: boolean) => void>(() => {})

  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const canvasRefHidden = useRef<HTMLCanvasElement>(null)
  const fpsRef = useRef<HTMLSpanElement>(null)
  const loaded = useRef<boolean>(false)

  useEffect(() => {
    if (loaded.current) return
    loaded.current = true

    if (videoRef.current && canvasRef.current) {
      videoRef.current.crossOrigin = 'anonymous'
      videoRef.current.src = 'test.mp4'
      videoRef.current.play()

      videoRef.current.addEventListener('loadedmetadata', function () {
        // @ts-ignore
        canvasRefHidden.current.width = CANVAS_WIDTH
        // @ts-ignore
        canvasRefHidden.current.height =
          // @ts-ignore
          (videoRef.current.videoHeight * CANVAS_WIDTH) /
          // @ts-ignore
          videoRef.current.videoWidth
        // @ts-ignore
        canvasRef.current.width = CANVAS_WIDTH
        // @ts-ignore
        canvasRef.current.height =
          // @ts-ignore
          (videoRef.current.videoHeight * CANVAS_WIDTH) /
          // @ts-ignore
          videoRef.current.videoWidth
        const {
          draw,
          // setUseWebWorker: fn3,
          setFilterOption: fn1,
          setKernel: fn2,
        } = getDrawFn(
          videoRef.current!,
          canvasRef.current!,
          canvasRefHidden.current!,
          // goInstance,
          // goInstance.exports.mem.buffer,
          (fps: number) => {
            if (fpsRef.current) fpsRef.current.innerHTML = fps.toFixed(2)
          }
        )
        setFilterOption.current = fn1
        setKernel.current = fn2
        // setUseWebWorker.current = fn3
        draw()
      })
    }

    // @ts-ignore
    // const go = new Go()
    // WebAssembly.instantiateStreaming(fetch('/main.wasm'), go.importObject).then(
    //   (result) => {
    //     const goInstance = result.instance
    //     go.run(goInstance)

    //     // const w = 100
    //     // const h = 200
    //     // const dataLen = w * h
    //     // const {internalptr: ptr} = window.initShareMemory(dataLen)
    //     // const mem = new Uint8ClampedArray(
    //     //   goInstance.exports.mem.buffer,
    //     //   ptr,
    //     //   dataLen
    //     // )
    //     // mem.set(new Uint8ClampedArray([...new Array(dataLen)].fill(1)))
    //     // const kernel = [
    //     //   [-1, -1, -1],
    //     //   [-1, 9, -1],
    //     //   [-1, -1, -1],
    //     // ]
    //     // window.filterByGO(ptr, w, h, kernel.flat())

    //   }
    // )
  }, [])

  return (
    <div className='App'>
      <canvas
        style={{position: 'absolute', opacity: 0}}
        // width={1000}
        // height={200}
        className='canvas'
        ref={canvasRefHidden}></canvas>
      <canvas
        // width={1000}
        // height={200}
        className='canvas'
        ref={canvasRef}></canvas>
      <div className='operation'>
        <h2>
          帧率：<span ref={fpsRef}></span> FPS
        </h2>
        滤镜类型：
        <select onChange={(e) => setKernel.current(e.target.value)}>
          <option value={Kernel.sharpen}>锐化</option>
          {/* <option value={Kernel.smoothing}>平滑</option> */}
          <option value={Kernel.laplace}>Laplace 算子</option>
        </select>
        {/* &nbsp;&nbsp;使用 Web Worker：
        <input
          type='checkbox'
          onChange={(e) => {
            setUseWebWorker.current(e.target.checked)
          }}
        /> */}
        <div
          className='render-container'
          onChange={(e) => {
            setFilterOption.current(e.target.value)
          }}>
          <input
            name='filterOption'
            value={FilterOption.off}
            type='radio'
            defaultChecked
          />
          <span className='radio-text'>不开启滤镜</span>
          <br />
          <input name='filterOption' value={FilterOption.js} type='radio' />
          <span className='radio-text'>
            使用 <b>[JavaScript]</b> 滤镜
          </span>
          <br />
          <input
            name='filterOption'
            value={FilterOption.jsWebworker}
            type='radio'
          />
          <span className='radio-text'>
            使用 <b>[JavaScript]</b> 滤镜 （开启 WebWorker）
          </span>
          <br />
          <input
            name='filterOption'
            value={FilterOption.wasmRust}
            type='radio'
          />
          <span className='radio-text'>
            使用 <b>[Rust WebAssembly]</b> 滤镜
          </span>
          <br />

          <input
            name='filterOption'
            value={FilterOption.wasmRustSharedMem}
            type='radio'
          />
          <span className='radio-text'>
            使用 <b>[Rust WebAssembly]</b> 滤镜（Shared Memory）
          </span>
        </div>
      </div>
      <video
        style={{display: 'none'}}
        ref={videoRef}
        className='video'
        muted
        loop
        autoPlay
      />
    </div>
  )
}

export default App
