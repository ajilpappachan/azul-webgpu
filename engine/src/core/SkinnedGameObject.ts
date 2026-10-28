import { Quat } from "@azul/math";
import { GameObject } from "./GameObject";
import { Skeleton } from "../animation/Skeleton";
import type { Animator } from "../animation/Animator";
import type { WorldCompute } from "../animation/WorldCompute";
import type { Renderer } from "../graphics/Renderer";
import type { SkinnedMesh } from "../graphics/SkinnedMesh";
import type { Material } from "../graphics/Material";

export class SkinnedGameObject extends GameObject {
  readonly skeleton: Skeleton;
  animator: Animator | null;
  gpuWorld: boolean;

  private pose: Float32Array;
  private palette: Float32Array;
  private paletteBuffer: GPUBuffer;
  private poseBuffer: GPUBuffer;
  private worldCompute: WorldCompute;
  private worldBindGroup: GPUBindGroup;

  constructor(
    renderer: Renderer,
    name: string,
    mesh: SkinnedMesh,
    material: Material,
    skeleton: Skeleton,
    worldCompute: WorldCompute,
  ) {
    const device: GPUDevice = renderer.device;
    const paletteBuffer: GPUBuffer = device.createBuffer({
      label: `${name} palette`,
      size: skeleton.boneCount * 64,
      usage:
        GPUBufferUsage.STORAGE |
        GPUBufferUsage.COPY_DST |
        GPUBufferUsage.COPY_SRC,
    });
    super(renderer, name, mesh, material, paletteBuffer);

    this.skeleton = skeleton;
    this.animator = null;
    this.gpuWorld = false;
    this.pose = skeleton.restPose.slice();
    this.palette = new Float32Array(skeleton.boneCount * 16);
    this.paletteBuffer = paletteBuffer;

    const rootParentWorldData: Float32Array = new Float32Array(16);
    skeleton.rootParentWorld.copyTo(rootParentWorldData);
    const rootParentWorldBuffer: GPUBuffer = device.createBuffer({
      label: `${name} root parent world`,
      size: rootParentWorldData.byteLength,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });
    device.queue.writeBuffer(rootParentWorldBuffer, 0, rootParentWorldData);

    const parentBuffer: GPUBuffer = device.createBuffer({
      label: `${name} parent`,
      size: skeleton.parent.byteLength,
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
    });
    device.queue.writeBuffer(parentBuffer, 0, skeleton.parent);

    const inverseBindBuffer: GPUBuffer = device.createBuffer({
      label: `${name} inverse bind`,
      size: skeleton.inverseBind.byteLength,
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
    });
    device.queue.writeBuffer(inverseBindBuffer, 0, skeleton.inverseBind);

    this.poseBuffer = device.createBuffer({
      label: `${name} pose`,
      size: this.pose.byteLength,
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
    });

    this.worldCompute = worldCompute;
    this.worldBindGroup = device.createBindGroup({
      label: `${name} world compute`,
      layout: worldCompute.layout,
      entries: [
        { binding: 0, resource: { buffer: rootParentWorldBuffer } },
        { binding: 1, resource: { buffer: parentBuffer } },
        { binding: 2, resource: { buffer: inverseBindBuffer } },
        { binding: 3, resource: { buffer: this.poseBuffer } },
        { binding: 4, resource: { buffer: this.paletteBuffer } },
      ],
    });
  }

  resetPose(): void {
    this.pose.set(this.skeleton.restPose);
  }

  setBoneRotation(bone: number, q: Quat): void {
    const p: number = bone * Skeleton.POSE_STRIDE;
    q.copyTo(this.pose, p + 4);
  }

  getRestRotation(bone: number): Quat {
    return Quat.fromArray(
      this.skeleton.restPose,
      bone * Skeleton.POSE_STRIDE + 4,
    );
  }

  override update(): void {
    super.update();
    if (this.animator !== null) {
      this.animator.writePose(this.pose);
    }
    if (this.gpuWorld) {
      this.device.queue.writeBuffer(this.poseBuffer, 0, this.pose);
    } else {
      this.skeleton.computePalette(this.pose, this.palette);
      this.device.queue.writeBuffer(this.paletteBuffer, 0, this.palette);
    }
  }

  override compute(pass: GPUComputePassEncoder): void {
    if (this.gpuWorld) {
      this.worldCompute.dispatch(
        pass,
        this.worldBindGroup,
        this.skeleton.boneCount,
      );
    }
  }

  async checkPalette(): Promise<number> {
    const expected: Float32Array = new Float32Array(this.palette.length);
    this.skeleton.computePalette(this.pose, expected);

    const readback: GPUBuffer = this.device.createBuffer({
      label: "palette readback",
      size: expected.byteLength,
      usage: GPUBufferUsage.MAP_READ | GPUBufferUsage.COPY_DST,
    });
    const encoder: GPUCommandEncoder = this.device.createCommandEncoder();
    encoder.copyBufferToBuffer(
      this.paletteBuffer,
      0,
      readback,
      0,
      expected.byteLength,
    );
    this.device.queue.submit([encoder.finish()]);

    await readback.mapAsync(GPUMapMode.READ);
    const gpu: Float32Array = new Float32Array(readback.getMappedRange());
    let maxError: number = 0;
    for (let i = 0; i < expected.length; i++) {
      maxError = Math.max(maxError, Math.abs(gpu[i] - expected[i]));
    }
    readback.unmap();
    readback.destroy();
    return maxError;
  }
}
