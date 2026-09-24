import { describe, it, expect } from "vitest";
import { vec3 } from "gl-matrix";
import { Vec3 } from "@azul/math";

describe("Vec3", () => {
  const a: Vec3 = new Vec3(1, -2, 3.5);
  const b: Vec3 = new Vec3(-4, 0.25, 2);
  const ga: vec3 = vec3.fromValues(1, -2, 3.5);
  const gb: vec3 = vec3.fromValues(-4, 0.25, 2);

  it("defaults to zero and exposes components", () => {
    const v: Vec3 = new Vec3();
    expect(v.isEqual(new Vec3(0, 0, 0))).toBe(true);
    v.y = 7;
    expect(v.y).toBe(7);
    const out: Float32Array = new Float32Array(3);
    v.copyTo(out);
    expect(out[1]).toBe(7);
  });

  it("builds from an array at an offset", () => {
    expect(Vec3.fromArray([9, 1, -2, 3.5], 1).isEqual(a)).toBe(true);
  });

  it("compares within a tolerance", () => {
    expect(a.isEqual(new Vec3(1.0005, -2, 3.5))).toBe(true);
    expect(a.isEqual(new Vec3(1.01, -2, 3.5))).toBe(false);
    expect(a.isEqual(new Vec3(1.01, -2, 3.5), 0.1)).toBe(true);
    expect(a.isEqual(new Vec3(1, -2, 3.6))).toBe(false);
  });

  it("adds, subtracts and scales like gl-matrix", () => {
    expect(
      a.add(b).isEqual(Vec3.fromArray(vec3.add(vec3.create(), ga, gb))),
    ).toBe(true);
    expect(
      a.sub(b).isEqual(Vec3.fromArray(vec3.subtract(vec3.create(), ga, gb))),
    ).toBe(true);
    expect(
      a
        .scale(-1.5)
        .isEqual(Vec3.fromArray(vec3.scale(vec3.create(), ga, -1.5))),
    ).toBe(true);
  });

  it("dots, crosses and measures like gl-matrix", () => {
    expect(a.dot(b)).toBeCloseTo(vec3.dot(ga, gb), 5);
    expect(
      a.cross(b).isEqual(Vec3.fromArray(vec3.cross(vec3.create(), ga, gb))),
    ).toBe(true);
    expect(a.length()).toBeCloseTo(vec3.length(ga), 5);
  });

  it("normalizes like gl-matrix", () => {
    expect(
      a.normalize().isEqual(Vec3.fromArray(vec3.normalize(vec3.create(), ga))),
    ).toBe(true);
    expect(new Vec3().normalize().isEqual(new Vec3(0, 0, 0))).toBe(true);
  });

  it("lerps like gl-matrix", () => {
    expect(
      Vec3.lerp(a, b, 0.3).isEqual(
        Vec3.fromArray(vec3.lerp(vec3.create(), ga, gb, 0.3)),
      ),
    ).toBe(true);
  });

  it("lerps into an out vector", () => {
    const expected: Vec3 = Vec3.fromArray(
      vec3.lerp(vec3.create(), ga, gb, 0.3),
    );
    const out: Vec3 = new Vec3();
    expect(Vec3.lerp(a, b, 0.3, out)).toBe(out);
    expect(out.isEqual(expected)).toBe(true);
    const self: Vec3 = a.clone();
    Vec3.lerp(self, b, 0.3, self);
    expect(self.isEqual(expected)).toBe(true);
  });

  it("returns new vectors and leaves operands untouched", () => {
    const sum: Vec3 = a.add(b);
    expect(sum).not.toBe(a);
    expect(a.isEqual(new Vec3(1, -2, 3.5))).toBe(true);
    const copy: Vec3 = a.clone();
    copy.x = 100;
    expect(a.x).toBe(1);
  });
});
