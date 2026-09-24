import { MATH_TOLERANCE } from "./Constants";
import type { Vec3 } from "./Vec3";

const SLERP_EPSILON: number = 0.000001;

export class Quat {
  static fromArray(a: ArrayLike<number>, offset: number = 0): Quat {
    return new Quat(a[offset], a[offset + 1], a[offset + 2], a[offset + 3]);
  }

  static identity(): Quat {
    return new Quat(0, 0, 0, 1);
  }

  static fromAxisAngle(axis: Vec3, radians: number): Quat {
    const half: number = radians * 0.5;
    const s: number = Math.sin(half);
    return new Quat(
      axis.x * s,
      axis.y * s,
      axis.z * s,
      Math.cos(half),
    );
  }

  static slerp(a: Quat, b: Quat, t: number, out: Quat = new Quat()): Quat {
    const ax: number = a.data[0],
      ay: number = a.data[1],
      az: number = a.data[2],
      aw: number = a.data[3];
    let bx: number = b.data[0],
      by: number = b.data[1],
      bz: number = b.data[2],
      bw: number = b.data[3];

    let cosOmega: number = ax * bx + ay * by + az * bz + aw * bw;
    if (cosOmega < 0) {
      cosOmega = -cosOmega;
      bx = -bx;
      by = -by;
      bz = -bz;
      bw = -bw;
    }

    let scaleA: number;
    let scaleB: number;
    if (1 - cosOmega > SLERP_EPSILON) {
      const omega: number = Math.acos(cosOmega);
      const sinOmega: number = Math.sin(omega);
      scaleA = Math.sin((1 - t) * omega) / sinOmega;
      scaleB = Math.sin(t * omega) / sinOmega;
    } else {
      scaleA = 1 - t;
      scaleB = t;
    }

    out.data[0] = scaleA * ax + scaleB * bx;
    out.data[1] = scaleA * ay + scaleB * by;
    out.data[2] = scaleA * az + scaleB * bz;
    out.data[3] = scaleA * aw + scaleB * bw;
    return out;
  }

  private data: Float32Array;

  constructor(x: number = 0, y: number = 0, z: number = 0, w: number = 1) {
    this.data = new Float32Array(4);
    this.data[0] = x;
    this.data[1] = y;
    this.data[2] = z;
    this.data[3] = w;
  }

  get x(): number {
    return this.data[0];
  }
  set x(v: number) {
    this.data[0] = v;
  }
  get y(): number {
    return this.data[1];
  }
  set y(v: number) {
    this.data[1] = v;
  }
  get z(): number {
    return this.data[2];
  }
  set z(v: number) {
    this.data[2] = v;
  }
  get w(): number {
    return this.data[3];
  }
  set w(v: number) {
    this.data[3] = v;
  }

  set(x: number, y: number, z: number, w: number): Quat {
    this.data[0] = x;
    this.data[1] = y;
    this.data[2] = z;
    this.data[3] = w;
    return this;
  }

  clone(): Quat {
    return new Quat(this.data[0], this.data[1], this.data[2], this.data[3]);
  }

  copyTo(dst: Float32Array, offset: number = 0): void {
    dst.set(this.data, offset);
  }

  isEqual(q: Quat, epsilon: number = MATH_TOLERANCE): boolean {
    return (
      Math.abs(this.data[0] - q.data[0]) <= epsilon &&
      Math.abs(this.data[1] - q.data[1]) <= epsilon &&
      Math.abs(this.data[2] - q.data[2]) <= epsilon &&
      Math.abs(this.data[3] - q.data[3]) <= epsilon
    );
  }

  isEquivalent(q: Quat, epsilon: number = MATH_TOLERANCE): boolean {
    return (
      this.isEqual(q, epsilon) ||
      (Math.abs(this.data[0] + q.data[0]) <= epsilon &&
        Math.abs(this.data[1] + q.data[1]) <= epsilon &&
        Math.abs(this.data[2] + q.data[2]) <= epsilon &&
        Math.abs(this.data[3] + q.data[3]) <= epsilon)
    );
  }

  multiply(q: Quat): Quat {
    const ax: number = this.data[0],
      ay: number = this.data[1],
      az: number = this.data[2],
      aw: number = this.data[3];
    const bx: number = q.data[0],
      by: number = q.data[1],
      bz: number = q.data[2],
      bw: number = q.data[3];
    return new Quat(
      aw * bx + ax * bw + ay * bz - az * by,
      aw * by + ay * bw + az * bx - ax * bz,
      aw * bz + az * bw + ax * by - ay * bx,
      aw * bw - ax * bx - ay * by - az * bz,
    );
  }

  conjugate(): Quat {
    return new Quat(-this.data[0], -this.data[1], -this.data[2], this.data[3]);
  }

  dot(q: Quat): number {
    return (
      this.data[0] * q.data[0] +
      this.data[1] * q.data[1] +
      this.data[2] * q.data[2] +
      this.data[3] * q.data[3]
    );
  }

  length(): number {
    return Math.sqrt(this.dot(this));
  }

  normalize(): Quat {
    const len: number = this.length();
    if (len === 0) {
      return Quat.identity();
    }
    const inv: number = 1 / len;
    return new Quat(
      this.data[0] * inv,
      this.data[1] * inv,
      this.data[2] * inv,
      this.data[3] * inv,
    );
  }
}
