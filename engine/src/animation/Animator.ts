import type { Clip } from "./Clip";

export class Animator {
  readonly clip: Clip;
  speed: number;
  playing: boolean;

  private phase: number;

  constructor(clip: Clip) {
    this.clip = clip;
    this.speed = 1.0;
    this.playing = true;
    this.phase = 0.0;
  }

  getPhase(): number {
    return this.phase;
  }

  setPhase(phase: number): void {
    this.phase = phase - Math.floor(phase);
  }

  update(dt: number): void {
    if (this.playing) {
      this.setPhase(this.phase + (dt * this.speed) / this.clip.duration);
    }
  }

  writePose(pose: Float32Array): void {
    this.clip.sample(this.phase, pose);
  }
}
