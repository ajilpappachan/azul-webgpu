export class Renderer {
  readonly canvas: HTMLCanvasElement;
  readonly device: GPUDevice;
  readonly context: GPUCanvasContext;
  readonly format: GPUTextureFormat;
  readonly depthFormat: GPUTextureFormat;

  private depthTexture: GPUTexture;
  private encoder: GPUCommandEncoder | null;
  private pass: GPURenderPassEncoder | null;
  private resizeObserver: ResizeObserver;

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
    this.depthFormat = "depth24plus";
    this.encoder = null;
    this.pass = null;

    this.resizeCanvas(
      Math.floor(canvas.clientWidth * window.devicePixelRatio),
      Math.floor(canvas.clientHeight * window.devicePixelRatio),
    );
    this.depthTexture = this.createDepthTexture();
    this.resizeObserver = new ResizeObserver((entries: ResizeObserverEntry[]) =>
      this.onResize(entries),
    );
    this.resizeObserver.observe(canvas);
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

    return new Renderer(canvas, device, context, format);
  }

  beginFrame(clearColor: GPUColor): GPURenderPassEncoder {
    if (
      this.depthTexture.width !== this.canvas.width ||
      this.depthTexture.height !== this.canvas.height
    ) {
      this.depthTexture.destroy();
      this.depthTexture = this.createDepthTexture();
    }

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
      depthStencilAttachment: {
        view: this.depthTexture.createView(),
        depthClearValue: 1.0,
        depthLoadOp: "clear",
        depthStoreOp: "discard",
      },
    });

    this.encoder = encoder;
    this.pass = pass;
    return pass;
  }

  endFrame(): void {
    if (!this.encoder || !this.pass) {
      throw new Error("endFrame called without beginFrame");
    }
    this.pass.end();
    this.device.queue.submit([this.encoder.finish()]);
    this.encoder = null;
    this.pass = null;
  }
  createShaderModule(label: string, code: string): GPUShaderModule {
    const module: GPUShaderModule = this.device.createShaderModule({
      label,
      code,
    });

    module.getCompilationInfo().then((info: GPUCompilationInfo) => {
      const lines: string[] = code.split("\n");
      for (const message of info.messages) {
        const text: string =
          `${label}:${message.lineNum}:${message.linePos} ` +
          `${message.type}: ${message.message}\n` +
          `    ${lines[message.lineNum - 1] ?? ""}`;
        if (message.type === "error") {
          console.error(text);
        } else if (message.type === "warning") {
          console.warn(text);
        } else {
          console.info(text);
        }
      }
    });

    return module;
  }

  private onResize(entries: ResizeObserverEntry[]): void {
    for (const entry of entries) {
      if (entry.target !== this.canvas) {
        continue;
      }
      if (entry.devicePixelContentBoxSize) {
        this.resizeCanvas(
          entry.devicePixelContentBoxSize[0].inlineSize,
          entry.devicePixelContentBoxSize[0].blockSize,
        );
      } else {
        this.resizeCanvas(
          Math.floor(
            entry.contentBoxSize[0].inlineSize * window.devicePixelRatio,
          ),
          Math.floor(
            entry.contentBoxSize[0].blockSize * window.devicePixelRatio,
          ),
        );
      }
    }
  }

  private resizeCanvas(width: number, height: number): void {
    const max: number = this.device.limits.maxTextureDimension2D;
    this.canvas.width = Math.min(max, Math.max(1, width));
    this.canvas.height = Math.min(max, Math.max(1, height));
  }

  private createDepthTexture(): GPUTexture {
    return this.device.createTexture({
      label: "depth",
      size: [this.canvas.width, this.canvas.height],
      format: this.depthFormat,
      usage: GPUTextureUsage.RENDER_ATTACHMENT,
    });
  }
}
