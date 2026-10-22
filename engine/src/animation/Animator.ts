import { Quat, Vec3 } from "@azul/math";
import { Skeleton } from "./Skeleton";
import type { Clip } from "./Clip";

export class Animator {
  readonly clipA: Clip;
  readonly clipB: Clip | null;
  speed: number;
  playing: boolean;
  blend: number;

  private phase: number;
  private poseB: Float32Array;
  private ta: Vec3;
  private tb: Vec3;
  private qa: Quat;
  private qb: Quat;
  private sa: Vec3;
  private sb: Vec3;

  constructor(clipA: Clip, clipB: Clip | null) {
    if (clipB !== null && clipB.boneCount !== clipA.boneCount) {
      throw new Error(
        `Animator: ${clipA.name} has ${clipA.boneCount} bones, ${clipB.name} has ${clipB.boneCount}`,
      );
    }

    this.clipA = clipA;
    this.clipB = clipB;
    this.speed = 1.0;
    this.playing = true;
    this.blend = 0.0;
    this.phase = 0.0;
    this.poseB = new Float32Array(clipA.boneCount * Skeleton.POSE_STRIDE);
    this.ta = new Vec3(0, 0, 0);
    this.tb = new Vec3(0, 0, 0);
    this.qa = Quat.identity();
    this.qb = Quat.identity();
    this.sa = new Vec3(1, 1, 1);
    this.sb = new Vec3(1, 1, 1);
  }

  getPhase(): number {
    return this.phase;
  }

  setPhase(phase: number): void {
    this.phase = phase - Math.floor(phase);
  }

  getCycleDuration(): number {
    if (this.clipB === null) {
      return this.clipA.duration;
    }
    return (
      this.clipA.duration +
      (this.clipB.duration - this.clipA.duration) * this.blend
    );
  }

  update(dt: number): void {
    if (this.playing) {
      this.setPhase(this.phase + (dt * this.speed) / this.getCycleDuration());
    }
  }

  writePose(pose: Float32Array): void {
    this.clipA.sample(this.phase, pose);
    if (this.clipB === null || this.blend <= 0.0) {
      return;
    }
    this.clipB.sample(this.phase, this.poseB);
    this.blendPose(pose, this.poseB, this.blend);
  }

  private blendPose(pose: Float32Array, other: Float32Array, u: number): void {
    for (let b = 0; b < this.clipA.boneCount; b++) {
      const p: number = b * Skeleton.POSE_STRIDE;

      this.ta.set(pose[p + 0], pose[p + 1], pose[p + 2]);
      this.tb.set(other[p + 0], other[p + 1], other[p + 2]);
      Vec3.lerp(this.ta, this.tb, u, this.ta).copyTo(pose, p + 0);

      this.qa.set(pose[p + 4], pose[p + 5], pose[p + 6], pose[p + 7]);
      this.qb.set(other[p + 4], other[p + 5], other[p + 6], other[p + 7]);
      Quat.slerp(this.qa, this.qb, u, this.qa).copyTo(pose, p + 4);

      this.sa.set(pose[p + 8], pose[p + 9], pose[p + 10]);
      this.sb.set(other[p + 8], other[p + 9], other[p + 10]);
      Vec3.lerp(this.sa, this.sb, u, this.sa).copyTo(pose, p + 8);
    }
  }
}
