mod utils;

use crate::utils::set_panic_hook;
use std::ops::DerefMut;
use std::ptr;
use wasm_bindgen::prelude::*;
use wasm_bindgen::Clamped;
use web_sys::{CanvasRenderingContext2d, ImageData};

macro_rules! log {
    ( $( $t:tt )* ) => {
        web_sys::console::log_1(&format!( $( $t )* ).into());
    }
}

#[wasm_bindgen]
pub fn filter(
    ctx_hidden: &CanvasRenderingContext2d,
    ctx: &CanvasRenderingContext2d,
    width: u32,
    height: u32,
    kernel: Vec<f32>,
) {
    set_panic_hook();
    let image_data = ctx_hidden
        .get_image_data(0.0, 0.0, width as f64, height as f64)
        .unwrap();
    let mut data = image_data.data();
    let data_ref = data.deref_mut();
    let h = (kernel.len() as f64).sqrt() as u32;
    let half = h / 2;
    for y in half..(height - half) {
        for x in half..(width - half) {
            let px = ((y * width + x) * 4) as usize;
            let mut r = 0_f32;
            let mut g = 0_f32;
            let mut b = 0_f32;
            for cy in 0..h {
                for cx in 0..h {
                    let cpx = (((y + cy - half) * width + (x + cx - half)) * 4) as usize;
                    let k = kernel[(cy * h + cx) as usize];
                    r += (data_ref[cpx + 0] as f32) * k;
                    g += (data_ref[cpx + 1] as f32) * k;
                    b += (data_ref[cpx + 2] as f32) * k;
                }
            }
            data_ref[px + 0] = r as u8;
            data_ref[px + 1] = g as u8;
            data_ref[px + 2] = b as u8;
        }
    }
    let image_data =
        ImageData::new_with_u8_clamped_array_and_sh(Clamped(data_ref), width, height).unwrap();
    ctx.put_image_data(&image_data, 0.0, 0.0)
        .expect("put image data panic")
}

#[wasm_bindgen]
pub fn return_pointer() -> *mut u8 {
    ptr::null_mut()
}

#[wasm_bindgen]
pub fn take_pointer_by_value(ptr: *mut u8) {
    unsafe {
        log!("{}", *ptr);
        log!("{:p}", ptr);
        log!("{:p}", &ptr);
        *ptr.add(0) = 123
    }
}

#[wasm_bindgen]
pub fn filter_by_block(ptr: *mut u8, width: u32, start: u32, end: u32, kernel: Vec<f32>) {
    set_panic_hook();

    unsafe {
        let h = (kernel.len() as f64).sqrt() as u32;
        let half = h / 2;
        for y in (start + half)..(end - half) {
            for x in half..(width - half) {
                let px = ((y * width + x) * 4) as usize;
                let mut r = 0_f32;
                let mut g = 0_f32;
                let mut b = 0_f32;
                for cy in 0..h {
                    for cx in 0..h {
                        let cpx = (((y + cy - half) * width + (x + cx - half)) * 4) as usize;
                        let k = kernel[(cy * h + cx) as usize];
                        r += (*ptr.wrapping_add(cpx + 0) as f32) * k;
                        g += (*ptr.wrapping_add(cpx + 1) as f32) * k;
                        b += (*ptr.wrapping_add(cpx + 2) as f32) * k;
                    }
                }
                *ptr.wrapping_add(px + 0) = r as u8;
                *ptr.wrapping_add(px + 1) = g as u8;
                *ptr.wrapping_add(px + 2) = b as u8;
            }
        }
    }
}
