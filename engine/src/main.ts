import "./style.css";
import GUI from "lil-gui";
import { Quat, Vec3, Vec4 } from "@azul/math";
import { Renderer } from "./graphics/Renderer";
import { Mesh } from "./graphics/Mesh";
import { SkinnedMesh } from "./graphics/SkinnedMesh";
import { Material } from "./graphics/Material";
import { Texture } from "./graphics/Texture";
import { Gltf } from "./loader/Gltf";
import { Camera } from "./core/Camera";
import { Keyboard } from "./core/Keyboard";
import { OrbitController } from "./core/OrbitController";
import { GameObject } from "./core/GameObject";
import { SkinnedGameObject } from "./core/SkinnedGameObject";
import { Scene } from "./core/Scene";
import { Skeleton } from "./animation/Skeleton";
import { Clip } from "./animation/Clip";
import { Animator } from "./animation/Animator";
import { WorldCompute } from "./animation/WorldCompute";

import textureLitShader from "./shaders/texture_lit.wgsl?raw";
import skinnedTextureLitShader from "./shaders/skinned_texture_lit.wgsl?raw";
import worldShader from "./shaders/world.wgsl?raw";
import crateUrl from "./assets/crate_mesh.glb?url";
import mouseyUrl from "./assets/Mousey_Mesh.glb?url";
import runUrl from "./assets/Mousey_Anim_Run_Forward.glb?url";

const canvas: HTMLCanvasElement | null = document.querySelector("#gpu");
if (!canvas) {
  throw new Error("Canvas #gpu not found");
}

const renderer: Renderer = await Renderer.create(canvas);

const device = renderer.device;

const crateGltf: Gltf = await Gltf.load(crateUrl);
const crate: Mesh = crateGltf.createMesh(device, 0);
const crateTexture: Texture = await crateGltf.createBaseColorTexture(device, 0);

const mouseyGltf: Gltf = await Gltf.load(mouseyUrl);
const mouseySkeleton: Skeleton = mouseyGltf.createSkeleton(0);
const mousey: SkinnedMesh = mouseyGltf.createSkinnedMesh(
  device,
  0,
  mouseySkeleton,
);
const mouseyTexture: Texture = await mouseyGltf.createBaseColorTexture(
  device,
  0,
);
const danceClip: Clip = mouseyGltf.createClip(0, mouseySkeleton);
const runGltf: Gltf = await Gltf.load(runUrl);
const runClip: Clip = runGltf.createClip(0, mouseySkeleton);
runClip.removeRootMotion();

const textureLit: GPUShaderModule = renderer.createShaderModule(
  "texture_lit.wgsl",
  textureLitShader,
);
const skinnedTextureLit: GPUShaderModule = renderer.createShaderModule(
  "skinned_texture_lit.wgsl",
  skinnedTextureLitShader,
);
const worldCompute: WorldCompute = new WorldCompute(
  renderer,
  renderer.createShaderModule("world.wgsl", worldShader),
);
const material: Material = new Material(
  renderer,
  "crate texture lit",
  textureLit,
  new Vec4(1.0, 1.0, 1.0, 1.0),
  crateTexture,
  false,
);
const mouseyMaterial: Material = new Material(
  renderer,
  "mousey skinned texture lit",
  skinnedTextureLit,
  new Vec4(1.0, 1.0, 1.0, 1.0),
  mouseyTexture,
  true,
);

const scene: Scene = new Scene(renderer);

const mouseyObj: SkinnedGameObject = new SkinnedGameObject(
  renderer,
  "mousey",
  mousey,
  mouseyMaterial,
  mouseySkeleton,
  worldCompute,
);
mouseyObj.gpuWorld = true;
const mouseyAnimator: Animator = new Animator(danceClip, runClip);
mouseyObj.animator = mouseyAnimator;
scene.add(mouseyObj, null);
const crateObj: GameObject = scene.add(
  new GameObject(renderer, "crate", crate, material, null),
  null,
);
crateObj.trans.set(-2, 1, 0);
crateObj.scale.set(0.4, 0.4, 0.4);
const moonObj: GameObject = scene.add(
  new GameObject(renderer, "moon", crate, material, null),
  crateObj,
);
moonObj.trans.set(2, 0, 0);
moonObj.scale.set(0.4, 0.4, 0.4);

const camera: Camera = new Camera(Math.PI / 4, 0.1, 100);
camera.setLookAt(new Vec3(0, 1.5, 4), new Vec3(0, 0.7, 0), new Vec3(0, 1, 0));
const orbit: OrbitController = new OrbitController(
  camera,
  new Keyboard(window),
);

const lightDir: Vec3 = new Vec3(-0.5, -1, -0.7).normalize();
const spinAxis: Vec3 = new Vec3(1, 1, 0).normalize();
let angle: number = 0;

const settings = {
  clearColor: { r: 0.1, g: 0.2, b: 0.35 },
  spinSpeed: 1.0,
  play: true,
  speed: 1.0,
  blend: 0.0,
  gpuWorld: true,
  phase: 0.0,
  cycle: 0,
  fps: 0,
  updateMs: 0,
  size: "",
};
const gui: GUI = new GUI({ title: "Debug" });
gui.addColor(settings, "clearColor");
gui.add(settings, "spinSpeed", -5, 5, 0.1);
gui.add(settings, "play").onChange((play: boolean) => {
  mouseyAnimator.playing = play;
});
gui.add(settings, "speed", 0, 2, 0.05).onChange((speed: number) => {
  mouseyAnimator.speed = speed;
});
gui.add(settings, "blend", 0, 1, 0.01).onChange((blend: number) => {
  mouseyAnimator.blend = blend;
});
gui.add(settings, "gpuWorld").onChange((gpuWorld: boolean) => {
  mouseyObj.gpuWorld = gpuWorld;
});
gui
  .add(settings, "phase", 0, 1, 0.001)
  .listen()
  .onChange((phase: number) => {
    mouseyAnimator.setPhase(phase);
  });
gui.add(settings, "cycle").decimals(3).listen().disable();
gui.add(settings, "fps").decimals(1).listen().disable();
gui.add(settings, "updateMs").decimals(3).listen().disable();
gui.add(settings, "size").listen().disable();

let fpsFrames: number = 0;
let fpsTime: number = 0;
let updateTime: number = 0;

function update(dt: number): void {
  fpsFrames++;
  fpsTime += dt;
  if (fpsTime >= 0.5) {
    settings.fps = fpsFrames / fpsTime;
    settings.updateMs = updateTime / fpsFrames;
    settings.size = `${renderer.canvas.width} x ${renderer.canvas.height}`;
    fpsFrames = 0;
    fpsTime = 0;
    updateTime = 0;
  }

  angle += dt * settings.spinSpeed;
  mouseyObj.rot = Quat.fromAxisAngle(new Vec3(0, 1, 0), 0.5 * angle);
  mouseyAnimator.update(dt);
  settings.phase = mouseyAnimator.getPhase();
  settings.cycle = mouseyAnimator.getCycleDuration();
  crateObj.rot = Quat.fromAxisAngle(spinAxis, angle);
  moonObj.rot = Quat.fromAxisAngle(new Vec3(0, 1, 0), -2 * angle);
  const updateStart: number = performance.now();
  scene.update();
  updateTime += performance.now() - updateStart;

  orbit.update(dt);
  camera.update(renderer.getAspect());
  renderer.setFrame(camera.getViewProj(), lightDir);
}

function draw(): void {
  const computePass: GPUComputePassEncoder = renderer.beginCompute();
  scene.compute(computePass);
  renderer.endCompute();

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
