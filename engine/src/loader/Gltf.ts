import { load } from "@loaders.gl/core";
import { GLTFLoader, postProcessGLTF } from "@loaders.gl/gltf";
import type {
  GLTFAccessorPostprocessed,
  GLTFMeshPostprocessed,
  GLTFMeshPrimitivePostprocessed,
  GLTFPostprocessed,
} from "@loaders.gl/gltf";
import { Mesh } from "../graphics/Mesh";

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

  createMesh(device: GPUDevice, index: number): Mesh {
    const mesh: GLTFMeshPostprocessed | undefined = this.data.meshes[index];
    if (!mesh) {
      throw new Error(`${this.url}: no mesh ${index}`);
    }
    const label: string = mesh.name ?? `${this.url} mesh ${index}`;

    if (mesh.primitives.length !== 1) {
      throw new Error(
        `${label}: ${mesh.primitives.length} primitives, expected 1`,
      );
    }
    const primitive: GLTFMeshPrimitivePostprocessed = mesh.primitives[0];
    if (primitive.mode !== undefined && primitive.mode !== 4) {
      throw new Error(`${label}: primitive mode ${primitive.mode}, expected 4`);
    }

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

    if (!primitive.indices) {
      throw new Error(`${label}: no indices`);
    }
    const indices: Uint32Array = Uint32Array.from(primitive.indices.value);

    return new Mesh(device, label, vertices, indices);
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
