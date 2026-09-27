import "./style.css";
import GUI from "lil-gui";
import { Mat4, Quat, Vec3 } from "@azul/math";
import { Renderer } from "./graphics/Renderer";

import colorUnlitShader from "./shaders/color_unlit.wgsl?raw";

const canvas: HTMLCanvasElement | null = document.querySelector("#gpu");
if (!canvas) {
  throw new Error("Canvas #gpu not found");
}

const renderer: Renderer = await Renderer.create(canvas);

const device = renderer.device;

const vertices: Float32Array = new Float32Array([
  0.0, 0.6, 1.0, 0.0, 0.0, -0.6, -0.6, 0.0, 1.0, 0.0, 0.6, -0.6, 0.0, 0.0, 1.0,
]);

const vertexBuffer: GPUBuffer = device.createBuffer({
  label: "triangle vertices",
  size: vertices.byteLength,
  usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
});

device.queue.writeBuffer(vertexBuffer, 0, vertices);

const module: GPUShaderModule = renderer.createShaderModule(
  "color_unlit.wgsl",
  colorUnlitShader,
);

const pipeline: GPURenderPipeline = device.createRenderPipeline({
  label: "triangle pipeline",
  layout: "auto",
  vertex: {
    module,
    entryPoint: "vs_main",
    buffers: [
      {
        arrayStride: 20,
        attributes: [
          {
            shaderLocation: 0,
            offset: 0,
            format: "float32x2",
          },
          {
            shaderLocation: 1,
            offset: 8,
            format: "float32x3",
          },
        ],
      },
    ],
  },
  fragment: {
    module,
    entryPoint: "fs_main",
    targets: [{ format: renderer.format }],
  },
  primitive: {
    topology: "triangle-list",
  },
  depthStencil: {
    format: renderer.depthFormat,
    depthWriteEnabled: true,
    depthCompare: "less",
  },
});

const modelData: Float32Array = new Float32Array(16);

const modelBuffer: GPUBuffer = device.createBuffer({
  label: "triangle model",
  size: modelData.byteLength,
  usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
});

const modelBindGroup: GPUBindGroup = device.createBindGroup({
  label: "triangle bind group",
  layout: pipeline.getBindGroupLayout(0),
  entries: [
    {
      binding: 0,
      resource: { buffer: modelBuffer },
    },
  ],
});

const spinAxis: Vec3 = new Vec3(0, 0, 1);
let angle: number = 0;

const settings = {
  clearColor: { r: 0.1, g: 0.2, b: 0.35 },
  spinSpeed: 1.0,
  fps: 0,
  size: "",
};
const gui: GUI = new GUI({ title: "Debug" });
gui.addColor(settings, "clearColor");
gui.add(settings, "spinSpeed", -5, 5, 0.1);
gui.add(settings, "fps").decimals(1).listen().disable();
gui.add(settings, "size").listen().disable();

let fpsFrames: number = 0;
let fpsTime: number = 0;

function update(dt: number): void {
  fpsFrames++;
  fpsTime += dt;
  if (fpsTime >= 0.5) {
    settings.fps = fpsFrames / fpsTime;
    settings.size = `${renderer.canvas.width} x ${renderer.canvas.height}`;
    fpsFrames = 0;
    fpsTime = 0;
  }

  angle += dt * settings.spinSpeed;
  const aspectScale: Mat4 = Mat4.scale(
    new Vec3(1 / renderer.getAspect(), 1, 1),
  );
  const spin: Mat4 = Mat4.fromQuat(Quat.fromAxisAngle(spinAxis, angle));
  Mat4.multiply(aspectScale, spin).copyTo(modelData);
  device.queue.writeBuffer(modelBuffer, 0, modelData);
}

function draw(): void {
  const pass: GPURenderPassEncoder = renderer.beginFrame({
    ...settings.clearColor,
    a: 1,
  });
  pass.setPipeline(pipeline);
  pass.setBindGroup(0, modelBindGroup);
  pass.setVertexBuffer(0, vertexBuffer);
  pass.draw(3);
  renderer.endFrame();
}

let last: number = performance.now();

function tick(now: number): void {
  const dt: number = Math.min((now - last) / 1000, 0.1);
  last = now;
  update(dt);
  draw();
  requestAnimationFrame(tick);
}
requestAnimationFrame(tick);
