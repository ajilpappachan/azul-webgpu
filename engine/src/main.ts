import "./style.css";
import GUI from "lil-gui";
import { Renderer } from "./graphics/Renderer";

const canvas: HTMLCanvasElement | null = document.querySelector("#gpu");
if (!canvas) {
  throw new Error("Canvas #gpu not found");
}

const renderer: Renderer = await Renderer.create(canvas);
window.addEventListener("resize", () => renderer.resize());

const settings = { clearColor: { r: 0.1, g: 0.2, b: 0.35 } };
const gui: GUI = new GUI({ title: "Debug" });
gui.addColor(settings, "clearColor");

function tick(): void {
  renderer.frame({ ...settings.clearColor, a: 1 });
  requestAnimationFrame(tick);
}
requestAnimationFrame(tick);
