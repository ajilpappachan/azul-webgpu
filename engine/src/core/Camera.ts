import { Mat4, Vec3 } from "@azul/math";

export class Camera {
  private fovY: number;
  private near: number;
  private far: number;
  private eye: Vec3;
  private target: Vec3;
  private up: Vec3;
  private view: Mat4;
  private proj: Mat4;
  private viewProj: Mat4;

  constructor(fovY: number, near: number, far: number) {
    this.fovY = fovY;
    this.near = near;
    this.far = far;
    this.eye = new Vec3(0, 0, 1);
    this.target = new Vec3(0, 0, 0);
    this.up = new Vec3(0, 1, 0);
    this.view = Mat4.identity();
    this.proj = Mat4.identity();
    this.viewProj = Mat4.identity();
  }

  getEye(): Vec3 {
    return this.eye;
  }

  getTarget(): Vec3 {
    return this.target;
  }

  getView(): Mat4 {
    return this.view;
  }

  getProj(): Mat4 {
    return this.proj;
  }

  getViewProj(): Mat4 {
    return this.viewProj;
  }

  setPerspective(fovY: number, near: number, far: number): void {
    this.fovY = fovY;
    this.near = near;
    this.far = far;
  }

  setLookAt(eye: Vec3, target: Vec3, up: Vec3): void {
    this.eye = eye.clone();
    this.target = target.clone();
    this.up = up.clone();
  }

  update(aspect: number): void {
    this.view = Mat4.lookAt(this.eye, this.target, this.up);
    this.proj = Mat4.perspective(this.fovY, aspect, this.near, this.far);
    Mat4.multiply(this.proj, this.view, this.viewProj);
  }
}
