export class Texture {
  readonly label: string;
  readonly texture: GPUTexture;
  readonly sampler: GPUSampler;

  constructor(device: GPUDevice, label: string, image: ImageBitmap) {
    this.label = label;

    this.texture = device.createTexture({
      label: `${label} texture`,
      size: [image.width, image.height],
      format: "rgba8unorm",
      usage:
        GPUTextureUsage.TEXTURE_BINDING |
        GPUTextureUsage.COPY_DST |
        GPUTextureUsage.RENDER_ATTACHMENT,
    });
    device.queue.copyExternalImageToTexture(
      { source: image },
      { texture: this.texture },
      [image.width, image.height],
    );

    this.sampler = device.createSampler({
      label: `${label} sampler`,
      addressModeU: "repeat",
      addressModeV: "repeat",
      magFilter: "linear",
      minFilter: "linear",
    });
  }
}
