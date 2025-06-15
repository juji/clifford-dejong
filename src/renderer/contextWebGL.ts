import { type Options } from '@/state';
// Import shader source code as strings using Vite's raw loader
import passthroughVertShaderSource from './shaders/passthrough.vert?raw';
import calculatorFragShaderSource from './shaders/calculator.frag?raw';
import pointVertShaderSource from './shaders/point.vert?raw'; // New point vertex shader
import pointFragShaderSource from './shaders/point.frag?raw';   // New point fragment shader

// --- Constants ---
const NUM_POINTS = 1024 * 1024; // Ensure this is defined *before* the class
const POINTS_TEXTURE_SIZE = 1024;
const DEFAULT_MAX_ITT = 200;
const LARGE_SCREEN_MAX_ITT = 1000;
const LARGE_SCREEN_THRESHOLD_WIDTH = 1920;
const BASE_SCALE = 150;

// --- Shaders ---

// Helper function to check and log GL errors
function checkGLError(gl: WebGLRenderingContext | WebGL2RenderingContext, location: string) {
    const error = gl.getError();
    if (error !== gl.NO_ERROR) {
        let errorString = "UNKNOWN_ERROR";
        switch(error) {
            case gl.INVALID_ENUM: errorString = "INVALID_ENUM"; break;
            case gl.INVALID_VALUE: errorString = "INVALID_VALUE"; break;
            case gl.INVALID_OPERATION: errorString = "INVALID_OPERATION"; break;
            case gl.INVALID_FRAMEBUFFER_OPERATION: errorString = "INVALID_FRAMEBUFFER_OPERATION"; break;
            case gl.OUT_OF_MEMORY: errorString = "OUT_OF_MEMORY"; break;
            case gl.CONTEXT_LOST_WEBGL: errorString = "CONTEXT_LOST_WEBGL"; break;
        }
        console.error(`WebGL Error (${errorString}) detected at: ${location}`);
    }
    return error !== gl.NO_ERROR;
}

/** Compiles a shader from source */
function compileShader(gl: WebGLRenderingContext, type: number, source: string): WebGLShader | null {
  const shader = gl.createShader(type);
  if (!shader) {
    console.error('Unable to create shader');
    return null;
  }
  gl.shaderSource(shader, source);
  gl.compileShader(shader);

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error(`An error occurred compiling the shaders: ${gl.getShaderInfoLog(shader)}`);
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

/** Links vertex and fragment shaders into a program */
function linkProgram(gl: WebGLRenderingContext, vsSource: string, fsSource: string): WebGLProgram | null {
  const vertexShader = compileShader(gl, gl.VERTEX_SHADER, vsSource);
  const fragmentShader = compileShader(gl, gl.FRAGMENT_SHADER, fsSource);

  if (!vertexShader || !fragmentShader) {
    return null; // Error logged in compileShader
  }

  const shaderProgram = gl.createProgram();
  if (!shaderProgram) {
    console.error('Unable to create shader program');
    gl.deleteShader(vertexShader);
    gl.deleteShader(fragmentShader);
    return null;
  }
  gl.attachShader(shaderProgram, vertexShader);
  gl.attachShader(shaderProgram, fragmentShader);
  gl.linkProgram(shaderProgram);

  if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
    console.error(`Unable to initialize the shader program: ${gl.getProgramInfoLog(shaderProgram)}`);
    gl.deleteProgram(shaderProgram);
    gl.deleteShader(vertexShader);
    gl.deleteShader(fragmentShader);
    return null;
  }

  // Shaders are linked, no longer need the individual shader objects
  gl.detachShader(shaderProgram, vertexShader);
  gl.detachShader(shaderProgram, fragmentShader);
  gl.deleteShader(vertexShader);
  gl.deleteShader(fragmentShader);

  return shaderProgram;
}

// Define interfaces for uniform/attribute locations for better type safety
interface CalcLocations {
  positionAttribute: number;
  // Add uniforms for calculator.frag (e.g., resolution, parameters, previous state texture)
  resolutionUniform: WebGLUniformLocation | null;
  prevStateTextureUniform: WebGLUniformLocation | null;
  paramsUniform: WebGLUniformLocation | null; // For a, b, c, d
  attractorTypeUniform: WebGLUniformLocation | null; // Added
}

// Updated for point rendering program
interface PointRenderLocations {
  pointIndexAttribute: number; // Changed from positionAttribute
  positionTextureUniform: WebGLUniformLocation | null;
  textureSizeUniform: WebGLUniformLocation | null;
  canvasResolutionUniform: WebGLUniformLocation | null;
  pointSizeUniform: WebGLUniformLocation | null;
  scaleUniform: WebGLUniformLocation | null;
  translateUniform: WebGLUniformLocation | null;
  hsvColorUniform: WebGLUniformLocation | null;
  alphaUniform: WebGLUniformLocation | null;
}

export class ContextWebGL {
  private gl: WebGLRenderingContext | WebGL2RenderingContext;
  private options: Options;
  private width: number;
  private height: number;
  private paused: boolean = false;
  private animFrameId: number = 0;

  // WebGL Programs
  private calcProgram: WebGLProgram | null = null;
  private pointProgram: WebGLProgram | null = null; // Renamed from renderProgram

  // Locations
  private calcLocations: CalcLocations | null = null;
  private pointRenderLocations: PointRenderLocations | null = null; // Renamed

  // Buffers
  private quadVertexBuffer: WebGLBuffer | null = null;
  private pointIndexBuffer: WebGLBuffer | null = null; // New buffer for point indices

  // Textures (for ping-ponging point positions)
  private positionTextureA: WebGLTexture | null = null;
  private positionTextureB: WebGLTexture | null = null;
  private readTexture: WebGLTexture | null = null;
  private writeTexture: WebGLTexture | null = null;

  // Framebuffer Objects (FBOs)
  private fboA: WebGLFramebuffer | null = null;
  private fboB: WebGLFramebuffer | null = null;
  private writeFBO: WebGLFramebuffer | null = null;

  // Extensions
  private floatTexturesExt: OES_texture_float | null = null;

  // Iteration tracking
  private itt: number = 0;
  private maxItt: number = DEFAULT_MAX_ITT; // Initialize with default

  // Callbacks
  private onProgress: ((n: number) => void) | null = null;
  private onFinish: (() => void) | null = null;
  private onStart: (() => void) | null = null;

  constructor(
    canvas: HTMLCanvasElement,
    options: Options,
    setProgress: (num: number) => void,
    setFinish?: () => void,
    setStart?: () => void
  ) {
    // --- Get Context ---
    const glContext = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (!glContext) {
      throw new Error('WebGL not supported');
    }
    // Explicitly cast during assignment
    this.gl = glContext as (WebGLRenderingContext | WebGL2RenderingContext);
    checkGLError(this.gl, 'Context Creation');

    this.options = options;
    this.width = canvas.width;
    this.height = canvas.height;
    this.onProgress = setProgress;
    this.onFinish = setFinish || null;
    this.onStart = setStart || null;

    console.log('Initializing WebGL Context...');

    // --- Check for Extensions ---
    this.floatTexturesExt = this.gl.getExtension('OES_texture_float');
    if (!this.floatTexturesExt) {
        // Check for WebGL2 support for float textures
        if (!(this.gl instanceof WebGL2RenderingContext && this.gl.getExtension('EXT_color_buffer_float'))) {
            throw new Error('Floating point textures not supported. Needed for calculations.');
        }
        console.log('Using WebGL2 float texture support.');
    } else {
        console.log('Using OES_texture_float extension.');
    }
    checkGLError(this.gl, 'After Extensions');

    // --- Initialize Shaders and Programs ---
    console.log('Compiling and linking calculation program...');
    this.calcProgram = linkProgram(this.gl, passthroughVertShaderSource, calculatorFragShaderSource);
    if (!this.calcProgram) {
        throw new Error('Failed to link calculation shader program.');
    }

    console.log('Compiling and linking rendering program...');
    this.pointProgram = linkProgram(this.gl, pointVertShaderSource, pointFragShaderSource); // Use new shaders
    if (!this.pointProgram) { // Check new program
        throw new Error('Failed to link rendering shader program.');
    }
    console.log('WebGL Programs linked successfully.');

    // --- Get Attribute/Uniform Locations ---
    this.getLocations();
    checkGLError(this.gl, 'After Get Locations');
    if (!this.calcLocations || !this.pointRenderLocations) { // Check new locations
        throw new Error('Failed to get shader locations.');
    }
    console.log('Shader locations retrieved.');

    // --- Setup Buffers ---
    this.setupBuffers(); // Will now create pointIndexBuffer too
    checkGLError(this.gl, 'After Setup Buffers');
    if (!this.quadVertexBuffer || !this.pointIndexBuffer) { // Check new buffer
        throw new Error('Failed to setup buffers.');
    }
    console.log('WebGL buffers created.');

    // --- Setup Textures & Framebuffers ---
    this.setupTextures(); // Implement this
    checkGLError(this.gl, 'After Setup Textures');
    this.setupFramebuffers(); // Implement this
    checkGLError(this.gl, 'After Setup Framebuffers');
    if (!this.positionTextureA || !this.positionTextureB || !this.fboA || !this.fboB) {
        throw new Error('Failed to setup textures or framebuffers.');
    }
    console.log('WebGL textures and framebuffers created.');

    // --- Setup Initial GL State ---
    this.gl.viewport(0, 0, this.width, this.height);
    // Set clear color from options (assuming options.background is [r, g, b] 0-255)
    const [r, g, b] = this.options.background;
    this.gl.clearColor(r / 255, g / 255, b / 255, 1.0);
    this.gl.clear(this.gl.COLOR_BUFFER_BIT);
    console.log('Initial WebGL state set.');

    // --- Setup Initial GL State & Ping-Pong ---
    // Set initial ping-pong state
    this.readTexture = this.positionTextureA;
    this.writeTexture = this.positionTextureB;
    this.writeFBO = this.fboB;
    checkGLError(this.gl, 'After Initial GL State');

    // --- Set Initial Max Iterations ---
    this.updateMaxIterations(); // Implement this

    // --- Update Uniforms ---
    this.updateAllUniforms(); // Set initial uniforms
    checkGLError(this.gl, 'After Initial Uniforms');

    // --- Start Rendering ---
    this.onStart && this.onStart();
    this.startRenderingLoop();
  }

  /** Gets attribute and uniform locations from the shader programs */
  private getLocations(): void {
    if (!this.calcProgram || !this.pointProgram) return;
    const gl = this.gl;

    this.calcLocations = {
        positionAttribute: gl.getAttribLocation(this.calcProgram, 'a_position'),
        resolutionUniform: gl.getUniformLocation(this.calcProgram, 'u_resolution'),
        prevStateTextureUniform: gl.getUniformLocation(this.calcProgram, 'u_prevState'),
        paramsUniform: gl.getUniformLocation(this.calcProgram, 'u_params'), // Assuming vec4 for a,b,c,d
        attractorTypeUniform: gl.getUniformLocation(this.calcProgram, 'u_attractorType') // Added
    };

    // Get locations for the point rendering program
    this.pointRenderLocations = {
        pointIndexAttribute: gl.getAttribLocation(this.pointProgram, 'a_pointIndex'),
        positionTextureUniform: gl.getUniformLocation(this.pointProgram, 'u_positionTexture'),
        textureSizeUniform: gl.getUniformLocation(this.pointProgram, 'u_textureSize'),
        canvasResolutionUniform: gl.getUniformLocation(this.pointProgram, 'u_canvasResolution'),
        pointSizeUniform: gl.getUniformLocation(this.pointProgram, 'u_pointSize'),
        scaleUniform: gl.getUniformLocation(this.pointProgram, 'u_scale'),
        translateUniform: gl.getUniformLocation(this.pointProgram, 'u_translate'),
        hsvColorUniform: gl.getUniformLocation(this.pointProgram, 'u_hsvColor'),
        alphaUniform: gl.getUniformLocation(this.pointProgram, 'u_alpha')
    };

    // Basic check (could be more thorough)
    if (this.calcLocations.positionAttribute < 0 || this.pointRenderLocations.pointIndexAttribute < 0) {
        console.error('Failed to get attribute locations.');
        this.calcLocations = null;
        this.pointRenderLocations = null;
    }
  }

  /** Sets up necessary WebGL buffers */
  private setupBuffers(): void {
    const gl = this.gl;

    // Create a buffer for a simple quad that covers the entire screen
    // The vertex shader will map these coordinates to clip space.
    this.quadVertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.quadVertexBuffer);

    // Define vertices for two triangles covering the quad
    // (x, y) pairs
    const positions = [
      -1.0,  1.0,  // Top-left
      -1.0, -1.0,  // Bottom-left
       1.0,  1.0,  // Top-right
       1.0, -1.0,  // Bottom-right
    ];

    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

    // --- Point Index Buffer (for rendering step) ---
    const indices = new Float32Array(NUM_POINTS);
    for (let i = 0; i < NUM_POINTS; i++) {
        indices[i] = i;
    }
    this.pointIndexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.pointIndexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, indices, gl.STATIC_DRAW);

    gl.bindBuffer(gl.ARRAY_BUFFER, null); // Unbind
  }

  /** Sets up the textures needed for position storage and ping-ponging */
  private setupTextures(): void {
    const gl = this.gl;
    const initialData = this.createInitialPositionData();

    this.positionTextureA = this.createAndSetupTexture(initialData);
    // Create texture B initially empty (or with zeros)
    this.positionTextureB = this.createAndSetupTexture(new Float32Array(NUM_POINTS * 4));

    // Unbind texture after setup
    gl.bindTexture(gl.TEXTURE_2D, null);
  }

  /** Creates and configures a single floating-point texture */
  private createAndSetupTexture(initialData: Float32Array | null): WebGLTexture | null {
    const gl = this.gl;
    const texture = gl.createTexture();
    if (!texture) {
        console.error("Failed to create texture");
        return null;
    }
    gl.bindTexture(gl.TEXTURE_2D, texture);

    // Set texture parameters
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST); // Use NEAREST for data textures
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

    // Upload the texture data
    gl.texImage2D(
        gl.TEXTURE_2D,
        0,                     // level
        (gl instanceof WebGL2RenderingContext) ? gl.RGBA32F : gl.RGBA, // internal format (use high precision float if WebGL2)
        POINTS_TEXTURE_SIZE,   // width
        POINTS_TEXTURE_SIZE,   // height
        0,                     // border (must be 0)
        gl.RGBA,               // format
        gl.FLOAT,              // type (requires OES_texture_float or WebGL2/EXT_color_buffer_float)
        initialData            // data
    );

    checkGLError(gl, 'Texture Creation/Setup');
    return texture;
  }

  /** Generates initial random positions for the points */
  private createInitialPositionData(): Float32Array {
    const data = new Float32Array(NUM_POINTS * 4); // RGBA for each point
    for (let i = 0; i < NUM_POINTS; i++) {
        // Initial positions spread randomly around the center (-1 to 1 range is typical for attractors)
        data[i * 4 + 0] = Math.random() * 2 - 1; // R (x)
        data[i * 4 + 1] = Math.random() * 2 - 1; // G (y)
        data[i * 4 + 2] = 0;                     // B (unused, maybe velocity x?)
        data[i * 4 + 3] = 0;                     // A (unused, maybe velocity y?)
    }
    return data;
  }

  /** Creates Framebuffer Objects (FBOs) to render into textures */
  private setupFramebuffers(): void {
    const gl = this.gl;

    this.fboA = this.createAndSetupFramebuffer(this.positionTextureA);
    checkGLError(gl, 'Setup FBO A');
    this.fboB = this.createAndSetupFramebuffer(this.positionTextureB);
    checkGLError(gl, 'Setup FBO B');

    // Unbind FBO after setup
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  }

  /** Creates and configures a single FBO attached to a texture */
  private createAndSetupFramebuffer(texture: WebGLTexture | null): WebGLFramebuffer | null {
    if (!texture) return null;
    const gl = this.gl;
    const fbo = gl.createFramebuffer();
    if (!fbo) {
        console.error("Failed to create framebuffer");
        return null;
    }
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);

    // Attach the texture as the FBO's color attachment
    gl.framebufferTexture2D(
        gl.FRAMEBUFFER,
        gl.COLOR_ATTACHMENT0, // attachment point
        gl.TEXTURE_2D,        // texture target
        texture,              // texture
        0                     // mip level
    );

    // Check FBO status
    const status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
    if (status !== gl.FRAMEBUFFER_COMPLETE) {
        console.error(`Framebuffer incomplete: ${status.toString(16)}`);
        gl.deleteFramebuffer(fbo);
        return null;
    }

    return fbo;
  }

  /** Swaps the read/write textures and FBOs for ping-ponging */
  private swapPingPong(): void {
    // Swap textures
    let tempTexture = this.readTexture;
    this.readTexture = this.writeTexture;
    this.writeTexture = tempTexture;

    // Swap FBOs
    let tempFBO = this.writeFBO; // We only need to swap the FBO we write to
    this.writeFBO = (tempFBO === this.fboA) ? this.fboB : this.fboA;
  }

  /** Update max iterations based on canvas size */
  private updateMaxIterations(): void {
      this.maxItt = this.width > LARGE_SCREEN_THRESHOLD_WIDTH ? LARGE_SCREEN_MAX_ITT : DEFAULT_MAX_ITT;
      console.log(`Set max iterations to: ${this.maxItt}`);
  }

  setOptions(options: Options): void {
    const needsFullReset = options.attractor !== this.options.attractor;
    this.options = options;
    if (needsFullReset) {
        this.reset();
    } else {
        // Only update uniforms if not resetting
        this.updateAllUniforms();
    }
  }

  reset(): void {
    if (this.animFrameId) cancelAnimationFrame(this.animFrameId);
    this.animFrameId = 0;
    this.itt = 0;
    console.log('Resetting WebGL Context...');

    // Re-initialize position textures
    const initialPositions = this.createInitialPositionData();
    const gl = this.gl;
    gl.bindTexture(gl.TEXTURE_2D, this.positionTextureA);
    gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, POINTS_TEXTURE_SIZE, POINTS_TEXTURE_SIZE, gl.RGBA, gl.FLOAT, initialPositions);
    checkGLError(gl, 'Reset Texture A');
    gl.bindTexture(gl.TEXTURE_2D, this.positionTextureB);
    // Clear texture B by uploading zeros
    gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, POINTS_TEXTURE_SIZE, POINTS_TEXTURE_SIZE, gl.RGBA, gl.FLOAT, new Float32Array(NUM_POINTS * 4));
    checkGLError(gl, 'Reset Texture B');
    gl.bindTexture(gl.TEXTURE_2D, null);

    // Reset ping-pong state
    this.readTexture = this.positionTextureA;
    this.writeTexture = this.positionTextureB;
    this.writeFBO = this.fboB;

    // Update max iterations
    this.updateMaxIterations();

    // Update all uniforms based on current options
    this.updateAllUniforms();
    checkGLError(gl, 'Reset Uniforms');

    // Restart rendering loop
    this.onStart && this.onStart();
    this.startRenderingLoop();
  }

  onResize(): void {
    this.width = this.gl.canvas.width;
    this.height = this.gl.canvas.height;
    console.log('Resizing WebGL Context...');
    this.gl.viewport(0, 0, this.width, this.height);
    // TODO: Update resolution uniforms
    // TODO: Potentially resize textures/FBOs
    this.reset(); // Reset might be too heavy, maybe just update state?
  }

  pause(): void {
    if (!this.paused) {
        this.paused = true;
        console.log('Pausing WebGL Context...');
        if (this.animFrameId) {
            cancelAnimationFrame(this.animFrameId);
            this.animFrameId = 0;
        }
    }
  }

  play(): void {
    if (this.paused) {
      this.paused = false;
      console.log('Playing WebGL Context...');
      // Restart animation loop if not finished and not already running
      if (this.itt < this.maxItt && this.animFrameId === 0) {
         this.startRenderingLoop();
      }
    }
  }

  /** Main rendering loop */
  private startRenderingLoop(): void {
    const loop = () => {
        if (this.paused || this.itt >= this.maxItt) {
            if (this.itt >= this.maxItt) {
                console.log('WebGL rendering finished.');
                this.renderFinalFrame(); // Render one last time
                this.onFinish && this.onFinish();
                this.reportProgress(100);
            }
            this.animFrameId = 0; // Ensure loop stops if paused or finished
            return;
        }

        // Perform one iteration of the calculation
        this.renderCalculationStep();

        // Render the current state to the screen
        this.renderFinalFrame();

        this.itt++;
        this.reportProgress(100 * this.itt / this.maxItt);

        // Request next frame
        this.animFrameId = requestAnimationFrame(loop);
    };

    // Prevent multiple loops from starting
    if (this.animFrameId === 0) {
        this.animFrameId = requestAnimationFrame(loop);
    }
  }

  /** Performs one step of the attractor calculation using WebGL */
  private renderCalculationStep(): void {
    const gl = this.gl;
    if (!this.calcProgram || !this.calcLocations || !this.writeFBO || !this.readTexture || !this.quadVertexBuffer) return;

    // --- Setup for Calculation Pass ---
    gl.useProgram(this.calcProgram);
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.writeFBO); // Render to the 'write' texture

    // Set viewport to match the texture dimensions
    gl.viewport(0, 0, POINTS_TEXTURE_SIZE, POINTS_TEXTURE_SIZE);

    // No need to clear here, we are overwriting the entire texture

    // --- Bind Buffers and Attributes ---
    gl.bindBuffer(gl.ARRAY_BUFFER, this.quadVertexBuffer);
    gl.enableVertexAttribArray(this.calcLocations.positionAttribute);
    gl.vertexAttribPointer(
        this.calcLocations.positionAttribute,
        2,        // size (vec2)
        gl.FLOAT, // type
        false,    // normalize
        0,        // stride
        0         // offset
    );

    // --- Set Uniforms ---
    // Texture containing previous positions
    gl.activeTexture(gl.TEXTURE0); // Use texture unit 0
    gl.bindTexture(gl.TEXTURE_2D, this.readTexture);
    gl.uniform1i(this.calcLocations.prevStateTextureUniform, 0); // Tell shader sampler to use texture unit 0

    // Attractor parameters (example - needs actual values from options)
    const params = [this.options.a, this.options.b, this.options.c, this.options.d];
    gl.uniform4fv(this.calcLocations.paramsUniform, params);

    // Attractor type
    const attractorType = this.options.attractor === 'clifford' ? 0.0 : 1.0;
    gl.uniform1f(this.calcLocations.attractorTypeUniform, attractorType);

    // Resolution of the texture (might not be needed in calc shader?)
    // gl.uniform2f(this.calcLocations.resolutionUniform, POINTS_TEXTURE_SIZE, POINTS_TEXTURE_SIZE);

    // --- Draw the Quad ---
    // This executes the fragment shader for each pixel of the output texture
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

    // --- Cleanup and Swap ---
    gl.bindFramebuffer(gl.FRAMEBUFFER, null); // Unbind FBO
    gl.disableVertexAttribArray(this.calcLocations.positionAttribute); // Disable attribute
    gl.bindBuffer(gl.ARRAY_BUFFER, null); // Unbind buffer
    gl.bindTexture(gl.TEXTURE_2D, null); // Unbind texture

    this.swapPingPong(); // Prepare for the next calculation step
  }

  /** Renders the final points to the screen using the point shaders */
  private renderFinalFrame(): void {
    const gl = this.gl;
    if (!this.pointProgram || !this.pointRenderLocations || !this.readTexture || !this.pointIndexBuffer) return;

    // --- Setup for Rendering Pass ---
    gl.useProgram(this.pointProgram);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null); // Render to canvas
    gl.viewport(0, 0, this.width, this.height); // Use canvas size

    // Clear canvas
    const [r, g, b] = this.options.background;
    gl.clearColor(r / 255, g / 255, b / 255, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    // --- Enable Blending ---
    gl.enable(gl.BLEND);
    // Additive blending seems appropriate for the desired effect
    gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE, gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    // gl.blendFunc(gl.SRC_ALPHA, gl.ONE); // Simpler additive

    // --- Bind Buffers and Attributes ---
    gl.bindBuffer(gl.ARRAY_BUFFER, this.pointIndexBuffer);
    gl.enableVertexAttribArray(this.pointRenderLocations.pointIndexAttribute);
    gl.vertexAttribPointer(
        this.pointRenderLocations.pointIndexAttribute,
        1,        // size (float)
        gl.FLOAT, // type
        false,    // normalize
        0,        // stride
        0         // offset
    );

    // --- Set Uniforms ---
    // Position texture
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.readTexture);
    gl.uniform1i(this.pointRenderLocations.positionTextureUniform, 0);

    // Texture size
    gl.uniform2f(this.pointRenderLocations.textureSizeUniform, POINTS_TEXTURE_SIZE, POINTS_TEXTURE_SIZE);

    // Canvas resolution
    gl.uniform2f(this.pointRenderLocations.canvasResolutionUniform, this.width, this.height);

    // Point Size (adjust as needed)
    gl.uniform1f(this.pointRenderLocations.pointSizeUniform, 1.0);

    // Scale and Translate (based on options, similar to Context2d)
    const currentScale = BASE_SCALE * Math.max(0.001, this.options.scale);
    const centerX = this.width / 2 + (this.options.left * this.width);
    const centerY = this.height / 2 + (this.options.top * this.height);
    gl.uniform1f(this.pointRenderLocations.scaleUniform, currentScale);
    gl.uniform2f(this.pointRenderLocations.translateUniform, centerX, centerY);

    // Color (normalize HSV)
    const hsv = [
        this.options.hue / 360.0,
        this.options.saturation / 100.0,
        this.options.brightness / 100.0
    ];
    gl.uniform3fv(this.pointRenderLocations.hsvColorUniform, hsv);

    // Alpha (adjust for desired density effect)
    gl.uniform1f(this.pointRenderLocations.alphaUniform, 0.05); // Low alpha for additive blending

    // --- Draw Points ---
    gl.drawArrays(gl.POINTS, 0, NUM_POINTS);

    // --- Cleanup ---
    gl.disable(gl.BLEND);
    gl.disableVertexAttribArray(this.pointRenderLocations.pointIndexAttribute);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    gl.bindTexture(gl.TEXTURE_2D, null);
  }

  /** Reports progress via the callback */
  private reportProgress(n: number): void {
    this.onProgress && this.onProgress(Math.min(100, Math.max(0, n))); // Clamp progress
  }

  // --- Cleanup Method ---
  destroy(): void {
    console.log('Destroying WebGL Context...');
    const gl = this.gl;

    // Stop animation loop
    if (this.animFrameId) {
        cancelAnimationFrame(this.animFrameId);
        this.animFrameId = 0;
    }

    // Delete programs
    if (this.calcProgram) gl.deleteProgram(this.calcProgram);
    if (this.pointProgram) gl.deleteProgram(this.pointProgram);

    // Delete buffers
    if (this.quadVertexBuffer) gl.deleteBuffer(this.quadVertexBuffer);
    if (this.pointIndexBuffer) gl.deleteBuffer(this.pointIndexBuffer);

    // Delete textures
    if (this.positionTextureA) gl.deleteTexture(this.positionTextureA);
    if (this.positionTextureB) gl.deleteTexture(this.positionTextureB);

    // Delete framebuffers
    if (this.fboA) gl.deleteFramebuffer(this.fboA);
    if (this.fboB) gl.deleteFramebuffer(this.fboB);

    // Clear references
    this.calcProgram = null;
    this.pointProgram = null;
    this.quadVertexBuffer = null;
    this.pointIndexBuffer = null;
    this.positionTextureA = null;
    this.positionTextureB = null;
    this.readTexture = null;
    this.writeTexture = null;
    this.fboA = null;
    this.fboB = null;
    this.writeFBO = null;
    this.calcLocations = null;
    this.pointRenderLocations = null;

    console.log('WebGL Context destroyed.');
  }

  // --- Update Uniforms Helper ---
  private updateAllUniforms(): void {
      this.updateCalcUniforms();
      this.updatePointRenderUniforms();
  }

  private updateCalcUniforms(): void {
      const gl = this.gl;
      if (!this.calcProgram || !this.calcLocations) return;

      gl.useProgram(this.calcProgram);

      // Attractor parameters
      const params = [this.options.a, this.options.b, this.options.c, this.options.d];
      gl.uniform4fv(this.calcLocations.paramsUniform, params);

      // Attractor type
      const attractorType = this.options.attractor === 'clifford' ? 0.0 : 1.0;
      gl.uniform1f(this.calcLocations.attractorTypeUniform, attractorType);

      // Texture resolution
      gl.uniform2f(this.calcLocations.resolutionUniform, POINTS_TEXTURE_SIZE, POINTS_TEXTURE_SIZE);

      // Note: prevStateTextureUniform is set during the render step
  }

  private updatePointRenderUniforms(): void {
      const gl = this.gl;
      if (!this.pointProgram || !this.pointRenderLocations) return;

      gl.useProgram(this.pointProgram);

      // Texture size
      gl.uniform2f(this.pointRenderLocations.textureSizeUniform, POINTS_TEXTURE_SIZE, POINTS_TEXTURE_SIZE);

      // Canvas resolution
      gl.uniform2f(this.pointRenderLocations.canvasResolutionUniform, this.width, this.height);

      // Point Size
      gl.uniform1f(this.pointRenderLocations.pointSizeUniform, 1.0); // Or make this an option

      // Scale and Translate
      const currentScale = BASE_SCALE * Math.max(0.001, this.options.scale);
      const centerX = this.width / 2 + (this.options.left * this.width);
      const centerY = this.height / 2 + (this.options.top * this.height);
      gl.uniform1f(this.pointRenderLocations.scaleUniform, currentScale);
      gl.uniform2f(this.pointRenderLocations.translateUniform, centerX, centerY);

      // Color (normalize HSV)
      const hsv = [
          this.options.hue / 360.0,
          this.options.saturation / 100.0,
          this.options.brightness / 100.0
      ];
      gl.uniform3fv(this.pointRenderLocations.hsvColorUniform, hsv);

      // Alpha
      gl.uniform1f(this.pointRenderLocations.alphaUniform, 0.05); // Or make this an option

      // Note: positionTextureUniform is set during the render step
  }
}
