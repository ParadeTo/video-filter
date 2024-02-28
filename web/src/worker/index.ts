import Worker from './worker?worker'
import Event from './event'

export class WorkerPool extends Event {
  workers: Worker[] = []
  workerNum: number

  constructor(workerNum: number) {
    super()
    this.workerNum = workerNum
    for (let i = 0; i < workerNum; i++) {
      this.workers[i] = new Worker()
      this.workers[i].onmessage = this.onMessage.bind(this)
    }
  }

  onMessage(e: MessageEvent) {
    const {
      data: {type},
    } = e
    switch (type) {
      case 'done':
        this.emit('done')
        break
      default:
        break
    }
  }

  filter({
    width,
    height,
    kernel,
    sharedArrayBuffer,
    useWasm,
  }: {
    sharedArrayBuffer?: SharedArrayBuffer
    useWasm?: boolean
    width: number
    height: number
    kernel: number[][]
  }): Promise<void> {
    return new Promise((resolve) => {
      const lineNum = Math.floor(height / this.workerNum)
      const half = Math.floor(kernel.length / 2)

      for (let i = 0; i < this.workers.length; i++) {
        const worker = this.workers[i]
        let start = i * lineNum
        let end = (i + 1) * lineNum
        if (i === this.workers.length - 1) {
          end = height
        }
        if (start !== 0) {
          start -= half
        }
        if (end !== height) {
          end += half
        }

        worker.postMessage({
          useWasm,
          sharedArrayBuffer,
          start,
          end,
          kernel,
          width,
        })
      }

      let i = 0
      this.on('done', () => {
        i++
        if (i === this.workerNum) resolve()
      })
    })
  }
}
