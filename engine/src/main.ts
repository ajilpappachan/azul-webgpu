import "./style.css";
import GUI from "lil-gui";
import { Mat4, Quat, Vec3, Vec4 } from "@azul/math";
import { Renderer } from "./graphics/Renderer";
import { Mesh } from "./graphics/Mesh";
import { Material } from "./graphics/Material";
import { Gltf } from "./loader/Gltf";

import colorLitShader from "./shaders/color_lit.wgsl?raw";
import crateUrl from "./assets/crate_mesh.glb?url";

const canvas: HTMLCanvasElement | null = document.querySelector("#gpu");
if (!canvas) {
  throw new Error("Canvas #gpu not found");
}

const renderer: Renderer = await Renderer.create(canvas);

const device = renderer.device;

const crateGltf: Gltf = await Gltf.load(crateUrl);
const crate: Mesh = crateGltf.createMesh(device, 0);

const material: Material = new Material(
  renderer,
  "color lit",
  renderer.createShaderModule("color_lit.wgsl", colorLitShader),
  new Vec4(1.0, 1.0, 1.0, 1.0),
);

const modelData: Float32Array = new Float32Array(16);

const modelBuffer: GPUBuffer = device.createBuffer({
  label: "crate model",
  size: modelData.byteLength,
  usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
});

const modelBindGroup: GPUBindGroup = device.createBindGroup({
  label: "crate model",
  layout: renderer.objectLayout,
  entries: [
    {
      binding: 0,
      resource: { buffer: modelBuffer },
    },
  ],
});

const view: Mat4 = Mat4.lookAt(
  new Vec3(0, 2.5, 5),
  new Vec3(0, 0, 0),
  new Vec3(0, 1, 0),
);
const lightDir: Vec3 = new Vec3(-0.5, -1, -0.7).normalize();
const spinAxis: Vec3 = new Vec3(1, 1, 0).normalize();
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
  Mat4.fromQuat(Quat.fromAxisAngle(spinAxis, angle)).copyTo(modelData);
  device.queue.writeBuffer(modelBuffer, 0, modelData);

  const proj: Mat4 = Mat4.perspective(
    Math.PI / 4,
    renderer.getAspect(),
    0.1,
    100,
  );
  renderer.setFrame(Mat4.multiply(proj, view), lightDir);
}

function draw(): void {
  const pass: GPURenderPassEncoder = renderer.beginFrame({
    ...settings.clearColor,
    a: 1,
  });
  material.draw(pass, crate, modelBindGroup);
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
