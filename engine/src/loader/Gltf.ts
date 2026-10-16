import { load } from "@loaders.gl/core";
import { GLTFLoader, postProcessGLTF } from "@loaders.gl/gltf";
import type {
  GLTFAccessorPostprocessed,
  GLTFImagePostprocessed,
  GLTFMeshPostprocessed,
  GLTFMeshPrimitivePostprocessed,
  GLTFNodePostprocessed,
  GLTFPostprocessed,
  GLTFTexturePostprocessed,
} from "@loaders.gl/gltf";
import { Mat4, Quat, Vec3 } from "@azul/math";
import { Mesh } from "../graphics/Mesh";
import { SkinnedMesh } from "../graphics/SkinnedMesh";
import { Texture } from "../graphics/Texture";
import { Skeleton } from "../animation/Skeleton";

type GLTFSkinPostprocessed = GLTFPostprocessed["skins"][number];

export class Gltf {
  readonly url: string;

  private data: GLTFPostprocessed;

  private constructor(url: string, data: GLTFPostprocessed) {
    this.url = url;
    this.data = data;
  }

  static async load(url: string): Promise<Gltf> {
    const raw = await load(url, GLTFLoader, {
      gltf: { loadImages: false },
    });
    return new Gltf(url, postProcessGLTF(raw));
  }

  getNumMeshes(): number {
    return this.data.meshes.length;
  }

  getNumSkins(): number {
    return this.data.skins.length;
  }

  createMesh(device: GPUDevice, index: number): Mesh {
    const label: string = this.getMeshLabel(index);
    const primitive: GLTFMeshPrimitivePostprocessed = this.getPrimitive(index);

    return new Mesh(
      device,
      label,
      this.buildVertices(label, primitive),
      this.buildIndices(label, primitive),
    );
  }

  createSkinnedMesh(
    device: GPUDevice,
    index: number,
    skeleton: Skeleton,
  ): SkinnedMesh {
    const label: string = this.getMeshLabel(index);
    const primitive: GLTFMeshPrimitivePostprocessed = this.getPrimitive(index);

    const joints: GLTFAccessorPostprocessed | undefined =
      primitive.attributes["JOINTS_0"];
    if (
      !joints ||
      joints.components !== 4 ||
      (joints.componentType !== 5121 && joints.componentType !== 5123)
    ) {
      throw new Error(`${label}: JOINTS_0 is not uint8/uint16 x 4`);
    }
    const weights: GLTFAccessorPostprocessed = this.getAttribute(
      label,
      primitive,
      "WEIGHTS_0",
      4,
    );

    const count: number = joints.count;
    const skin: ArrayBuffer = new ArrayBuffer(count * 32);
    const skinJoints: Uint32Array = new Uint32Array(skin);
    const skinWeights: Float32Array = new Float32Array(skin);
    for (let i = 0; i < count; i++) {
      for (let k = 0; k < 4; k++) {
        const joint: number = joints.value[i * 4 + k];
        if (joint >= skeleton.boneCount) {
          throw new Error(`${label}: vertex ${i} uses joint ${joint}`);
        }
        skinJoints[i * 8 + k] = skeleton.jointToBone[joint];
        skinWeights[i * 8 + 4 + k] = weights.value[i * 4 + k];
      }
    }

    return new SkinnedMesh(
      device,
      label,
      this.buildVertices(label, primitive),
      this.buildIndices(label, primitive),
      skin,
    );
  }

  createSkeleton(index: number): Skeleton {
    const skin: GLTFSkinPostprocessed | undefined = this.data.skins[index];
    if (!skin) {
      throw new Error(`${this.url}: no skin ${index}`);
    }
    const label: string = skin.name ?? `${this.url} skin ${index}`;
    const nodes: GLTFNodePostprocessed[] = this.data.nodes;

    const parentOf: Map<GLTFNodePostprocessed, GLTFNodePostprocessed> =
      new Map<GLTFNodePostprocessed, GLTFNodePostprocessed>();
    for (const node of nodes) {
      for (const child of node.children ?? []) {
        parentOf.set(child, node);
      }
    }

    const jointOf: Map<GLTFNodePostprocessed, number> = new Map<
      GLTFNodePostprocessed,
      number
    >();
    for (let j = 0; j < skin.joints.length; j++) {
      jointOf.set(nodes[skin.joints[j]], j);
    }

    const roots: GLTFNodePostprocessed[] = [];
    for (const node of jointOf.keys()) {
      const parent: GLTFNodePostprocessed | undefined = parentOf.get(node);
      if (parent === undefined || !jointOf.has(parent)) {
        roots.push(node);
      }
    }
    if (roots.length !== 1) {
      throw new Error(`${label}: ${roots.length} root joints, expected 1`);
    }

    const order: GLTFNodePostprocessed[] = [];
    this.collectJoints(roots[0], jointOf, order);
    if (order.length !== skin.joints.length) {
      throw new Error(
        `${label}: ${skin.joints.length - order.length} joints under a non-joint node`,
      );
    }

    const boneCount: number = order.length;
    const names: string[] = [];
    const parent: Int32Array = new Int32Array(boneCount);
    const jointToBone: Int32Array = new Int32Array(boneCount);
    const inverseBind: Float32Array = new Float32Array(boneCount * 16);
    const restPose: Float32Array = new Float32Array(
      boneCount * Skeleton.POSE_STRIDE,
    );
    const boneOf: Map<GLTFNodePostprocessed, number> = new Map<
      GLTFNodePostprocessed,
      number
    >();
    const ibm: GLTFAccessorPostprocessed | undefined = skin.inverseBindMatrices;

    for (let b = 0; b < boneCount; b++) {
      const node: GLTFNodePostprocessed = order[b];
      const joint: number = jointOf.get(node) as number;
      boneOf.set(node, b);
      names.push(node.name ?? node.id);
      jointToBone[joint] = b;

      if (b === 0) {
        parent[b] = -1;
      } else {
        const parentNode: GLTFNodePostprocessed =
          parentOf.get(node) as GLTFNodePostprocessed;
        parent[b] = boneOf.get(parentNode) as number;
      }

      if (ibm) {
        for (let i = 0; i < 16; i++) {
          inverseBind[b * 16 + i] = ibm.value[joint * 16 + i];
        }
      } else {
        Mat4.identity().copyTo(inverseBind, b * 16);
      }

      if (node.matrix) {
        throw new Error(`${label}: joint ${names[b]} uses a matrix, not TRS`);
      }
      const t: number[] = node.translation ?? [0, 0, 0];
      const q: number[] = node.rotation ?? [0, 0, 0, 1];
      const s: number[] = node.scale ?? [1, 1, 1];
      const p: number = b * Skeleton.POSE_STRIDE;
      restPose[p + 0] = t[0];
      restPose[p + 1] = t[1];
      restPose[p + 2] = t[2];
      restPose[p + 4] = q[0];
      restPose[p + 5] = q[1];
      restPose[p + 6] = q[2];
      restPose[p + 7] = q[3];
      restPose[p + 8] = s[0];
      restPose[p + 9] = s[1];
      restPose[p + 10] = s[2];
    }

    return new Skeleton(
      names,
      parent,
      jointToBone,
      inverseBind,
      restPose,
      this.getWorld(parentOf.get(roots[0]), parentOf),
    );
  }

  async createBaseColorTexture(
    device: GPUDevice,
    meshIndex: number,
  ): Promise<Texture> {
    const label: string = this.getMeshLabel(meshIndex);
    const primitive: GLTFMeshPrimitivePostprocessed =
      this.getPrimitive(meshIndex);

    const source: GLTFTexturePostprocessed | undefined =
      primitive.material?.pbrMetallicRoughness?.baseColorTexture?.texture;
    if (!source) {
      throw new Error(`${label}: no base color texture`);
    }
    const image: GLTFImagePostprocessed | undefined = source.source;
    if (!image || !image.bufferView || !image.mimeType) {
      throw new Error(`${label}: base color image is not embedded`);
    }

    const blob: Blob = new Blob([image.bufferView.data.slice()], {
      type: image.mimeType,
    });
    const bitmap: ImageBitmap = await createImageBitmap(blob, {
      colorSpaceConversion: "none",
    });
    const texture: Texture = new Texture(device, `${label} base color`, bitmap);
    bitmap.close();
    return texture;
  }

  private buildVertices(
    label: string,
    primitive: GLTFMeshPrimitivePostprocessed,
  ): Float32Array {
    const position: GLTFAccessorPostprocessed = this.getAttribute(
      label,
      primitive,
      "POSITION",
      3,
    );
    const normal: GLTFAccessorPostprocessed = this.getAttribute(
      label,
      primitive,
      "NORMAL",
      3,
    );
    const uv: GLTFAccessorPostprocessed = this.getAttribute(
      label,
      primitive,
      "TEXCOORD_0",
      2,
    );

    const count: number = position.count;
    const vertices: Float32Array = new Float32Array(count * 8);
    for (let i = 0; i < count; i++) {
      const v: number = i * 8;
      vertices[v + 0] = position.value[i * 3 + 0];
      vertices[v + 1] = position.value[i * 3 + 1];
      vertices[v + 2] = position.value[i * 3 + 2];
      vertices[v + 3] = normal.value[i * 3 + 0];
      vertices[v + 4] = normal.value[i * 3 + 1];
      vertices[v + 5] = normal.value[i * 3 + 2];
      vertices[v + 6] = uv.value[i * 2 + 0];
      vertices[v + 7] = uv.value[i * 2 + 1];
    }
    return vertices;
  }

  private buildIndices(
    label: string,
    primitive: GLTFMeshPrimitivePostprocessed,
  ): Uint32Array {
    if (!primitive.indices) {
      throw new Error(`${label}: no indices`);
    }
    return Uint32Array.from(primitive.indices.value);
  }

  private collectJoints(
    node: GLTFNodePostprocessed,
    jointOf: Map<GLTFNodePostprocessed, number>,
    out: GLTFNodePostprocessed[],
  ): void {
    out.push(node);
    for (const child of node.children ?? []) {
      if (jointOf.has(child)) {
        this.collectJoints(child, jointOf, out);
      }
    }
  }

  private getWorld(
    node: GLTFNodePostprocessed | undefined,
    parentOf: Map<GLTFNodePostprocessed, GLTFNodePostprocessed>,
  ): Mat4 {
    if (node === undefined) {
      return Mat4.identity();
    }
    const local: Mat4 = node.matrix
      ? Mat4.fromArray(node.matrix)
      : Mat4.fromTRS(
          Vec3.fromArray(node.translation ?? [0, 0, 0]),
          Quat.fromArray(node.rotation ?? [0, 0, 0, 1]),
          Vec3.fromArray(node.scale ?? [1, 1, 1]),
        );
    return Mat4.multiply(this.getWorld(parentOf.get(node), parentOf), local);
  }

  private getMeshLabel(index: number): string {
    const mesh: GLTFMeshPostprocessed | undefined = this.data.meshes[index];
    if (!mesh) {
      throw new Error(`${this.url}: no mesh ${index}`);
    }
    return mesh.name ?? `${this.url} mesh ${index}`;
  }

  private getPrimitive(index: number): GLTFMeshPrimitivePostprocessed {
    const label: string = this.getMeshLabel(index);
    const mesh: GLTFMeshPostprocessed = this.data.meshes[index];
    if (mesh.primitives.length !== 1) {
      throw new Error(
        `${label}: ${mesh.primitives.length} primitives, expected 1`,
      );
    }
    const primitive: GLTFMeshPrimitivePostprocessed = mesh.primitives[0];
    if (primitive.mode !== undefined && primitive.mode !== 4) {
      throw new Error(`${label}: primitive mode ${primitive.mode}, expected 4`);
    }
    return primitive;
  }

  private getAttribute(
    label: string,
    primitive: GLTFMeshPrimitivePostprocessed,
    name: string,
    components: number,
  ): GLTFAccessorPostprocessed {
    const accessor: GLTFAccessorPostprocessed | undefined =
      primitive.attributes[name];
    if (!accessor) {
      throw new Error(`${label}: missing ${name}`);
    }
    if (accessor.components !== components || accessor.componentType !== 5126) {
      throw new Error(`${label}: ${name} is not float32 x ${components}`);
    }
    return accessor;
  }
}
