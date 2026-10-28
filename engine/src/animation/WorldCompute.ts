import type { Renderer } from "../graphics/Renderer";

export class WorldCompute {
  static readonly WORKGROUP_SIZE: number = 64;

  readonly layout: GPUBindGroupLayout;
  readonly pipeline: GPUComputePipeline;

  constructor(renderer: Renderer, module: GPUShaderModule) {
    const device: GPUDevice = renderer.device;

    this.layout = device.createBindGroupLayout({
      label: "world compute layout",
      entries: [
        {
          binding: 0,
          visibility: GPUShaderStage.COMPUTE,
          buffer: { type: "uniform" },
        },
        {
          binding: 1,
          visibility: GPUShaderStage.COMPUTE,
          buffer: { type: "read-only-storage" },
        },
        {
          binding: 2,
          visibility: GPUShaderStage.COMPUTE,
          buffer: { type: "read-only-storage" },
        },
        {
          binding: 3,
          visibility: GPUShaderStage.COMPUTE,
          buffer: { type: "read-only-storage" },
        },
        {
          binding: 4,
          visibility: GPUShaderStage.COMPUTE,
          buffer: { type: "storage" },
        },
      ],
    });

    this.pipeline = device.createComputePipeline({
      label: "world compute pipeline",
      layout: device.createPipelineLayout({
        label: "world compute pipeline layout",
        bindGroupLayouts: [this.layout],
      }),
      compute: {
        module,
        entryPoint: "cs_main",
        constants: { WORKGROUP_SIZE: WorldCompute.WORKGROUP_SIZE },
      },
    });
  }

  dispatch(
    pass: GPUComputePassEncoder,
    bindGroup: GPUBindGroup,
    boneCount: number,
  ): void {
    pass.setPipeline(this.pipeline);
    pass.setBindGroup(0, bindGroup);
    pass.dispatchWorkgroups(Math.ceil(boneCount / WorldCompute.WORKGROUP_SIZE));
  }
}
