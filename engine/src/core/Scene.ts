import { PCSTree } from "@azul/pcs";
import { GameObject } from "./GameObject";
import type { Renderer } from "../graphics/Renderer";

export class Scene {
  readonly root: GameObject;

  private tree: PCSTree;

  constructor(renderer: Renderer) {
    this.tree = new PCSTree();
    this.root = new GameObject(renderer, "root", null, null, null);
    this.tree.insert(this.root, null);
  }

  add(obj: GameObject, parent: GameObject | null): GameObject {
    this.tree.insert(obj, parent ?? this.root);
    return obj;
  }

  remove(obj: GameObject): void {
    if (obj === this.root) {
      throw new Error("Scene: cannot remove the root");
    }
    this.tree.remove(obj);
  }

  getNumObjects(): number {
    return this.tree.getNumNodes();
  }

  update(): void {
    for (const node of this.tree) {
      (node as GameObject).update();
    }
  }

  draw(pass: GPURenderPassEncoder): void {
    for (const node of this.tree) {
      (node as GameObject).draw(pass);
    }
  }
}
