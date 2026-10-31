#version 300 es
precision highp float;

in vec2 v_texcoord;
uniform sampler2D tex;
// Static version: no time uniform, so damage tracking stays on and GPU use
// stays low. Change PHASE to pick a different frozen ripple pattern.
out vec4 fragColor;

// Tweakables
const float PHASE   = 1.7;
const float WAVE    = 0.0045;   // distortion strength
const float TINT    = 0.55;     // blue-green water colour
const float DEPTH   = 0.45;     // darkening toward the bottom
const float CAUSTIC = 0.22;     // light-ray pattern strength
const float SPLIT   = 0.0016;   // colour separation

float caustic(vec2 p, float t) {
    float c = 1.0 - abs(sin(p.x + sin(p.y + t)) * sin(p.y + sin(p.x - t * 0.8)));
    return pow(c, 5.0);
}

void main() {
    vec2 uv = v_texcoord;
    vec2 res = vec2(textureSize(tex, 0));
    float aspect = res.x / res.y;
    float t = PHASE;

    // Layered ripple distortion
    vec2 d;
    d.x = sin(uv.y * 22.0 + t * 1.3 + sin(uv.x * 7.0 + t)) * WAVE;
    d.y = sin(uv.x * 17.0 + t * 1.1 + sin(uv.y * 5.0 - t)) * WAVE * 0.7;
    d += vec2(sin(uv.y * 55.0 + t * 2.1), cos(uv.x * 48.0 - t * 1.7)) * WAVE * 0.25;

    vec2 buv = clamp(uv + d, 0.0, 1.0);

    vec3 col;
    col.r = texture(tex, clamp(buv + vec2( SPLIT, 0.0), 0.0, 1.0)).r;
    col.g = texture(tex, buv).g;
    col.b = texture(tex, clamp(buv - vec2( SPLIT, 0.0), 0.0, 1.0)).b;

    // Water colour: absorb red, keep blue/green
    vec3 water = col * vec3(0.55, 0.88, 1.0) + vec3(0.0, 0.025, 0.06);
    col = mix(col, water, TINT);

    // Deeper (darker, bluer) toward the bottom of the screen.
    // If it looks lighter at the bottom on your setup, use (1.0 - uv.y).
    float depth = uv.y;
    col *= 1.0 - DEPTH * depth;
    col = mix(col, col * vec3(0.7, 0.9, 1.1), depth * 0.5);

    // Caustic light pattern, stronger near the surface
    vec2 q = uv * vec2(aspect, 1.0);
    float c = caustic(q * 7.0, t) * 0.6 + caustic(q * 12.0 + 3.0, t * 1.2) * 0.4;
    col += c * CAUSTIC * vec3(0.55, 0.95, 1.0) * (1.0 - depth * 0.7);

    fragColor = vec4(clamp(col, 0.0, 1.0), 1.0);
}
