import { describe, it, expect } from "vitest";
import { vec4 } from "gl-matrix";
import { Vec4 } from "@azul/math";

describe("Vec4", () => {
  const a: Vec4 = new Vec4(1, -2, 3.5, 0.5);
  const b: Vec4 = new Vec4(-4, 0.25, 2, -1);
  const ga: vec4 = vec4.fromValues(1, -2, 3.5, 0.5);
  const gb: vec4 = vec4.fromValues(-4, 0.25, 2, -1);

  it("defaults to zero and exposes components", () => {
    const v: Vec4 = new Vec4();
    expect(v.isEqual(new Vec4(0, 0, 0, 0))).toBe(true);
    v.w = 7;
    expect(v.w).toBe(7);
    const out: Float32Array = new Float32Array(4);
    v.copyTo(out);
    expect(out[3]).toBe(7);
  });

  it("builds from an array at an offset", () => {
    expect(Vec4.fromArray([9, 9, 1, -2, 3.5, 0.5], 2).isEqual(a)).toBe(true);
  });

  it("compares within a tolerance, on every component", () => {
    expect(a.isEqual(new Vec4(1, -2, 3.5, 0.5005))).toBe(true);
    expect(a.isEqual(new Vec4(1, -2, 3.5, 0.6))).toBe(false);
    expect(a.isEqual(new Vec4(1, -2, 3.5, 0.6), 0.2)).toBe(true);
  });

  it("adds, subtracts and scales like gl-matrix", () => {
    expect(
      a.add(b).isEqual(Vec4.fromArray(vec4.add(vec4.create(), ga, gb))),
    ).toBe(true);
    expect(
      a.sub(b).isEqual(Vec4.fromArray(vec4.subtract(vec4.create(), ga, gb))),
    ).toBe(true);
    expect(
      a
        .scale(-1.5)
        .isEqual(Vec4.fromArray(vec4.scale(vec4.create(), ga, -1.5))),
    ).toBe(true);
  });

  it("dots and measures like gl-matrix", () => {
    expect(a.dot(b)).toBeCloseTo(vec4.dot(ga, gb), 5);
    expect(a.length()).toBeCloseTo(vec4.length(ga), 5);
  });

  it("normalizes like gl-matrix", () => {
    expect(
      a.normalize().isEqual(Vec4.fromArray(vec4.normalize(vec4.create(), ga))),
    ).toBe(true);
    expect(new Vec4().normalize().isEqual(new Vec4(0, 0, 0, 0))).toBe(true);
  });

  it("lerps like gl-matrix, into a new or an out vector", () => {
    const expected: Vec4 = Vec4.fromArray(
      vec4.lerp(vec4.create(), ga, gb, 0.3),
    );
    expect(Vec4.lerp(a, b, 0.3).isEqual(expected)).toBe(true);
    const self: Vec4 = a.clone();
    expect(Vec4.lerp(self, b, 0.3, self)).toBe(self);
    expect(self.isEqual(expected)).toBe(true);
  });

  it("returns new vectors and leaves operands untouched", () => {
    const sum: Vec4 = a.add(b);
    expect(sum).not.toBe(a);
    expect(a.isEqual(new Vec4(1, -2, 3.5, 0.5))).toBe(true);
    const copy: Vec4 = a.clone();
    copy.x = 100;
    expect(a.x).toBe(1);
  });
});
