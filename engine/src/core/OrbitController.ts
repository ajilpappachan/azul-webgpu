import { Mat4, Quat, Vec3, Vec4 } from "@azul/math";
import type { Camera } from "./Camera";
import type { Keyboard } from "./Keyboard";

export class OrbitController {
  static readonly ORBIT_SPEED: number = 1.8;
  static readonly MOVE_SPEED: number = 1.8;
  static readonly MIN_DISTANCE: number = 0.5;

  private camera: Camera;
  private keyboard: Keyboard;
  private origEye: Vec3;
  private origTarget: Vec3;
  private origUp: Vec3;

  constructor(camera: Camera, keyboard: Keyboard) {
    this.camera = camera;
    this.keyboard = keyboard;
    this.origEye = camera.getEye().clone();
    this.origTarget = camera.getTarget().clone();
    this.origUp = camera.getUp().clone();
  }

  update(dt: number): void {
    const angle: number = OrbitController.ORBIT_SPEED * dt;
    const dist: number = OrbitController.MOVE_SPEED * dt;

    if (this.keyboard.isDown("KeyF")) {
      this.camera.setLookAt(this.origEye, this.origTarget, this.origUp);
    }

    if (this.keyboard.isDown("KeyW")) {
      this.zoom(dist);
    }
    if (this.keyboard.isDown("KeyS")) {
      this.zoom(-dist);
    }

    if (this.keyboard.isDown("KeyD")) {
      this.pan(dist);
    }
    if (this.keyboard.isDown("KeyA")) {
      this.pan(-dist);
    }

    if (this.keyboard.isDown("ArrowRight")) {
      this.orbit(this.camera.getUp(), angle);
    }
    if (this.keyboard.isDown("ArrowLeft")) {
      this.orbit(this.camera.getUp(), -angle);
    }
    if (this.keyboard.isDown("ArrowDown")) {
      this.orbit(this.camera.getRight(), angle);
    }
    if (this.keyboard.isDown("ArrowUp")) {
      this.orbit(this.camera.getRight(), -angle);
    }
  }

  private static rotate(m: Mat4, v: Vec3): Vec3 {
    const r: Vec4 = m.transformVec4(new Vec4(v.x, v.y, v.z, 0));
    return new Vec3(r.x, r.y, r.z);
  }

  private pan(dist: number): void {
    const delta: Vec3 = this.camera.getRight().scale(dist);
    this.camera.setLookAt(
      this.camera.getEye().add(delta),
      this.camera.getTarget().add(delta),
      this.camera.getUp(),
    );
  }

  private zoom(dist: number): void {
    const eye: Vec3 = this.camera.getEye();
    const target: Vec3 = this.camera.getTarget();
    if (eye.sub(target).length() - dist < OrbitController.MIN_DISTANCE) {
      return;
    }
    this.camera.setLookAt(
      eye.add(this.camera.getForward().scale(dist)),
      target,
      this.camera.getUp(),
    );
  }

  private orbit(axis: Vec3, angle: number): void {
    const target: Vec3 = this.camera.getTarget();
    const m: Mat4 = Mat4.fromQuat(Quat.fromAxisAngle(axis, angle));
    const offset: Vec3 = OrbitController.rotate(
      m,
      this.camera.getEye().sub(target),
    );
    this.camera.setLookAt(
      target.add(offset),
      target,
      OrbitController.rotate(m, this.camera.getUp()),
    );
  }
}
