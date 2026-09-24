import { describe, it, expect } from "vitest";
import { mat4, quat, vec3, vec4 } from "gl-matrix";
import { Mat4, Quat, Vec3, Vec4 } from "@azul/math";

describe("Mat4", () => {
  const t: Vec3 = new Vec3(3, -1, 2.5);
  const s: Vec3 = new Vec3(2, 0.5, 1.5);
  const q: Quat = Quat.fromAxisAngle(new Vec3(1, 2, 3).normalize(), 0.9);
  const gt: vec3 = vec3.fromValues(3, -1, 2.5);
  const gs: vec3 = vec3.fromValues(2, 0.5, 1.5);
  const gq: quat = quat.setAxisAngle(
    quat.create(),
    vec3.normalize(vec3.create(), vec3.fromValues(1, 2, 3)),
    0.9,
  );

  const m: Mat4 = Mat4.fromTRS(t, q, s);
  const n: Mat4 = Mat4.fromTRS(
    new Vec3(-1, 4, 0.5),
    Quat.fromAxisAngle(new Vec3(0, 1, 0), -1.3),
    new Vec3(1, 1, 1),
  );
  const gm: mat4 = mat4.fromRotationTranslationScale(mat4.create(), gq, gt, gs);
  const gn: mat4 = mat4.fromRotationTranslationScale(
    mat4.create(),
    quat.setAxisAngle(quat.create(), vec3.fromValues(0, 1, 0), -1.3),
    vec3.fromValues(-1, 4, 0.5),
    vec3.fromValues(1, 1, 1),
  );

  it("constructs as identity", () => {
    expect(
      new Mat4().isEqual(
        Mat4.fromArray([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]),
      ),
    ).toBe(true);
    expect(Mat4.identity().isEqual(Mat4.fromArray(mat4.create()))).toBe(true);
  });

  it("builds from an array at an offset", () => {
    const flat: number[] = [7, 7, ...gm];
    expect(Mat4.fromArray(flat, 2).isEqual(m)).toBe(true);
  });

  it("compares within a tolerance, on every element", () => {
    const near: Mat4 = m.clone();
    near.set(3, 3, near.get(3, 3) + 0.0005);
    expect(m.isEqual(near)).toBe(true);
    const off: Mat4 = m.clone();
    off.set(3, 3, off.get(3, 3) + 0.01);
    expect(m.isEqual(off)).toBe(false);
    expect(m.isEqual(off, 0.1)).toBe(true);
  });

  it("indexes by row and column", () => {
    const e: Mat4 = new Mat4();
    e.set(0, 3, 5);
    e.set(2, 1, -4);
    expect(e.get(0, 3)).toBe(5);
    expect(e.get(2, 1)).toBe(-4);
    expect(e.get(3, 0)).toBe(0);
    expect(e.isEqual(Mat4.translation(new Vec3(5, 0, 0)))).toBe(false);
    e.set(2, 1, 0);
    expect(e.isEqual(Mat4.translation(new Vec3(5, 0, 0)))).toBe(true);
  });

  it("packs several matrices into one buffer with copyTo", () => {
    const palette: Float32Array = new Float32Array(32);
    m.copyTo(palette, 0);
    n.copyTo(palette, 16);
    expect(Mat4.fromArray(palette, 0).isEqual(m)).toBe(true);
    expect(Mat4.fromArray(palette, 16).isEqual(n)).toBe(true);
  });

  it("is column-major: translation lives in elements 12, 13, 14", () => {
    const tr: Mat4 = Mat4.translation(t);
    expect(
      tr.isEqual(Mat4.fromArray(mat4.fromTranslation(mat4.create(), gt))),
    ).toBe(true);
    expect(tr.get(0, 3)).toBe(3);
    expect(tr.get(1, 3)).toBe(-1);
    expect(tr.get(2, 3)).toBe(2.5);
    const raw: Float32Array = new Float32Array(16);
    tr.copyTo(raw);
    expect(raw[12]).toBe(3);
    expect(raw[13]).toBe(-1);
    expect(raw[14]).toBe(2.5);
  });

  it("builds scale and rotation like gl-matrix", () => {
    expect(
      Mat4.scale(s).isEqual(
        Mat4.fromArray(mat4.fromScaling(mat4.create(), gs)),
      ),
    ).toBe(true);
    expect(
      Mat4.fromQuat(q).isEqual(
        Mat4.fromArray(mat4.fromQuat(mat4.create(), gq)),
      ),
    ).toBe(true);
  });

  it("builds TRS like gl-matrix, equal to T x R x S", () => {
    expect(m.isEqual(Mat4.fromArray(gm))).toBe(true);
    const composed: Mat4 = Mat4.multiply(
      Mat4.multiply(Mat4.translation(t), Mat4.fromQuat(q)),
      Mat4.scale(s),
    );
    expect(m.isEqual(composed)).toBe(true);
  });

  it("overwrites every element of an out matrix in fromTRS", () => {
    const out: Mat4 = new Mat4();
    for (let row = 0; row < 4; row++) {
      for (let col = 0; col < 4; col++) {
        out.set(row, col, 9);
      }
    }
    expect(Mat4.fromTRS(t, q, s, out)).toBe(out);
    expect(out.isEqual(Mat4.fromArray(gm))).toBe(true);
  });

  it("multiplies like gl-matrix, in the order given", () => {
    expect(
      Mat4.multiply(m, n).isEqual(
        Mat4.fromArray(mat4.multiply(mat4.create(), gm, gn)),
      ),
    ).toBe(true);
    expect(
      Mat4.multiply(n, m).isEqual(
        Mat4.fromArray(mat4.multiply(mat4.create(), gn, gm)),
      ),
    ).toBe(true);
  });

  it("multiplies into an out matrix that aliases either operand", () => {
    const expected: Mat4 = Mat4.fromArray(mat4.multiply(mat4.create(), gm, gn));
    const left: Mat4 = m.clone();
    expect(Mat4.multiply(left, n, left)).toBe(left);
    expect(left.isEqual(expected)).toBe(true);
    const right: Mat4 = n.clone();
    Mat4.multiply(m, right, right);
    expect(right.isEqual(expected)).toBe(true);
  });

  it("inverts like gl-matrix, and inverse x matrix is identity", () => {
    const inv: Mat4 | null = m.invert();
    expect(inv).not.toBeNull();
    expect(inv!.isEqual(Mat4.fromArray(mat4.invert(mat4.create(), gm)!))).toBe(
      true,
    );
    expect(Mat4.multiply(inv!, m).isEqual(Mat4.identity())).toBe(true);
  });

  it("returns null for a singular matrix", () => {
    expect(Mat4.scale(new Vec3(1, 0, 1)).invert()).toBeNull();
  });

  it("transposes like gl-matrix", () => {
    expect(
      m.transpose().isEqual(Mat4.fromArray(mat4.transpose(mat4.create(), gm))),
    ).toBe(true);
  });

  it("transforms a Vec4 like gl-matrix", () => {
    const v: Vec4 = new Vec4(0.5, -2, 3, 1);
    const gv: vec4 = vec4.fromValues(0.5, -2, 3, 1);
    expect(
      m
        .transformVec4(v)
        .isEqual(Vec4.fromArray(vec4.transformMat4(vec4.create(), gv, gm))),
    ).toBe(true);
  });

  it("builds a 0..1 depth perspective like gl-matrix perspectiveZO", () => {
    const finite: Mat4 = Mat4.fromArray(
      mat4.perspectiveZO(mat4.create(), 1.0, 16 / 9, 0.1, 100),
    );
    const infinite: Mat4 = Mat4.fromArray(
      mat4.perspectiveZO(mat4.create(), 1.0, 16 / 9, 0.1, Infinity),
    );
    expect(Mat4.perspective(1.0, 16 / 9, 0.1, 100).isEqual(finite)).toBe(true);
    expect(Mat4.perspective(1.0, 16 / 9, 0.1, Infinity).isEqual(infinite)).toBe(
      true,
    );
  });

  it("maps the near plane to depth 0 and the far plane to depth 1", () => {
    const proj: Mat4 = Mat4.perspective(1.0, 1.5, 0.5, 50);
    const near: Vec4 = proj.transformVec4(new Vec4(0, 0, -0.5, 1));
    const far: Vec4 = proj.transformVec4(new Vec4(0, 0, -50, 1));
    expect(near.z / near.w).toBeCloseTo(0, 5);
    expect(far.z / far.w).toBeCloseTo(1, 5);
  });

  it("builds a view matrix like gl-matrix lookAt", () => {
    const eye: Vec3 = new Vec3(4, 3, 5);
    const target: Vec3 = new Vec3(0, 1, 0);
    const up: Vec3 = new Vec3(0, 1, 0);
    const expected: Mat4 = Mat4.fromArray(
      mat4.lookAt(
        mat4.create(),
        vec3.fromValues(4, 3, 5),
        vec3.fromValues(0, 1, 0),
        vec3.fromValues(0, 1, 0),
      ),
    );
    expect(Mat4.lookAt(eye, target, up).isEqual(expected)).toBe(true);
  });

  it("puts the eye at the origin and the target down -Z", () => {
    const eye: Vec3 = new Vec3(4, 3, 5);
    const target: Vec3 = new Vec3(0, 1, 0);
    const view: Mat4 = Mat4.lookAt(eye, target, new Vec3(0, 1, 0));
    expect(
      view.transformVec4(new Vec4(4, 3, 5, 1)).isEqual(new Vec4(0, 0, 0, 1)),
    ).toBe(true);
    const seen: Vec4 = view.transformVec4(new Vec4(0, 1, 0, 1));
    expect(seen.x).toBeCloseTo(0, 5);
    expect(seen.y).toBeCloseTo(0, 5);
    expect(seen.z).toBeCloseTo(-eye.sub(target).length(), 5);
  });

  it("returns identity for lookAt with eye on target", () => {
    const p: Vec3 = new Vec3(1, 2, 3);
    expect(Mat4.lookAt(p, p, new Vec3(0, 1, 0)).isEqual(Mat4.identity())).toBe(
      true,
    );
  });
});
