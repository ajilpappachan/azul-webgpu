import { describe, it, expect } from "vitest";
import { quat, vec3 } from "gl-matrix";
import { Quat, Vec3 } from "@azul/math";

function glAxisAngle(x: number, y: number, z: number, radians: number): Quat {
  const axis: vec3 = vec3.normalize(vec3.create(), vec3.fromValues(x, y, z));
  return Quat.fromArray(quat.setAxisAngle(quat.create(), axis, radians));
}

function axisAngle(x: number, y: number, z: number, radians: number): Quat {
  return Quat.fromAxisAngle(new Vec3(x, y, z).normalize(), radians);
}

describe("Quat", () => {
  const a: Quat = axisAngle(1, 2, 3, 0.7);
  const b: Quat = axisAngle(-2, 0.5, 1, 2.1);
  const ga: quat = quat.setAxisAngle(
    quat.create(),
    vec3.normalize(vec3.create(), vec3.fromValues(1, 2, 3)),
    0.7,
  );
  const gb: quat = quat.setAxisAngle(
    quat.create(),
    vec3.normalize(vec3.create(), vec3.fromValues(-2, 0.5, 1)),
    2.1,
  );

  it("defaults to identity, stored x, y, z, w", () => {
    expect(new Quat().isEqual(Quat.fromArray([0, 0, 0, 1]))).toBe(true);
    expect(
      Quat.identity().isEqual(Quat.fromArray(quat.identity(quat.create()))),
    ).toBe(true);
  });

  it("builds from axis-angle like gl-matrix", () => {
    expect(a.isEqual(glAxisAngle(1, 2, 3, 0.7))).toBe(true);
    expect(b.isEqual(glAxisAngle(-2, 0.5, 1, 2.1))).toBe(true);
  });

  it("compares within a tolerance", () => {
    expect(a.isEqual(new Quat(a.x + 0.0005, a.y, a.z, a.w))).toBe(true);
    expect(a.isEqual(new Quat(a.x + 0.01, a.y, a.z, a.w))).toBe(false);
    expect(a.isEqual(new Quat(a.x + 0.01, a.y, a.z, a.w), 0.1)).toBe(true);
  });

  it("treats q and -q as equivalent but not equal", () => {
    const negA: Quat = new Quat(-a.x, -a.y, -a.z, -a.w);
    expect(a.isEqual(negA)).toBe(false);
    expect(a.isEquivalent(negA)).toBe(true);
    expect(a.isEquivalent(a)).toBe(true);
    expect(a.isEquivalent(b)).toBe(false);
  });

  it("multiplies like gl-matrix", () => {
    expect(
      a
        .multiply(b)
        .isEqual(Quat.fromArray(quat.multiply(quat.create(), ga, gb))),
    ).toBe(true);
    expect(
      b
        .multiply(a)
        .isEqual(Quat.fromArray(quat.multiply(quat.create(), gb, ga))),
    ).toBe(true);
  });

  it("conjugates, measures and normalizes like gl-matrix", () => {
    expect(
      a.conjugate().isEqual(Quat.fromArray(quat.conjugate(quat.create(), ga))),
    ).toBe(true);
    expect(a.dot(b)).toBeCloseTo(quat.dot(ga, gb), 5);
    const long: Quat = new Quat(1, 2, 3, 4);
    const glLong: quat = quat.fromValues(1, 2, 3, 4);
    expect(long.length()).toBeCloseTo(quat.length(glLong), 5);
    expect(
      long
        .normalize()
        .isEqual(Quat.fromArray(quat.normalize(quat.create(), glLong))),
    ).toBe(true);
  });

  it("composes to identity with its conjugate", () => {
    expect(a.multiply(a.conjugate()).isEqual(Quat.identity())).toBe(true);
  });

  it("slerps like gl-matrix across t", () => {
    for (const t of [0, 0.25, 0.5, 0.8, 1]) {
      expect(
        Quat.slerp(a, b, t).isEqual(
          Quat.fromArray(quat.slerp(quat.create(), ga, gb, t)),
        ),
      ).toBe(true);
    }
  });

  it("hits both endpoints", () => {
    expect(Quat.slerp(a, b, 0).isEqual(a)).toBe(true);
    expect(Quat.slerp(a, b, 1).isEqual(b)).toBe(true);
  });

  it("takes the short way round: q and -q give the same slerp", () => {
    const negB: Quat = new Quat(-b.x, -b.y, -b.z, -b.w);
    expect(Quat.slerp(a, negB, 0.4).isEqual(Quat.slerp(a, b, 0.4))).toBe(true);
  });

  it("stays unit length mid-way", () => {
    expect(Quat.slerp(a, b, 0.37).length()).toBeCloseTo(1, 5);
  });

  it("falls back to lerp for near-identical rotations without NaN", () => {
    const c: Quat = axisAngle(0, 1, 0, 0.5);
    const d: Quat = axisAngle(0, 1, 0, 0.5 + 1e-7);
    const r: Quat = Quat.slerp(c, d, 0.5);
    expect(Number.isFinite(r.x)).toBe(true);
    expect(Number.isFinite(r.y)).toBe(true);
    expect(Number.isFinite(r.z)).toBe(true);
    expect(Number.isFinite(r.w)).toBe(true);
    expect(r.isEqual(c)).toBe(true);
  });

  it("slerps into an out quaternion, including one of its operands", () => {
    const expected: Quat = Quat.fromArray(
      quat.slerp(quat.create(), ga, gb, 0.6),
    );
    const out: Quat = new Quat();
    expect(Quat.slerp(a, b, 0.6, out)).toBe(out);
    expect(out.isEqual(expected)).toBe(true);
    const self: Quat = a.clone();
    Quat.slerp(self, b, 0.6, self);
    expect(self.isEqual(expected)).toBe(true);
  });
});
