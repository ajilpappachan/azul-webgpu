import { Mesh } from "./Mesh";

export class SkinnedMesh extends Mesh {
  static readonly skinLayout: GPUVertexBufferLayout = {
    arrayStride: 32,
    attributes: [
      { shaderLocation: 3, offset: 0, format: "uint32x4" },
      { shaderLocation: 4, offset: 16, format: "float32x4" },
    ],
  };

  private skinBuffer: GPUBuffer;

  constructor(
    device: GPUDevice,
    label: string,
    vertices: Float32Array,
    indices: Uint32Array,
    skin: ArrayBuffer,
  ) {
    super(device, label, vertices, indices);

    this.skinBuffer = device.createBuffer({
      label: `${label} skin buffer`,
      size: skin.byteLength,
      usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
    });
    device.queue.writeBuffer(this.skinBuffer, 0, skin);
  }

  override draw(pass: GPURenderPassEncoder): void {
    pass.setVertexBuffer(1, this.skinBuffer);
    super.draw(pass);
  }
}
