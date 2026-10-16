import { Mat4, Quat, Vec3 } from "@azul/math";

export class Skeleton {
  static readonly POSE_STRIDE: number = 12;

  readonly boneCount: number;
  readonly names: string[];
  readonly parent: Int32Array;
  readonly jointToBone: Int32Array;
  readonly inverseBind: Float32Array;
  readonly restPose: Float32Array;
  readonly rootParentWorld: Mat4;

  private inverseBindMats: Mat4[];
  private world: Mat4[];
  private local: Mat4;
  private skin: Mat4;
  private t: Vec3;
  private q: Quat;
  private s: Vec3;

  constructor(
    names: string[],
    parent: Int32Array,
    jointToBone: Int32Array,
    inverseBind: Float32Array,
    restPose: Float32Array,
    rootParentWorld: Mat4,
  ) {
    const boneCount: number = names.length;
    if (
      parent.length !== boneCount ||
      jointToBone.length !== boneCount ||
      inverseBind.length !== boneCount * 16 ||
      restPose.length !== boneCount * Skeleton.POSE_STRIDE
    ) {
      throw new Error(`Skeleton: array sizes do not match ${boneCount} bones`);
    }
    for (let b = 0; b < boneCount; b++) {
      if (parent[b] >= b) {
        throw new Error(`Skeleton: bone ${b} is not after its parent`);
      }
    }

    this.boneCount = boneCount;
    this.names = names;
    this.parent = parent;
    this.jointToBone = jointToBone;
    this.inverseBind = inverseBind;
    this.restPose = restPose;
    this.rootParentWorld = rootParentWorld;

    this.inverseBindMats = [];
    this.world = [];
    for (let b = 0; b < boneCount; b++) {
      this.inverseBindMats.push(Mat4.fromArray(inverseBind, b * 16));
      this.world.push(Mat4.identity());
    }
    this.local = Mat4.identity();
    this.skin = Mat4.identity();
    this.t = new Vec3(0, 0, 0);
    this.q = Quat.identity();
    this.s = new Vec3(1, 1, 1);
  }

  findBone(name: string): number {
    return this.names.indexOf(name);
  }

  computePalette(pose: Float32Array, out: Float32Array): void {
    for (let b = 0; b < this.boneCount; b++) {
      const p: number = b * Skeleton.POSE_STRIDE;
      this.t.set(pose[p + 0], pose[p + 1], pose[p + 2]);
      this.q.set(pose[p + 4], pose[p + 5], pose[p + 6], pose[p + 7]);
      this.s.set(pose[p + 8], pose[p + 9], pose[p + 10]);
      Mat4.fromTRS(this.t, this.q, this.s, this.local);

      const parentWorld: Mat4 =
        this.parent[b] < 0 ? this.rootParentWorld : this.world[this.parent[b]];
      Mat4.multiply(parentWorld, this.local, this.world[b]);

      Mat4.multiply(this.world[b], this.inverseBindMats[b], this.skin);
      this.skin.copyTo(out, b * 16);
    }
  }
}
