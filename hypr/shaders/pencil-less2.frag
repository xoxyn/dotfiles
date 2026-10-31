#version 300 es
precision highp float;

in vec2 v_texcoord;
uniform sampler2D tex;
out vec4 fragColor;

// Tweakables
const float DARK_THEME    = 0.0;    // 1.0 = invert (light text on dark bg becomes dark ink on paper)
const float CONTRAST_LOW  = 0.35;   // tones below this become full ink
const float CONTRAST_HIGH = 0.75;   // tones above this become pure paper
const float EDGE_AMOUNT   = 0.25;   // light outline accent (0 = off)
const float HATCH_AMOUNT  = 0.12;   // midtone shading only (0 = off)
const float HATCH_SPACING = 4.0;
const float GRAIN         = 0.02;

const vec3 PAPER    = vec3(0.960, 0.945, 0.905);
const vec3 GRAPHITE = vec3(0.12, 0.12, 0.14);

float hash12(vec2 p) {
    vec3 p3 = fract(vec3(p.xyx) * 0.1031);
    p3 += dot(p3, p3.yzx + 33.33);
    return fract((p3.x + p3.y) * p3.z);
}

vec2 PX;

float lum(vec2 o) {
    vec3 c = texture(tex, v_texcoord + o * PX).rgb;
    float l = dot(c, vec3(0.2126, 0.7152, 0.0722));
    return mix(l, 1.0 - l, DARK_THEME);
}

void main() {
    PX = 1.0 / vec2(textureSize(tex, 0));

    float tone = lum(vec2(0.0));

    // Main ink: direct brightness with a steep contrast curve (keeps text solid)
    float ink = 1.0 - smoothstep(CONTRAST_LOW, CONTRAST_HIGH, tone);

    // Light edge accent from a cheap 4-tap gradient
    float gx = lum(vec2(1, 0)) - lum(vec2(-1, 0));
    float gy = lum(vec2(0, 1)) - lum(vec2(0, -1));
    float edge = smoothstep(0.2, 0.6, length(vec2(gx, gy))) * EDGE_AMOUNT;

    // Hatching only on partial midtones, never on solid text or empty paper
    vec2 fc = gl_FragCoord.xy;
    float mid = smoothstep(0.35, 0.5, tone) * (1.0 - smoothstep(0.6, 0.8, tone));
    float hatch = step(mod(fc.x + fc.y, HATCH_SPACING), 1.0) * HATCH_AMOUNT * mid;

    ink = clamp(max(ink, edge) + hatch, 0.0, 1.0);

    vec3 paper = PAPER * (1.0 + (hash12(fc) - 0.5) * GRAIN * 2.0);
    vec3 col = mix(paper, GRAPHITE, ink);

    fragColor = vec4(clamp(col, 0.0, 1.0), 1.0);
}
