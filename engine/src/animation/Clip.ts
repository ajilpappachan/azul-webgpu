import { Quat, Vec3 } from "@azul/math";
import { Skeleton } from "./Skeleton";

export class Clip {
  static readonly FRAME_RATE: number = 24;

  readonly name: string;
  readonly boneCount: number;
  readonly frameCount: number;
  readonly duration: number;
  readonly frames: Float32Array;

  private ta: Vec3;
  private tb: Vec3;
  private qa: Quat;
  private qb: Quat;
  private sa: Vec3;
  private sb: Vec3;

  constructor(
    name: string,
    boneCount: number,
    frameCount: number,
    duration: number,
    frames: Float32Array,
  ) {
    if (frameCount < 2) {
      throw new Error(`Clip ${name}: ${frameCount} frames, expected 2 or more`);
    }
    if (frames.length !== frameCount * boneCount * Skeleton.POSE_STRIDE) {
      throw new Error(
        `Clip ${name}: frame array does not match ${frameCount} x ${boneCount}`,
      );
    }

    this.name = name;
    this.boneCount = boneCount;
    this.frameCount = frameCount;
    this.duration = duration;
    this.frames = frames;

    this.ta = new Vec3(0, 0, 0);
    this.tb = new Vec3(0, 0, 0);
    this.qa = Quat.identity();
    this.qb = Quat.identity();
    this.sa = new Vec3(1, 1, 1);
    this.sb = new Vec3(1, 1, 1);
  }

  sample(phase: number, out: Float32Array): void {
    const f: number = phase * (this.frameCount - 1);
    const frame: number = Math.min(Math.floor(f), this.frameCount - 2);
    const u: number = f - frame;
    const frameSize: number = this.boneCount * Skeleton.POSE_STRIDE;
    const a0: number = frame * frameSize;
    const b0: number = a0 + frameSize;

    for (let b = 0; b < this.boneCount; b++) {
      const p: number = b * Skeleton.POSE_STRIDE;
      const a: number = a0 + p;
      const c: number = b0 + p;

      this.ta.set(this.frames[a + 0], this.frames[a + 1], this.frames[a + 2]);
      this.tb.set(this.frames[c + 0], this.frames[c + 1], this.frames[c + 2]);
      Vec3.lerp(this.ta, this.tb, u, this.ta).copyTo(out, p + 0);

      this.qa.set(
        this.frames[a + 4],
        this.frames[a + 5],
        this.frames[a + 6],
        this.frames[a + 7],
      );
      this.qb.set(
        this.frames[c + 4],
        this.frames[c + 5],
        this.frames[c + 6],
        this.frames[c + 7],
      );
      Quat.slerp(this.qa, this.qb, u, this.qa).copyTo(out, p + 4);

      this.sa.set(this.frames[a + 8], this.frames[a + 9], this.frames[a + 10]);
      this.sb.set(this.frames[c + 8], this.frames[c + 9], this.frames[c + 10]);
      Vec3.lerp(this.sa, this.sb, u, this.sa).copyTo(out, p + 8);
    }
  }
}
