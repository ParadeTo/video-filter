import {useEffect, useRef, useState} from 'react'
import {getDrawFn, Kernel, FilterOption} from './dip'
import './App.css'

const CANVAS_WIDTH = 600

function App() {
  const setFilterOption = useRef<(val: FilterOption) => void>(() => {})
  const setKernel = useRef<(val: Kernel) => void>(() => {})
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fpsRef = useRef<HTMLSpanElement>(null)
  const loaded = useRef<boolean>(false)

  useEffect(() => {
    if (loaded.current) return
    loaded.current = true

    // @ts-ignore
    const go = new Go()
    // use the same WASM memory for all Wasm instances
    const memory = new WebAssembly.Memory({initial: 100, maximum: 1000})
    Promise.all([
      WebAssembly.instantiateStreaming(fetch('/main.wasm'), {
        env: {memory},
        ...go.importObject,
      }),
      WebAssembly.instantiateStreaming(fetch('/memory.wasm'), {
        env: {memory},
      }),
    ]).then((module) => {
      const goInstance = module[0].instance
      go.run(goInstance)
      window.wasm = {}
      window.wasm.memHelper = {
        memory,
        ...module[1].instance.exports,
      }

      const w = 2
      const h = 2
      const dataLen = w * h * 4
      const ptr = window.wasm.memHelper.malloc(dataLen)
      const mem = new Uint8ClampedArray(
        window.wasm.memHelper.memory.buffer,
        ptr,
        dataLen
      )
      mem.set(new Uint8ClampedArray([...new Array(dataLen)].fill(1)))
      const kernel = [
        [-1, -1, -1],
        [-1, 9, -1],
        [-1, -1, -1],
      ]
      window.filterByGO(ptr, w, h, kernel.flat())
      console.log(mem)
      debugger

      if (videoRef.current && canvasRef.current) {
        videoRef.current.crossOrigin = 'anonymous'
        videoRef.current.src = '/test.mp4'
        videoRef.current.play()

        videoRef.current.addEventListener('loadedmetadata', function () {
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
            setFilterOption: fn1,
            setKernel: fn2,
          } = getDrawFn(
            videoRef.current!,
            canvasRef.current!,
            goInstance,
            (fps: number) => {
              if (fpsRef.current) fpsRef.current.innerHTML = fps.toFixed(2)
            }
          )
          setFilterOption.current = fn1
          setKernel.current = fn2

          draw()
        })
      }
    })
  }, [])

  return (
    <div className='App'>
      <canvas
        width={1000}
        height={200}
        className='canvas'
        ref={canvasRef}></canvas>
      <div className='operation'>
        <h2>
          帧率：<span ref={fpsRef}></span> FPS
        </h2>
        滤镜类型：
        <select onChange={(e) => setKernel.current(e.target.value)}>
          <option value={Kernel.sharpen}>锐化</option>
          <option value={Kernel.smoothing}>平滑</option>
          <option value={Kernel.laplace}>Laplace 算子</option>
        </select>
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
          <input name='filterOption' value={FilterOption.wasm} type='radio' />
          <span className='radio-text'>
            使用 <b>[WebAssembly]</b> 滤镜
          </span>
        </div>
        {/* <button>确认</button> */}
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
