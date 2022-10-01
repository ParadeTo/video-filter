package main

import (
	"fmt"
	"syscall/js"
	"unsafe"
)

func parseKernel(kernel js.Value) [3][3]int {
	var arr [3][3]int
	for i := 0; i < 3; i++ {
		for j := 0; j < 3; j++ {
			arr[i][j] = kernel.Index(i*3 + j).Int()
		}
	}
	return arr
}

func copyBytesToGo(value js.Value) []byte {
	len := value.Get("byteLength").Int()
	fmt.Println(len)
	data := make([]byte, len)
	js.CopyBytesToGo(data, value)
	return data
}

func initShareMemory(this js.Value, args []js.Value) any {
	len := args[0].Int()
	buffer := make([]uint8, len)
	boxedPtr := unsafe.Pointer(&buffer)
	boxedPtrMap := map[string]interface{}{
		"internalptr": boxedPtr,
	}
	return js.ValueOf(boxedPtrMap)
}

func getVal(val int) uint8 {
	if val > 255 {
		return 255
	} else {
		if val < 0 {
			return 0
		}
		return uint8(val)
	}
}

func filterByGOCopy(this js.Value, args []js.Value) any {
	data := copyBytesToGo(args[0])
	width := args[1].Int()
	height := args[2].Int()
	l := width * height
	kernel := parseKernel(args[3])

	fmt.Println(len(data), width, height, l*4, kernel)
	w := len(kernel)
	half := w / 2

	var ret []any
	for y := 0; y < height-half; y++ {
		for x := 0; x < width-half; x++ {
			px := (y*width + x) * 4 // pixel index.
			r := 0
			g := 0
			b := 0

			// core iteration.
			for cy := 0; cy < w; cy++ {
				for cx := 0; cx < w; cx++ {
					cpx := ((y+(cy-half))*width + (x + (cx - half))) * 4
					// if (px === 50216) debugger
					r += int(data[cpx+0]) * kernel[cy][cx]
					g += int(data[cpx+1]) * kernel[cy][cx]
					b += int(data[cpx+2]) * kernel[cy][cx]
					// a += data[cpx + 3] * kernel[cy][cx]
				}
			}
			(ret)[px+0] = getVal(r)
			(ret)[px+1] = getVal(g)
			(ret)[px+2] = getVal(b)
		}

	}
	return js.ValueOf(ret)
}

func filterByGO(this js.Value, args []js.Value) any {
	width := args[1].Int()
	height := args[2].Int()
	size := width * height * 4
	// sliceHeader := &reflect.SliceHeader{
	// 	Data: uintptr(args[0].Int()),
	// 	Len:  size,
	// 	Cap:  size,
	// }

	// ptr := (*[]uint8)(unsafe.Pointer(sliceHeader))
	// kernel := parseKernel(args[3])

	data := (*[1 << 30]byte)(unsafe.Pointer(uintptr(args[0].Int())))[:size:size]
	data[0] = 255
	data[1] = 255
	fmt.Println(data)
	// w := len(kernel)
	// half := w / 2
	// for y := half; y < height-half; y++ {
	// 	for x := half; x < width-half; x++ {
	// 		px := (y*width + x) * 4 // pixel index.
	// 		r := 0
	// 		g := 0
	// 		b := 0

	// 		// core iteration.
	// 		for cy := 0; cy < w; cy++ {
	// 			for cx := 0; cx < w; cx++ {
	// 				cpx := ((y+(cy-half))*width + (x + (cx - half))) * 4
	// 				// if (px === 50216) debugger
	// 				r += int((*ptr)[cpx+0]) * kernel[cy][cx]
	// 				g += int((*ptr)[cpx+1]) * kernel[cy][cx]
	// 				b += int((*ptr)[cpx+2]) * kernel[cy][cx]
	// 				// a += data[cpx + 3] * kernel[cy][cx]
	// 			}
	// 		}

	// 		(*ptr)[px+0] = 0   //getVal(r)
	// 		(*ptr)[px+1] = 0   //getVal(g)
	// 		(*ptr)[px+2] = 255 //getVal(b)
	// 		(*ptr)[px+3] = 254 //getVal(b)
	// 		// fmt.Println((*ptr)[px : px+3])
	// 	}
	// }

	// var a []any = []any{data}
	// width := args[1].Int()
	// height := args[2].Int()
	// kernel := oneDTo2D(copyBytesToGo(args[3]))

	// fmt.Println("+++++++++++++")
	// fmt.Println(data[0:10], width, height, kernel)
	// b := js.ValueOf(a)
	// fmt.Println(b)
	return 1 //js.ValueOf(unsafe.Pointer(ptr))
}

func main() {
	quit := make(chan interface{})
	js.Global().Set("filterByGO", js.FuncOf(filterByGO))
	js.Global().Set("filterByGOCopy", js.FuncOf(filterByGOCopy))
	js.Global().Set("initShareMemory", js.FuncOf(initShareMemory))
	<-quit
}
