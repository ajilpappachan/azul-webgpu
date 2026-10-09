import type { Vec4 } from "@azul/math";
import { Mesh } from "./Mesh";
import type { Renderer } from "./Renderer";
import type { Texture } from "./Texture";

export class Material {
  readonly label: string;
  readonly pipeline: GPURenderPipeline;

  private uniformBuffer: GPUBuffer;
  private bindGroup: GPUBindGroup;

  constructor(
    renderer: Renderer,
    label: string,
    module: GPUShaderModule,
    baseColor: Vec4,
    texture: Texture | null,
  ) {
    const device: GPUDevice = renderer.device;
    this.label = label;

    const layoutEntries: GPUBindGroupLayoutEntry[] = [
      {
        binding: 0,
        visibility: GPUShaderStage.FRAGMENT,
        buffer: { type: "uniform" },
      },
    ];
    if (texture) {
      layoutEntries.push(
        {
          binding: 1,
          visibility: GPUShaderStage.FRAGMENT,
          texture: { sampleType: "float" },
        },
        {
          binding: 2,
          visibility: GPUShaderStage.FRAGMENT,
          sampler: { type: "filtering" },
        },
      );
    }
    const layout: GPUBindGroupLayout = device.createBindGroupLayout({
      label: `${label} material layout`,
      entries: layoutEntries,
    });

    this.pipeline = device.createRenderPipeline({
      label: `${label} pipeline`,
      layout: device.createPipelineLayout({
        label: `${label} pipeline layout`,
        bindGroupLayouts: [renderer.frameLayout, layout, renderer.objectLayout],
      }),
      vertex: {
        module,
        entryPoint: "vs_main",
        buffers: [Mesh.layout],
      },
      fragment: {
        module,
        entryPoint: "fs_main",
        targets: [{ format: renderer.format }],
      },
      primitive: {
        topology: "triangle-list",
        frontFace: "ccw",
        cullMode: "back",
      },
      depthStencil: {
        format: renderer.depthFormat,
        depthWriteEnabled: true,
        depthCompare: "less",
      },
    });

    const data: Float32Array = new Float32Array(4); // just base color now
    baseColor.copyTo(data);
    this.uniformBuffer = device.createBuffer({
      label: `${label} material`,
      size: data.byteLength,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });
    device.queue.writeBuffer(this.uniformBuffer, 0, data);

    const entries: GPUBindGroupEntry[] = [
      {
        binding: 0,
        resource: {
          buffer: this.uniformBuffer,
        },
      },
    ];
    if (texture) {
      entries.push(
        {
          binding: 1,
          resource: texture.texture.createView(),
        },
        {
          binding: 2,
          resource: texture.sampler,
        },
      );
    }
    this.bindGroup = device.createBindGroup({
      label: `${label} material`,
      layout,
      entries,
    });
  }

  draw(
    pass: GPURenderPassEncoder,
    mesh: Mesh,
    objectBindGroup: GPUBindGroup,
  ): void {
    pass.setPipeline(this.pipeline);
    pass.setBindGroup(1, this.bindGroup);
    pass.setBindGroup(2, objectBindGroup);
    mesh.draw(pass);
  }
}
