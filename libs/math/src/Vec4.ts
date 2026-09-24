import { MATH_TOLERANCE } from "./Constants";

export class Vec4 {
  static fromArray(a: ArrayLike<number>, offset: number = 0): Vec4 {
    return new Vec4(a[offset], a[offset + 1], a[offset + 2], a[offset + 3]);
  }

  static lerp(a: Vec4, b: Vec4, t: number, out: Vec4 = new Vec4()): Vec4 {
    out.data[0] = a.data[0] + (b.data[0] - a.data[0]) * t;
    out.data[1] = a.data[1] + (b.data[1] - a.data[1]) * t;
    out.data[2] = a.data[2] + (b.data[2] - a.data[2]) * t;
    out.data[3] = a.data[3] + (b.data[3] - a.data[3]) * t;
    return out;
  }

  private data: Float32Array;

  constructor(x: number = 0, y: number = 0, z: number = 0, w: number = 0) {
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

  set(x: number, y: number, z: number, w: number): Vec4 {
    this.data[0] = x;
    this.data[1] = y;
    this.data[2] = z;
    this.data[3] = w;
    return this;
  }

  clone(): Vec4 {
    return new Vec4(this.data[0], this.data[1], this.data[2], this.data[3]);
  }

  copyTo(dst: Float32Array, offset: number = 0): void {
    dst.set(this.data, offset);
  }

  isEqual(v: Vec4, epsilon: number = MATH_TOLERANCE): boolean {
    return (
      Math.abs(this.data[0] - v.data[0]) <= epsilon &&
      Math.abs(this.data[1] - v.data[1]) <= epsilon &&
      Math.abs(this.data[2] - v.data[2]) <= epsilon &&
      Math.abs(this.data[3] - v.data[3]) <= epsilon
    );
  }

  add(v: Vec4): Vec4 {
    return new Vec4(
      this.data[0] + v.data[0],
      this.data[1] + v.data[1],
      this.data[2] + v.data[2],
      this.data[3] + v.data[3],
    );
  }

  sub(v: Vec4): Vec4 {
    return new Vec4(
      this.data[0] - v.data[0],
      this.data[1] - v.data[1],
      this.data[2] - v.data[2],
      this.data[3] - v.data[3],
    );
  }

  scale(s: number): Vec4 {
    return new Vec4(
      this.data[0] * s,
      this.data[1] * s,
      this.data[2] * s,
      this.data[3] * s,
    );
  }

  dot(v: Vec4): number {
    return (
      this.data[0] * v.data[0] +
      this.data[1] * v.data[1] +
      this.data[2] * v.data[2] +
      this.data[3] * v.data[3]
    );
  }

  length(): number {
    return Math.sqrt(this.dot(this));
  }

  normalize(): Vec4 {
    const len: number = this.length();
    if (len === 0) {
      return new Vec4(0, 0, 0, 0);
    }
    return this.scale(1 / len);
  }
}
