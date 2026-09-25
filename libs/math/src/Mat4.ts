import { MATH_TOLERANCE } from "./Constants";
import { Vec3 } from "./Vec3";
import { Vec4 } from "./Vec4";
import type { Quat } from "./Quat";

export class Mat4 {
  private data: Float32Array;

  constructor() {
    this.data = new Float32Array(16);
    this.data[0] = 1;
    this.data[5] = 1;
    this.data[10] = 1;
    this.data[15] = 1;
  }

  static fromArray(a: ArrayLike<number>, offset: number = 0): Mat4 {
    const m: Mat4 = new Mat4();
    for (let i = 0; i < 16; i++) {
      m.data[i] = a[offset + i];
    }
    return m;
  }

  static identity(): Mat4 {
    return new Mat4();
  }

  static translation(v: Vec3): Mat4 {
    const m: Mat4 = new Mat4();
    m.data[12] = v.x;
    m.data[13] = v.y;
    m.data[14] = v.z;
    return m;
  }

  static scale(v: Vec3): Mat4 {
    const m: Mat4 = new Mat4();
    m.data[0] = v.x;
    m.data[5] = v.y;
    m.data[10] = v.z;
    return m;
  }

  static fromQuat(q: Quat): Mat4 {
    return Mat4.fromTRS(new Vec3(0, 0, 0), q, new Vec3(1, 1, 1));
  }

  static fromTRS(t: Vec3, q: Quat, s: Vec3, out: Mat4 = new Mat4()): Mat4 {
    const x: number = q.x,
      y: number = q.y,
      z: number = q.z,
      w: number = q.w;
    const x2: number = x + x,
      y2: number = y + y,
      z2: number = z + z;

    const xx: number = x * x2,
      xy: number = x * y2,
      xz: number = x * z2;
    const yy: number = y * y2,
      yz: number = y * z2,
      zz: number = z * z2;
    const wx: number = w * x2,
      wy: number = w * y2,
      wz: number = w * z2;

    const sx: number = s.x,
      sy: number = s.y,
      sz: number = s.z;

    const o: Float32Array = out.data;
    o[0] = (1 - (yy + zz)) * sx;
    o[1] = (xy + wz) * sx;
    o[2] = (xz - wy) * sx;
    o[3] = 0;
    o[4] = (xy - wz) * sy;
    o[5] = (1 - (xx + zz)) * sy;
    o[6] = (yz + wx) * sy;
    o[7] = 0;
    o[8] = (xz + wy) * sz;
    o[9] = (yz - wx) * sz;
    o[10] = (1 - (xx + yy)) * sz;
    o[11] = 0;
    o[12] = t.x;
    o[13] = t.y;
    o[14] = t.z;
    o[15] = 1;
    return out;
  }

  static perspective(
    fovY: number,
    aspect: number,
    near: number,
    far: number,
  ): Mat4 {
    const f: number = 1 / Math.tan(fovY * 0.5);
    const m: Mat4 = new Mat4();
    const o: Float32Array = m.data;
    o[0] = f / aspect;
    o[5] = f;
    o[11] = -1;
    o[15] = 0;
    if (far !== Infinity) {
      const nf: number = 1 / (near - far);
      o[10] = far * nf;
      o[14] = far * near * nf;
    } else {
      o[10] = -1;
      o[14] = -near;
    }
    return m;
  }

  static lookAt(eye: Vec3, target: Vec3, up: Vec3): Mat4 {
    const forward: Vec3 = eye.sub(target);
    if (forward.length() === 0) {
      return new Mat4();
    }
    const z: Vec3 = forward.normalize();
    const x: Vec3 = up.cross(z).normalize();
    const y: Vec3 = z.cross(x).normalize();

    const m: Mat4 = new Mat4();
    const o: Float32Array = m.data;
    o[0] = x.x;
    o[1] = y.x;
    o[2] = z.x;
    o[4] = x.y;
    o[5] = y.y;
    o[6] = z.y;
    o[8] = x.z;
    o[9] = y.z;
    o[10] = z.z;
    o[12] = -x.dot(eye);
    o[13] = -y.dot(eye);
    o[14] = -z.dot(eye);
    return m;
  }

  static multiply(a: Mat4, b: Mat4, out: Mat4 = new Mat4()): Mat4 {
    const ad: Float32Array = a.data;
    const a00: number = ad[0],
      a01: number = ad[1],
      a02: number = ad[2],
      a03: number = ad[3];
    const a10: number = ad[4],
      a11: number = ad[5],
      a12: number = ad[6],
      a13: number = ad[7];
    const a20: number = ad[8],
      a21: number = ad[9],
      a22: number = ad[10],
      a23: number = ad[11];
    const a30: number = ad[12],
      a31: number = ad[13],
      a32: number = ad[14],
      a33: number = ad[15];

    const bd: Float32Array = b.data;
    const o: Float32Array = out.data;
    for (let col = 0; col < 4; col++) {
      const b0: number = bd[col * 4];
      const b1: number = bd[col * 4 + 1];
      const b2: number = bd[col * 4 + 2];
      const b3: number = bd[col * 4 + 3];
      o[col * 4] = a00 * b0 + a10 * b1 + a20 * b2 + a30 * b3;
      o[col * 4 + 1] = a01 * b0 + a11 * b1 + a21 * b2 + a31 * b3;
      o[col * 4 + 2] = a02 * b0 + a12 * b1 + a22 * b2 + a32 * b3;
      o[col * 4 + 3] = a03 * b0 + a13 * b1 + a23 * b2 + a33 * b3;
    }
    return out;
  }

  get(row: number, col: number): number {
    return this.data[col * 4 + row];
  }

  set(row: number, col: number, value: number): void {
    this.data[col * 4 + row] = value;
  }

  copyTo(dst: Float32Array, offset: number = 0): void {
    dst.set(this.data, offset);
  }

  clone(): Mat4 {
    const m: Mat4 = new Mat4();
    m.data.set(this.data);
    return m;
  }

  isEqual(m: Mat4, epsilon: number = MATH_TOLERANCE): boolean {
    for (let i = 0; i < 16; i++) {
      if (Math.abs(this.data[i] - m.data[i]) > epsilon) {
        return false;
      }
    }
    return true;
  }

  transpose(): Mat4 {
    const m: Mat4 = new Mat4();
    for (let col = 0; col < 4; col++) {
      for (let row = 0; row < 4; row++) {
        m.data[row * 4 + col] = this.data[col * 4 + row];
      }
    }
    return m;
  }

  invert(): Mat4 | null {
    const d: Float32Array = this.data;
    const a00: number = d[0],
      a01: number = d[1],
      a02: number = d[2],
      a03: number = d[3];
    const a10: number = d[4],
      a11: number = d[5],
      a12: number = d[6],
      a13: number = d[7];
    const a20: number = d[8],
      a21: number = d[9],
      a22: number = d[10],
      a23: number = d[11];
    const a30: number = d[12],
      a31: number = d[13],
      a32: number = d[14],
      a33: number = d[15];

    const b00: number = a00 * a11 - a01 * a10;
    const b01: number = a00 * a12 - a02 * a10;
    const b02: number = a00 * a13 - a03 * a10;
    const b03: number = a01 * a12 - a02 * a11;
    const b04: number = a01 * a13 - a03 * a11;
    const b05: number = a02 * a13 - a03 * a12;
    const b06: number = a20 * a31 - a21 * a30;
    const b07: number = a20 * a32 - a22 * a30;
    const b08: number = a20 * a33 - a23 * a30;
    const b09: number = a21 * a32 - a22 * a31;
    const b10: number = a21 * a33 - a23 * a31;
    const b11: number = a22 * a33 - a23 * a32;

    const det: number =
      b00 * b11 - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06;
    if (det === 0) {
      return null;
    }
    const inv: number = 1 / det;

    const m: Mat4 = new Mat4();
    const o: Float32Array = m.data;
    o[0] = (a11 * b11 - a12 * b10 + a13 * b09) * inv;
    o[1] = (a02 * b10 - a01 * b11 - a03 * b09) * inv;
    o[2] = (a31 * b05 - a32 * b04 + a33 * b03) * inv;
    o[3] = (a22 * b04 - a21 * b05 - a23 * b03) * inv;
    o[4] = (a12 * b08 - a10 * b11 - a13 * b07) * inv;
    o[5] = (a00 * b11 - a02 * b08 + a03 * b07) * inv;
    o[6] = (a32 * b02 - a30 * b05 - a33 * b01) * inv;
    o[7] = (a20 * b05 - a22 * b02 + a23 * b01) * inv;
    o[8] = (a10 * b10 - a11 * b08 + a13 * b06) * inv;
    o[9] = (a01 * b08 - a00 * b10 - a03 * b06) * inv;
    o[10] = (a30 * b04 - a31 * b02 + a33 * b00) * inv;
    o[11] = (a21 * b02 - a20 * b04 - a23 * b00) * inv;
    o[12] = (a11 * b07 - a10 * b09 - a12 * b06) * inv;
    o[13] = (a00 * b09 - a01 * b07 + a02 * b06) * inv;
    o[14] = (a31 * b01 - a30 * b03 - a32 * b00) * inv;
    o[15] = (a20 * b03 - a21 * b01 + a22 * b00) * inv;
    return m;
  }

  transformVec4(v: Vec4): Vec4 {
    const d: Float32Array = this.data;
    const x: number = v.x,
      y: number = v.y,
      z: number = v.z,
      w: number = v.w;
    return new Vec4(
      d[0] * x + d[4] * y + d[8] * z + d[12] * w,
      d[1] * x + d[5] * y + d[9] * z + d[13] * w,
      d[2] * x + d[6] * y + d[10] * z + d[14] * w,
      d[3] * x + d[7] * y + d[11] * z + d[15] * w,
    );
  }
}
