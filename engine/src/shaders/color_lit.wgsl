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
};

struct VertexOutput {
    @builtin(position) clip: vec4f,
    @location(0) normal: vec3f,
    @location(1) color: vec3f,
};

// For entire frame, vertex and fragment, shared by every material and objects
@group(0) @binding(0) var<uniform> frame: Frame;
// For each material, fragment only, shared by all objects using same material
@group(1) @binding(0) var<uniform> material: MaterialData;
// For each graphics object, vertex only
@group(2) @binding(0) var<uniform> model: mat4x4f;

@vertex
fn vs_main(input: VertexInput) -> VertexOutput {
    var output: VertexOutput;
    output.clip = frame.viewProj * model * vec4f(input.position, 1.0f);
    output.normal = (model * vec4f(input.normal, 0.0)).xyz;
    output.color = input.position + vec3f(0.5f);
    return output;
}

@fragment
fn fs_main(input: VertexOutput) -> @location(0) vec4f {
    let n: vec3f = normalize(input.normal);
    let l: vec3f = normalize(-frame.lightDir.xyz);
    let diffuse: f32 = max(dot(n, l), 0.0);
    let albedo: vec3f = input.color * material.baseColor.rgb;
    return vec4f(albedo * (0.2 + 0.8 * diffuse), material.baseColor.a);
}