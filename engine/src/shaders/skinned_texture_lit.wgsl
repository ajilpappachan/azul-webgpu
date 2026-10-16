struct Frame {
    viewProj: mat4x4f,
    lightDir: vec4f,
};

struct MaterialData {
    baseColor: vec4f,
};

struct VertexInput {
    @location(0) position: vec3f,
    @location(1) normal: vec3f,
    @location(2) uv: vec2f,
    @location(3) joints: vec4u,
    @location(4) weights: vec4f,
};

struct VertexOutput {
    @builtin(position) clip: vec4f,
    @location(0) normal: vec3f,
    @location(1) uv: vec2f,
};

// For entire frame, vertex and fragment, shared by every material and objects
@group(0) @binding(0) var<uniform> frame: Frame;
// For each material, fragment only, shared by all objects using same material
@group(1) @binding(0) var<uniform> material: MaterialData;
@group(1) @binding(1) var baseColorTexture: texture_2d<f32>;
@group(1) @binding(2) var baseColorSampler: sampler;
// For each graphics object, vertex only
@group(2) @binding(0) var<uniform> model: mat4x4f;
@group(2) @binding(1) var<storage, read> palette: array<mat4x4f>;

@vertex
fn vs_main(input: VertexInput) -> VertexOutput {
    let skin: mat4x4f = palette[input.joints.x] * input.weights.x
        + palette[input.joints.y] * input.weights.y
        + palette[input.joints.z] * input.weights.z
        + palette[input.joints.w] * input.weights.w;
    let world: mat4x4f = model * skin;

    var output: VertexOutput;
    output.clip = frame.viewProj * world * vec4f(input.position, 1.0f);
    output.normal = (world * vec4f(input.normal, 0.0)).xyz;
    output.uv = input.uv;
    return output;
}

@fragment
fn fs_main(input: VertexOutput) -> @location(0) vec4f {
    let n: vec3f = normalize(input.normal);
    let l: vec3f = normalize(-frame.lightDir.xyz);
    let diffuse: f32 = max(dot(n, l), 0.0);
    let albedo: vec3f = textureSample(baseColorTexture, baseColorSampler, input.uv).rgb * material.baseColor.rgb;
    return vec4f(albedo * (0.2 + 0.8 * diffuse), material.baseColor.a);
}
