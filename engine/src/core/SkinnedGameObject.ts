import { Quat } from "@azul/math";
import { GameObject } from "./GameObject";
import { Skeleton } from "../animation/Skeleton";
import type { Renderer } from "../graphics/Renderer";
import type { SkinnedMesh } from "../graphics/SkinnedMesh";
import type { Material } from "../graphics/Material";

export class SkinnedGameObject extends GameObject {
  readonly skeleton: Skeleton;

  private pose: Float32Array;
  private palette: Float32Array;
  private paletteBuffer: GPUBuffer;

  constructor(
    renderer: Renderer,
    name: string,
    mesh: SkinnedMesh,
    material: Material,
    skeleton: Skeleton,
  ) {
    const paletteBuffer: GPUBuffer = renderer.device.createBuffer({
      label: `${name} palette`,
      size: skeleton.boneCount * 64,
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
    });
    super(renderer, name, mesh, material, paletteBuffer);

    this.skeleton = skeleton;
    this.pose = skeleton.restPose.slice();
    this.palette = new Float32Array(skeleton.boneCount * 16);
    this.paletteBuffer = paletteBuffer;
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
    this.skeleton.computePalette(this.pose, this.palette);
    this.device.queue.writeBuffer(this.paletteBuffer, 0, this.palette);
  }
}
