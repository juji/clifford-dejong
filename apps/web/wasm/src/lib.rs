//------------------------------------------------------------------------------
// WebAssembly Attractor Calculator Module (Rust Implementation)
//
// This module implements Clifford and deJong attractors in Rust compiled to WebAssembly
// It provides the same functionality as the React Native native module but runs in browsers
// through WebAssembly.
//
// The module exposes:
// - Calculation functions for attractors (calculateAttractorLoop)
// - Image creation and density accumulation
//------------------------------------------------------------------------------

use wasm_bindgen::prelude::*;
use web_sys::console;

// Import the `console.log` function from the `console` module
#[wasm_bindgen]
extern "C" {
    #[wasm_bindgen(js_namespace = console)]
    fn log(s: &str);
}

// Define a macro for console logging
macro_rules! console_log {
    ($($t:tt)*) => (log(&format_args!($($t)*).to_string()))
}

// Represents an RGB color
#[derive(Debug, Clone)]
pub struct RGB {
    pub r: i32,
    pub g: i32,
    pub b: i32,
}

// Attractor parameters structure
#[derive(Debug, Clone)]
pub struct AttractorParameters {
    pub attractor: String,
    pub a: f64,
    pub b: f64,
    pub c: f64,
    pub d: f64,
    pub hue: f64,
    pub saturation: f64,
    pub brightness: f64,
    pub background: Vec<i32>,
    pub scale: f64,
    pub left: f64,
    pub top: f64,
}

// Version information
const VERSION: &str = "2.0.1";

// Bezier easing function implementation
pub fn bezier_easing(p0: f64, p1: f64, p2: f64, p3: f64) -> impl Fn(f64) -> f64 {
    move |x: f64| -> f64 {
        if x <= 0.0 {
            return 0.0;
        }
        if x >= 1.0 {
            return 1.0;
        }

        let a = |aa1: f64, aa2: f64| 1.0 - 3.0 * aa2 + 3.0 * aa1;
        let b = |aa1: f64, aa2: f64| 3.0 * aa2 - 6.0 * aa1;
        let c = |aa1: f64| 3.0 * aa1;

        let calc_bezier = |t: f64, aa1: f64, aa2: f64| {
            ((a(aa1, aa2) * t + b(aa1, aa2)) * t + c(aa1)) * t
        };

        let get_slope = |t: f64, aa1: f64, aa2: f64| {
            3.0 * a(aa1, aa2) * t * t + 2.0 * b(aa1, aa2) * t + c(aa1)
        };

        let get_t_for_x = |ax: f64| -> f64 {
            let mut a_guess_t = ax;
            for _ in 0..4 {
                let current_slope = get_slope(a_guess_t, p0, p2);
                if current_slope == 0.0 {
                    return a_guess_t;
                }
                let current_x = calc_bezier(a_guess_t, p0, p2) - ax;
                a_guess_t -= current_x / current_slope;
            }
            a_guess_t
        };

        calc_bezier(get_t_for_x(x), p1, p3)
    }
}

// Convert HSV to RGB
pub fn hsv_to_rgb(h: f64, s: f64, v: f64) -> RGB {
    // Clamp input values to valid ranges
    let h = h.max(0.0).min(359.0);
    let s = s.max(0.0).min(100.0);
    let v = v.max(0.0).min(100.0);

    // Normalize s and v to 0-1 range
    let s = s / 100.0;
    let v = v / 100.0;

    // Handle grayscale case (s === 0)
    if s == 0.0 {
        let val = (v * 255.0).round() as i32;
        return RGB { r: val, g: val, b: val };
    }

    // Convert hue to sector (0-5)
    let h = h / 60.0;
    let i = h.floor() as i32;
    let f = h - h.floor();

    // Calculate color components
    let p = v * (1.0 - s);
    let q = v * (1.0 - s * f);
    let t = v * (1.0 - s * (1.0 - f));

    let (r, g, b) = match i {
        0 => (v, t, p),
        1 => (q, v, p),
        2 => (p, v, t),
        3 => (p, q, v),
        4 => (t, p, v),
        _ => (v, p, q), // Handles case 5 and any overflow
    };

    RGB {
        r: (r * 255.0).round() as i32,
        g: (g * 255.0).round() as i32,
        b: (b * 255.0).round() as i32,
    }
}

// Get color data for a pixel based on density
pub fn get_color_data(
    density: f64,
    max_density: f64,
    h: f64,
    s: f64,
    v: f64,
    progress: f64,
    background: &[i32],
) -> u32 {
    if density <= 0.0 {
        return 0;
    }

    let max_density = if max_density <= 1.0 { 1.01 } else { max_density };

    let saturation_bezier = bezier_easing(0.79, -0.34, 0.54, 1.18);
    let density_bezier = bezier_easing(0.75, 0.38, 0.24, 1.33);
    let opacity_bezier = bezier_easing(0.24, 0.27, 0.13, 0.89);

    let mdens = max_density.ln();
    let pdens = density.ln();

    let sat_factor = (saturation_bezier(pdens / mdens)).max(0.0).min(1.0);
    let rgb = hsv_to_rgb(h, s - sat_factor * s, v);

    let density_alpha = (density_bezier(pdens / mdens)).max(0.0).min(1.0);

    let bg_r = background.get(0).copied().unwrap_or(0);
    let bg_g = background.get(1).copied().unwrap_or(0);
    let bg_b = background.get(2).copied().unwrap_or(0);

    let blended_r = (rgb.r as f64 * density_alpha + bg_r as f64 * (1.0 - density_alpha)).round() as u32;
    let blended_g = (rgb.g as f64 * density_alpha + bg_g as f64 * (1.0 - density_alpha)).round() as u32;
    let blended_b = (rgb.b as f64 * density_alpha + bg_b as f64 * (1.0 - density_alpha)).round() as u32;

    let effective_progress = if progress <= 0.0 { 1.0 } else { progress };
    let alpha = (opacity_bezier(effective_progress) * 255.0).round() as u32;

    (alpha << 24) | (blended_b << 16) | (blended_g << 8) | blended_r
}

// Get low quality point color
pub fn get_low_quality_point(hue: f64, saturation: f64, brightness: f64) -> u32 {
    let rgb = hsv_to_rgb(hue, saturation, brightness);
    (255 << 24) | ((rgb.b as u32) << 16) | ((rgb.g as u32) << 8) | (rgb.r as u32)
}

// Apply smoothing to coordinates
pub fn smoothing(num: f64, scale: f64) -> f64 {
    let factor = 0.2;
    let random_offset = if js_sys::Math::random() < 0.5 { -factor } else { factor };
    num + random_offset * (1.0 / scale)
}

// Clifford attractor function
pub fn clifford(x: f64, y: f64, a: f64, b: f64, c: f64, d: f64) -> (f64, f64) {
    (
        (a * y).sin() + c * (a * x).cos(),
        (b * x).sin() + d * (b * y).cos(),
    )
}

// DeJong attractor function
pub fn dejong(x: f64, y: f64, a: f64, b: f64, c: f64, d: f64) -> (f64, f64) {
    (
        (a * y).sin() - (b * x).cos(),
        (c * x).sin() - (d * y).cos(),
    )
}

// Context for accumulating density
pub struct AccumulationContext<'a> {
    pub density_array: &'a mut Vec<u32>,
    pub x: f64,
    pub y: f64,
    pub points_to_calculate: i32,
    pub width: i32,
    pub height: i32,
    pub attractor_params: &'a AttractorParameters,
    pub center_x: f64,
    pub center_y: f64,
    pub update_progress: bool,
}

// Accumulate density data
pub fn accumulate_density(
    context: &mut AccumulationContext,
    info_array: &mut [u32],
    attractor_fn: fn(f64, f64, f64, f64, f64, f64) -> (f64, f64),
) {
    let mut i = 0;
    let density_size = (context.width * context.height) as usize;
    let mut x = context.x;
    let mut y = context.y;

    while i < context.points_to_calculate && info_array[1] == 0 {
        let (next_x, next_y) = attractor_fn(
            x,
            y,
            context.attractor_params.a,
            context.attractor_params.b,
            context.attractor_params.c,
            context.attractor_params.d,
        );

        x = smoothing(next_x, context.attractor_params.scale);
        y = smoothing(next_y, context.attractor_params.scale);

        let screen_x = x * context.attractor_params.scale;
        let screen_y = y * context.attractor_params.scale;
        let px = (context.center_x + screen_x).floor() as i32;
        let py = (context.center_y + screen_y).floor() as i32;

        if px >= 0 && px < context.width && py >= 0 && py < context.height {
            let idx = (py * context.width + px) as usize;
            if idx < density_size {
                context.density_array[idx] += 1;
                let new_val = context.density_array[idx];

                if new_val > info_array[0] {
                    info_array[0] = new_val;
                }
            }
        }

        i += 1;

        if context.update_progress && (i % 100000 == 0 || i == context.points_to_calculate - 1) {
            let new_progress = ((i as f64 / context.points_to_calculate as f64) * 100.0) as u32;
            if new_progress != info_array[3] {
                info_array[3] = new_progress;
            }
        }
    }
}

// Context for image data creation
pub struct ImageDataCreationContext<'a> {
    pub image_array: &'a mut Vec<u32>,
    pub image_size: usize,
    pub density_array: &'a mut Vec<u32>,
    pub high_quality: bool,
    pub attractor_params: &'a AttractorParameters,
}

// Create image data from density data
pub fn create_image_data(
    context: &mut ImageDataCreationContext,
    info_array: &[u32],
) {
    let bg_color = if !context.attractor_params.background.is_empty() {
        let bg_a = context.attractor_params.background.get(3).copied().unwrap_or(255) as u32;
        let bg_b = context.attractor_params.background.get(2).copied().unwrap_or(0) as u32;
        let bg_g = context.attractor_params.background.get(1).copied().unwrap_or(0) as u32;
        let bg_r = context.attractor_params.background[0] as u32;
        (bg_a << 24) | (bg_b << 16) | (bg_g << 8) | bg_r
    } else {
        0
    };

    if info_array[1] != 0 {
        return;
    }

    for i in 0..context.image_size {
        if info_array[1] != 0 {
            break;
        }

        let dval = context.density_array[i];

        if dval > 0 {
            let color_data = if context.high_quality {
                get_color_data(
                    dval as f64,
                    info_array[0].max(1) as f64,
                    context.attractor_params.hue,
                    context.attractor_params.saturation,
                    context.attractor_params.brightness,
                    1.0,
                    &context.attractor_params.background,
                )
            } else {
                get_low_quality_point(
                    context.attractor_params.hue,
                    context.attractor_params.saturation,
                    context.attractor_params.brightness,
                )
            };
            context.image_array[i] = color_data;
        } else {
            context.image_array[i] = bg_color;
        }
    }
}

// Helper function to extract attractor parameters from JsValue
fn extract_attractor_parameters(js_params: &JsValue) -> Result<AttractorParameters, JsValue> {
    let obj = js_sys::Object::from(js_params.clone());
    
    let attractor = js_sys::Reflect::get(&obj, &"attractor".into())?
        .as_string()
        .ok_or("attractor must be a string")?;
    
    let a = js_sys::Reflect::get(&obj, &"a".into())?
        .as_f64()
        .ok_or("a must be a number")?;
    
    let b = js_sys::Reflect::get(&obj, &"b".into())?
        .as_f64()
        .ok_or("b must be a number")?;
    
    let c = js_sys::Reflect::get(&obj, &"c".into())?
        .as_f64()
        .ok_or("c must be a number")?;
    
    let d = js_sys::Reflect::get(&obj, &"d".into())?
        .as_f64()
        .ok_or("d must be a number")?;
    
    let hue = js_sys::Reflect::get(&obj, &"hue".into())?
        .as_f64()
        .unwrap_or(0.0);
    
    let saturation = js_sys::Reflect::get(&obj, &"saturation".into())?
        .as_f64()
        .unwrap_or(100.0);
    
    let brightness = js_sys::Reflect::get(&obj, &"brightness".into())?
        .as_f64()
        .unwrap_or(100.0);
    
    let scale = js_sys::Reflect::get(&obj, &"scale".into())?
        .as_f64()
        .ok_or("scale must be a number")?;
    
    let left = js_sys::Reflect::get(&obj, &"left".into())?
        .as_f64()
        .ok_or("left must be a number")?;
    
    let top = js_sys::Reflect::get(&obj, &"top".into())?
        .as_f64()
        .ok_or("top must be a number")?;
    
    let background_js = js_sys::Reflect::get(&obj, &"background".into())?;
    let background = if background_js.is_array() {
        let arr = js_sys::Array::from(&background_js);
        let mut bg = Vec::new();
        for i in 0..arr.length() {
            if let Some(val) = arr.get(i).as_f64() {
                bg.push(val as i32);
            }
        }
        bg
    } else {
        vec![0, 0, 0, 255]
    };

    Ok(AttractorParameters {
        attractor,
        a,
        b,
        c,
        d,
        hue,
        saturation,
        brightness,
        background,
        scale,
        left,
        top,
    })
}

// Main calculateAttractorLoop function exported to JavaScript
#[wasm_bindgen]
pub fn calculate_attractor_loop(js_ctx: &JsValue) -> Result<JsValue, JsValue> {
    let ctx_obj = js_sys::Object::from(js_ctx.clone());
    
    // Extract context parameters
    let attractor_params_js = js_sys::Reflect::get(&ctx_obj, &"attractorParams".into())?;
    let attractor_params = extract_attractor_parameters(&attractor_params_js)?;
    
    let high_quality = js_sys::Reflect::get(&ctx_obj, &"highQuality".into())?
        .as_bool()
        .unwrap_or(false);
    
    let points_to_calculate = js_sys::Reflect::get(&ctx_obj, &"pointsToCalculate".into())?
        .as_f64()
        .ok_or("pointsToCalculate must be a number")? as i32;
    
    let width = js_sys::Reflect::get(&ctx_obj, &"width".into())?
        .as_f64()
        .ok_or("width must be a number")? as i32;
    
    let height = js_sys::Reflect::get(&ctx_obj, &"height".into())?
        .as_f64()
        .ok_or("height must be a number")? as i32;
    
    let x = js_sys::Reflect::get(&ctx_obj, &"x".into())?
        .as_f64()
        .unwrap_or(0.0);
    
    let y = js_sys::Reflect::get(&ctx_obj, &"y".into())?
        .as_f64()
        .unwrap_or(0.0);
    
    let loop_num = js_sys::Reflect::get(&ctx_obj, &"loopNum".into())?
        .as_f64()
        .ok_or("loopNum must be a number")? as i32;
    
    let draw_at = js_sys::Reflect::get(&ctx_obj, &"drawAt".into())?
        .as_f64()
        .ok_or("drawAt must be a number")? as i32;

    // Get buffer references
    let image_buffer = js_sys::Reflect::get(&ctx_obj, &"imageBuffer".into())?;
    let info_buffer = js_sys::Reflect::get(&ctx_obj, &"infoBuffer".into())?;

    // Create typed array views
    let image_array = js_sys::Uint32Array::new(&image_buffer);
    let info_array = js_sys::Uint32Array::new(&info_buffer);

    // Get attractor function
    let attractor_fn: fn(f64, f64, f64, f64, f64, f64) -> (f64, f64) = match attractor_params.attractor.as_str() {
        "clifford" => clifford,
        "dejong" => dejong,
        _ => return Err(format!("Invalid attractor type: {}. Must be 'clifford' or 'dejong'.", attractor_params.attractor).into()),
    };

    // Initialize calculation variables
    let center_x = width as f64 / 2.0 + attractor_params.left * width as f64;
    let center_y = height as f64 / 2.0 + attractor_params.top * height as f64;
    let points_per_loop = points_to_calculate / loop_num;

    // Create local arrays for computation
    let mut density_array = vec![0u32; (width * height) as usize];
    let mut image_array_local = vec![0u32; (width * height) as usize];
    let mut info_array_local = vec![0u32; info_array.length() as usize];

    // Copy initial info array state
    for i in 0..info_array.length() {
        info_array_local[i as usize] = info_array.get_index(i);
    }

    let mut total_loop = 0;
    let mut num = 0;

    while num < loop_num {

        {
            let mut accumulation_context = AccumulationContext {
                density_array: &mut density_array,
                x,
                y,
                points_to_calculate: points_per_loop,
                width,
                height,
                attractor_params: &attractor_params,
                center_x,
                center_y,
                update_progress: false,
            };

            accumulate_density(&mut accumulation_context, &mut info_array_local, attractor_fn);
        }

        if info_array.get_index(1) != 0 {
            break;
        }

        if (total_loop % draw_at) == 0 || num == loop_num - 1 {
            let mut img_context = ImageDataCreationContext {
                image_array: &mut image_array_local,
                image_size: (width * height) as usize,
                density_array: &mut density_array,
                high_quality,
                attractor_params: &attractor_params,
            };

            create_image_data(&mut img_context, &info_array_local);

            // Copy image data to JavaScript array
            for i in 0..img_context.image_size {
                image_array.set_index(i as u32, img_context.image_array[i]);
            }
        }

        if info_array.get_index(1) != 0 {
            break;
        }

        total_loop += points_per_loop;
        num += 1;

        // Update progress
        let progress = ((num as f64 / loop_num as f64) * 100.0) as u32;
        info_array.set_index(3, progress);

        // Copy cancellation flag
        info_array_local[1] = info_array.get_index(1);
    }

    // Create result object
    let result = js_sys::Object::new();

    Ok(result.into())
}

// Get build version
#[wasm_bindgen]
pub fn get_build_number() -> String {
    console::log_1(&"Rust WebAssembly: Getting build number".into());
    VERSION.to_string()
}

// Export the module
#[wasm_bindgen]
pub fn init() {
    console_log!("Rust WebAssembly Attractor Calculator initialized");
}
