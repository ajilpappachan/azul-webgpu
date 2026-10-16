import { PCSNode } from "@azul/pcs";
import { Mat4, Quat, Vec3 } from "@azul/math";
import type { Renderer } from "../graphics/Renderer";
import type { Mesh } from "../graphics/Mesh";
import type { Material } from "../graphics/Material";

export class GameObject extends PCSNode {
  trans: Vec3;
  rot: Quat;
  scale: Vec3;
  readonly mesh: Mesh | null;
  readonly material: Material | null;

  protected device: GPUDevice;

  private local: Mat4;
  private world: Mat4;
  private worldData: Float32Array;
  private worldBuffer: GPUBuffer;
  private bindGroup: GPUBindGroup;

  constructor(
    renderer: Renderer,
    name: string,
    mesh: Mesh | null,
    material: Material | null,
    palette: GPUBuffer | null,
  ) {
    super(name);
    this.trans = new Vec3(0, 0, 0);
    this.rot = Quat.identity();
    this.scale = new Vec3(1, 1, 1);
    this.mesh = mesh;
    this.material = material;

    this.device = renderer.device;
    this.local = Mat4.identity();
    this.world = Mat4.identity();
    this.worldData = new Float32Array(16);
    this.worldBuffer = this.device.createBuffer({
      label: `${name} world`,
      size: this.worldData.byteLength,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });
    const entries: GPUBindGroupEntry[] = [
      {
        binding: 0,
        resource: { buffer: this.worldBuffer },
      },
    ];
    if (palette) {
      entries.push({
        binding: 1,
        resource: { buffer: palette },
      });
    }
    this.bindGroup = this.device.createBindGroup({
      label: `${name} object`,
      layout: palette ? renderer.skinnedObjectLayout : renderer.objectLayout,
      entries,
    });
  }

  getWorld(): Mat4 {
    return this.world;
  }

  update(): void {
    Mat4.fromTRS(this.trans, this.rot, this.scale, this.local);
    if (this.parent instanceof GameObject) {
      Mat4.multiply(this.parent.getWorld(), this.local, this.world);
    } else {
      Mat4.fromTRS(this.trans, this.rot, this.scale, this.world);
    }

    this.world.copyTo(this.worldData);
    this.device.queue.writeBuffer(this.worldBuffer, 0, this.worldData);
  }

  draw(pass: GPURenderPassEncoder): void {
    if (this.mesh === null || this.material === null) {
      return;
    }
    this.material.draw(pass, this.mesh, this.bindGroup);
  }
}
