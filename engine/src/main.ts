import "./style.css";
import GUI from "lil-gui";
import { Quat, Vec3, Vec4 } from "@azul/math";
import { Renderer } from "./graphics/Renderer";
import { Mesh } from "./graphics/Mesh";
import { Material } from "./graphics/Material";
import { Texture } from "./graphics/Texture";
import { Gltf } from "./loader/Gltf";
import { Camera } from "./core/Camera";
import { GameObject } from "./core/GameObject";
import { Scene } from "./core/Scene";

import textureLitShader from "./shaders/texture_lit.wgsl?raw";
import crateUrl from "./assets/crate_mesh.glb?url";

const canvas: HTMLCanvasElement | null = document.querySelector("#gpu");
if (!canvas) {
  throw new Error("Canvas #gpu not found");
}

const renderer: Renderer = await Renderer.create(canvas);

const device = renderer.device;

const crateGltf: Gltf = await Gltf.load(crateUrl);
const crate: Mesh = crateGltf.createMesh(device, 0);
const crateTexture: Texture = await crateGltf.createBaseColorTexture(device, 0);

const material: Material = new Material(
  renderer,
  "texture lit",
  renderer.createShaderModule("texture_lit.wgsl", textureLitShader),
  new Vec4(1.0, 1.0, 1.0, 1.0),
  crateTexture,
);

const scene: Scene = new Scene(renderer);

const crateObj: GameObject = scene.add(
  new GameObject(renderer, "crate", crate, material),
  null,
);
const moonObj: GameObject = scene.add(
  new GameObject(renderer, "moon", crate, material),
  crateObj,
);
moonObj.trans.set(2, 0, 0);
moonObj.scale.set(0.4, 0.4, 0.4);

const camera: Camera = new Camera(Math.PI / 4, 0.1, 100);
camera.setLookAt(new Vec3(0, 2.5, 5), new Vec3(0, 0, 0), new Vec3(0, 1, 0));

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
  crateObj.rot = Quat.fromAxisAngle(spinAxis, angle);
  moonObj.rot = Quat.fromAxisAngle(new Vec3(0, 1, 0), -2 * angle);
  scene.update();

  camera.update(renderer.getAspect());
  renderer.setFrame(camera.getViewProj(), lightDir);
}

function draw(): void {
  const pass: GPURenderPassEncoder = renderer.beginFrame({
    ...settings.clearColor,
    a: 1,
  });
  scene.draw(pass);
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
