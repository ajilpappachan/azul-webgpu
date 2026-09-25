import "./style.css";
import GUI from "lil-gui";
import { Renderer } from "./graphics/Renderer";

const canvas: HTMLCanvasElement | null = document.querySelector("#gpu");
if (!canvas) {
  throw new Error("Canvas #gpu not found");
}

const renderer: Renderer = await Renderer.create(canvas);

const settings = { clearColor: { r: 0.1, g: 0.2, b: 0.35 }, fps: 0, size: "" };
const gui: GUI = new GUI({ title: "Debug" });
gui.addColor(settings, "clearColor");
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
}

function draw(): void {
  renderer.beginFrame({ ...settings.clearColor, a: 1 });
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
