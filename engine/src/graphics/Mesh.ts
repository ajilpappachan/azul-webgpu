export class Mesh {
  static readonly layout: GPUVertexBufferLayout = {
    arrayStride: 32,
    attributes: [
      { shaderLocation: 0, offset: 0, format: "float32x3" },
      { shaderLocation: 1, offset: 12, format: "float32x3" },
      { shaderLocation: 2, offset: 24, format: "float32x2" },
    ],
  };

  readonly label: string;

  private vertexBuffer: GPUBuffer;
  private indexBuffer: GPUBuffer;
  private indexCount: number;

  constructor(
    device: GPUDevice,
    label: string,
    vertices: Float32Array,
    indices: Uint32Array,
  ) {
    this.label = label;
    this.indexCount = indices.length;

    this.vertexBuffer = device.createBuffer({
      label: `${label} vertex buffer`,
      size: vertices.byteLength,
      usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
    });
    device.queue.writeBuffer(this.vertexBuffer, 0, vertices);

    this.indexBuffer = device.createBuffer({
      label: `${label} index buffer`,
      size: indices.byteLength,
      usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST,
    });
    device.queue.writeBuffer(this.indexBuffer, 0, indices);
  }

  static cube(device: GPUDevice, size: number): Mesh {
    const h: number = size * 0.5;
    const faces: number[][] = [
      [1, 0, 0, 0, 0, -1, 0, 1, 0],
      [-1, 0, 0, 0, 0, 1, 0, 1, 0],
      [0, 1, 0, 1, 0, 0, 0, 0, -1],
      [0, -1, 0, 1, 0, 0, 0, 0, 1],
      [0, 0, 1, 1, 0, 0, 0, 1, 0],
      [0, 0, -1, -1, 0, 0, 0, 1, 0],
    ];
    const corners: number[][] = [
      [-1, -1, 0, 1],
      [1, -1, 1, 1],
      [1, 1, 1, 0],
      [-1, 1, 0, 0],
    ];

    const vertices: Float32Array = new Float32Array(faces.length * 4 * 8);
    const indices: Uint32Array = new Uint32Array(faces.length * 6);
    let v: number = 0;

    for (let f = 0; f < faces.length; f++) {
      const [nx, ny, nz, ux, uy, uz, vx, vy, vz] = faces[f];
      for (const [su, sv, tu, tv] of corners) {
        vertices[v++] = (nx + su * ux + sv * vx) * h;
        vertices[v++] = (ny + su * uy + sv * vy) * h;
        vertices[v++] = (nz + su * uz + sv * vz) * h;
        vertices[v++] = nx;
        vertices[v++] = ny;
        vertices[v++] = nz;
        vertices[v++] = tu;
        vertices[v++] = tv;
      }
      const base: number = f * 4;
      indices.set([base, base + 1, base + 2, base, base + 2, base + 3], f * 6);
    }

    return new Mesh(device, "cube", vertices, indices);
  }

  draw(pass: GPURenderPassEncoder): void {
    pass.setVertexBuffer(0, this.vertexBuffer);
    pass.setIndexBuffer(this.indexBuffer, "uint32");
    pass.drawIndexed(this.indexCount);
  }
}
