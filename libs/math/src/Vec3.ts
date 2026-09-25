import { MATH_TOLERANCE } from "./Constants";

export class Vec3 {
  private data: Float32Array;

  constructor(x: number = 0, y: number = 0, z: number = 0) {
    this.data = new Float32Array(3);
    this.data[0] = x;
    this.data[1] = y;
    this.data[2] = z;
  }

  static fromArray(a: ArrayLike<number>, offset: number = 0): Vec3 {
    return new Vec3(a[offset], a[offset + 1], a[offset + 2]);
  }

  static lerp(a: Vec3, b: Vec3, t: number, out: Vec3 = new Vec3()): Vec3 {
    out.data[0] = a.data[0] + (b.data[0] - a.data[0]) * t;
    out.data[1] = a.data[1] + (b.data[1] - a.data[1]) * t;
    out.data[2] = a.data[2] + (b.data[2] - a.data[2]) * t;
    return out;
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

  set(x: number, y: number, z: number): Vec3 {
    this.data[0] = x;
    this.data[1] = y;
    this.data[2] = z;
    return this;
  }

  clone(): Vec3 {
    return new Vec3(this.data[0], this.data[1], this.data[2]);
  }

  copyTo(dst: Float32Array, offset: number = 0): void {
    dst.set(this.data, offset);
  }

  isEqual(v: Vec3, epsilon: number = MATH_TOLERANCE): boolean {
    return (
      Math.abs(this.data[0] - v.data[0]) <= epsilon &&
      Math.abs(this.data[1] - v.data[1]) <= epsilon &&
      Math.abs(this.data[2] - v.data[2]) <= epsilon
    );
  }

  add(v: Vec3): Vec3 {
    return new Vec3(
      this.data[0] + v.data[0],
      this.data[1] + v.data[1],
      this.data[2] + v.data[2],
    );
  }

  sub(v: Vec3): Vec3 {
    return new Vec3(
      this.data[0] - v.data[0],
      this.data[1] - v.data[1],
      this.data[2] - v.data[2],
    );
  }

  scale(s: number): Vec3 {
    return new Vec3(this.data[0] * s, this.data[1] * s, this.data[2] * s);
  }

  dot(v: Vec3): number {
    return (
      this.data[0] * v.data[0] +
      this.data[1] * v.data[1] +
      this.data[2] * v.data[2]
    );
  }

  cross(v: Vec3): Vec3 {
    const ax: number = this.data[0],
      ay: number = this.data[1],
      az: number = this.data[2];
    const bx: number = v.data[0],
      by: number = v.data[1],
      bz: number = v.data[2];
    return new Vec3(ay * bz - az * by, az * bx - ax * bz, ax * by - ay * bx);
  }

  length(): number {
    return Math.sqrt(this.dot(this));
  }

  normalize(): Vec3 {
    const len: number = this.length();
    if (len === 0) {
      return new Vec3(0, 0, 0);
    }
    return this.scale(1 / len);
  }
}
