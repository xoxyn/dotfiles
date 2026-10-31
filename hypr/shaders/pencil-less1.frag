#version 300 es
precision highp float;

in vec2 v_texcoord;
uniform sampler2D tex;
out vec4 fragColor;

// Tweakables
const float EDGE_STRENGTH = 1.5;    // outline boldness (lower = thinner)
const float HATCH_SPACING = 4.0;    // pixels between hatch lines
const float HATCH_AMOUNT  = 0.18;   // shading darkness (keep low for readability)
const float GRAIN         = 0.03;

const vec3 PAPER    = vec3(0.955, 0.940, 0.900);
const vec3 GRAPHITE = vec3(0.16, 0.16, 0.18);

float hash12(vec2 p) {
    vec3 p3 = fract(vec3(p.xyx) * 0.1031);
    p3 += dot(p3, p3.yzx + 33.33);
    return fract((p3.x + p3.y) * p3.z);
}

vec2 PX;
vec2 UV;

float lum(vec2 o) {
    return dot(texture(tex, UV + o * PX).rgb, vec3(0.2126, 0.7152, 0.0722));
}

void main() {
    UV = v_texcoord;
    PX = 1.0 / vec2(textureSize(tex, 0));

    // Sobel edge detection (no wobble, keeps text sharp)
    float tl = lum(vec2(-1,  1)), t = lum(vec2(0,  1)), tr = lum(vec2(1,  1));
    float l  = lum(vec2(-1,  0)),                       r  = lum(vec2(1,  0));
    float bl = lum(vec2(-1, -1)), b = lum(vec2(0, -1)), br = lum(vec2(1, -1));
    float gx = -tl - 2.0 * l - bl + tr + 2.0 * r + br;
    float gy = -tl - 2.0 * t - tr + bl + 2.0 * b + br;
    float edge = smoothstep(0.15, 0.6, length(vec2(gx, gy)) * EDGE_STRENGTH);

    // Light single-direction hatching, only in dark areas
    vec3 src = texture(tex, v_texcoord).rgb;
    float tone = dot(src, vec3(0.2126, 0.7152, 0.0722));

    vec2 fc = gl_FragCoord.xy;
    float hatch = 0.0;
    if (tone < 0.45) hatch = step(mod(fc.x + fc.y, HATCH_SPACING), 1.0) * HATCH_AMOUNT;

    // Gentle tone so dark backgrounds still read as dark
    float wash = (1.0 - tone) * 0.12;

    float ink = clamp(edge + hatch + wash, 0.0, 1.0);

    // Paper with light grain
    vec3 paper = PAPER * (1.0 + (hash12(fc) - 0.5) * GRAIN * 2.0);

    vec3 col = mix(paper, GRAPHITE, ink);

    fragColor = vec4(clamp(col, 0.0, 1.0), 1.0);
}
