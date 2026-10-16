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

import textureLitShader from "./shaders/texture_lit.wgsl?raw";
import skinnedTextureLitShader from "./shaders/skinned_texture_lit.wgsl?raw";
import crateUrl from "./assets/crate_mesh.glb?url";
import mouseyUrl from "./assets/Mousey_Mesh.glb?url";

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

const textureLit: GPUShaderModule = renderer.createShaderModule(
  "texture_lit.wgsl",
  textureLitShader,
);
const skinnedTextureLit: GPUShaderModule = renderer.createShaderModule(
  "skinned_texture_lit.wgsl",
  skinnedTextureLitShader,
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
);
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
const boneAxis: Vec3 = new Vec3(0, 0, 1);
let angle: number = 0;

const settings = {
  clearColor: { r: 0.1, g: 0.2, b: 0.35 },
  spinSpeed: 1.0,
  bone: mouseySkeleton.names[0],
  boneAngle: 0.0,
  fps: 0,
  size: "",
};
const gui: GUI = new GUI({ title: "Debug" });
gui.addColor(settings, "clearColor");
gui.add(settings, "spinSpeed", -5, 5, 0.1);
gui.add(settings, "bone", mouseySkeleton.names);
gui.add(settings, "boneAngle", -1.5, 1.5, 0.01);
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
  mouseyObj.rot = Quat.fromAxisAngle(new Vec3(0, 1, 0), 0.5 * angle);
  mouseyObj.resetPose();
  const bone: number = mouseySkeleton.findBone(settings.bone);
  mouseyObj.setBoneRotation(
    bone,
    mouseyObj
      .getRestRotation(bone)
      .multiply(Quat.fromAxisAngle(boneAxis, settings.boneAngle)),
  );
  crateObj.rot = Quat.fromAxisAngle(spinAxis, angle);
  moonObj.rot = Quat.fromAxisAngle(new Vec3(0, 1, 0), -2 * angle);
  scene.update();

  orbit.update(dt);
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
