package main

import (
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
	// kernel := parseKernel(args[3])

	// fmt.Println(data, width, height, kernel)
	// w := len(kernel)
	// half := w / 2

	ret := make([]any, width*height*4, width*height*4)
	// for y := half; y < height-half; y++ {
	for y := 0; y < height; y++ {
		// for x := half; x < width-half; x++ {
		for x := 0; x < width; x++ {
			px := (y*width + x) * 4 // pixel index.
			// r := 0
			// g := 0
			// b := 0

			// core iteration.
			// for cy := 0; cy < w; cy++ {
			// 	for cx := 0; cx < w; cx++ {
			// 		cpx := ((y+(cy-half))*width + (x + (cx - half))) * 4
			// 		// if (px === 50216) debugger
			// 		r += int(data[cpx+0]) * kernel[cy][cx]
			// 		g += int(data[cpx+1]) * kernel[cy][cx]
			// 		b += int(data[cpx+2]) * kernel[cy][cx]
			// 		// a += data[cpx + 3] * kernel[cy][cx]
			// 	}
			// }
			// fmt.Println(r, g, b)
			// ret[px+0] = getVal(r)
			// ret[px+1] = getVal(g)
			// ret[px+2] = getVal(b)

			ret[px+0] = data[px+0]
			ret[px+1] = data[px+1]
			ret[px+2] = data[px+2]
			ret[px+3] = data[px+3]
		}

	}
	// fmt.Println(ret)

	return js.ValueOf(ret)
}

func filterByGO(this js.Value, args []js.Value) any {
	// width := args[1].Int()
	// height := args[2].Int()
	// l := width * height
	// sliceHeader := &reflect.SliceHeader{
	// 	Data: uintptr(args[0].Int()),
	// 	Len:  l * 4,
	// 	Cap:  l * 4,
	// }

	// ptr := (*[]uint8)(unsafe.Pointer(sliceHeader))
	// kernel := parseKernel(args[3])

	// fmt.Println(width, height, l*4, kernel)

	// w := len(kernel)
	// half := w / 2
	// for y := 0; y < height-half; y++ {
	// 	for x := 0; x < width-half; x++ {
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
	// 		(*ptr)[px+0] = If(r > 255, 255, If(r < 0, 0, uint8(r)))
	// 		(*ptr)[px+1] = If(g > 255, 255, If(g < 0, 0, uint8(g)))
	// 		(*ptr)[px+2] = If(b > 255, 255, If(b < 0, 0, uint8(b)))
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
