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
    if (videoRef.current && canvasRef.current && !loaded.current) {
      loaded.current = true
      videoRef.current.crossOrigin = 'anonymous'
      videoRef.current.src = '/test.mp4'
      videoRef.current.play()

      const {
        draw,
        setFilterOption: fn1,
        setKernel: fn2,
      } = getDrawFn(videoRef.current, canvasRef.current, (fps: number) => {
        if (fpsRef.current) fpsRef.current.innerHTML = fps.toFixed(2)
      })

      setFilterOption.current = fn1
      setKernel.current = fn2
      videoRef.current.addEventListener('loadedmetadata', function () {
        // @ts-ignore
        canvasRef.current.width = CANVAS_WIDTH
        // @ts-ignore
        canvasRef.current.height =
          // @ts-ignore
          (videoRef.current.videoHeight * CANVAS_WIDTH) /
          // @ts-ignore
          videoRef.current.videoWidth
        draw()
      })
    }
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
