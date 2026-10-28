override WORKGROUP_SIZE: u32 = 64u;

struct Bone {
    t: vec4f,
    q: vec4f,
    s: vec4f,
};

// For each skeleton, constant after load
@group(0) @binding(0) var<uniform> rootParentWorld: mat4x4f;
@group(0) @binding(1) var<storage, read> parent: array<i32>;
@group(0) @binding(2) var<storage, read> inverseBind: array<mat4x4f>;
// For each skinned object, local pose in, palette out
@group(0) @binding(3) var<storage, read> pose: array<Bone>;
@group(0) @binding(4) var<storage, read_write> palette: array<mat4x4f>;

fn boneMatrix(bone: Bone) -> mat4x4f {
    let q: vec4f = bone.q;
    let x2: f32 = q.x + q.x;
    let y2: f32 = q.y + q.y;
    let z2: f32 = q.z + q.z;
    let xx: f32 = q.x * x2;
    let xy: f32 = q.x * y2;
    let xz: f32 = q.x * z2;
    let yy: f32 = q.y * y2;
    let yz: f32 = q.y * z2;
    let zz: f32 = q.z * z2;
    let wx: f32 = q.w * x2;
    let wy: f32 = q.w * y2;
    let wz: f32 = q.w * z2;

    return mat4x4f(
        vec4f(1.0 - (yy + zz), xy + wz, xz - wy, 0.0) * bone.s.x,
        vec4f(xy - wz, 1.0 - (xx + zz), yz + wx, 0.0) * bone.s.y,
        vec4f(xz + wy, yz - wx, 1.0 - (xx + yy), 0.0) * bone.s.z,
        vec4f(bone.t.xyz, 1.0),
    );
}

@compute @workgroup_size(WORKGROUP_SIZE)
fn cs_main(@builtin(global_invocation_id) id: vec3u) {
    let b: u32 = id.x;
    if (b >= arrayLength(&palette)) {
        return;
    }

    var world: mat4x4f = boneMatrix(pose[b]);
    var p: i32 = parent[b];
    while (p >= 0) {
        world = boneMatrix(pose[p]) * world;
        p = parent[p];
    }

    palette[b] = rootParentWorld * world * inverseBind[b];
}
