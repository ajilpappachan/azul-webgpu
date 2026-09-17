export class Renderer {
  readonly canvas: HTMLCanvasElement;
  readonly device: GPUDevice;
  readonly context: GPUCanvasContext;
  readonly format: GPUTextureFormat;

  private constructor(
    canvas: HTMLCanvasElement,
    device: GPUDevice,
    context: GPUCanvasContext,
    format: GPUTextureFormat,
  ) {
    this.canvas = canvas;
    this.device = device;
    this.context = context;
    this.format = format;
  }

  resize(): void {
    const dpr: number = window.devicePixelRatio;
    const max: number = this.device.limits.maxTextureDimension2D;
    this.canvas.width = Math.min(
      max,
      Math.max(1, Math.floor(this.canvas.clientWidth * dpr)),
    );
    this.canvas.height = Math.min(
      max,
      Math.max(1, Math.floor(this.canvas.clientHeight * dpr)),
    );
  }

  frame(clearColor: GPUColor): void {
    const encoder: GPUCommandEncoder = this.device.createCommandEncoder();

    const pass: GPURenderPassEncoder = encoder.beginRenderPass({
      colorAttachments: [
        {
          view: this.context.getCurrentTexture().createView(),
          clearValue: clearColor,
          loadOp: "clear",
          storeOp: "store",
        },
      ],
    });

    // Draw

    pass.end();
    this.device.queue.submit([encoder.finish()]);
  }

  static async create(canvas: HTMLCanvasElement): Promise<Renderer> {
    if (!navigator.gpu) {
      throw new Error("WebGPU not supported");
    }

    const adapter: GPUAdapter | null = await navigator.gpu.requestAdapter();
    if (!adapter) {
      throw new Error("No suitable GPU adapter found");
    }

    const device: GPUDevice = await adapter.requestDevice();
    device.lost.then((info: GPUDeviceLostInfo) => {
      console.error(`WebGPU device lost (${info.reason}):
                ${info.message}`);
    });
    device.addEventListener("uncapturederror", (e: Event) => {
      console.error(
        "WebGPU error:",
        (e as GPUUncapturedErrorEvent).error.message,
      );
    });

    const context: GPUCanvasContext | null = canvas.getContext("webgpu");
    if (!context) {
      throw new Error("Failed to get WebGPU canvas context");
    }

    const format: GPUTextureFormat = navigator.gpu.getPreferredCanvasFormat();

    context.configure({
      device,
      format,
      alphaMode: "opaque",
    });

    const renderer: Renderer = new Renderer(canvas, device, context, format);
    renderer.resize();
    return renderer;
  }
}
