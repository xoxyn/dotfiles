#version 300 es
precision highp float;

in vec2 v_texcoord;
uniform sampler2D tex;
out vec4 fragColor;

// Tweakables
const float EDGE_STRENGTH = 3.0;    // how bold outlines are
const float HATCH_SPACING = 5.0;    // pixels between hatch lines
const float HATCH_AMOUNT  = 0.55;   // shading darkness
const float COLOR_MIX     = 0.0;    // 0 = graphite, 1 = coloured pencil
const float GRAIN         = 0.06;

const vec3 PAPER    = vec3(0.955, 0.940, 0.900);
const vec3 GRAPHITE = vec3(0.16, 0.16, 0.18);

float hash12(vec2 p) {
    vec3 p3 = fract(vec3(p.xyx) * 0.1031);
    p3 += dot(p3, p3.yzx + 33.33);
    return fract((p3.x + p3.y) * p3.z);
}

float vnoise(vec2 p) {
    vec2 i = floor(p), f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash12(i), hash12(i + vec2(1, 0)), u.x),
               mix(hash12(i + vec2(0, 1)), hash12(i + vec2(1, 1)), u.x), u.y);
}

vec2 PX;
vec2 UV;

float lum(vec2 o) {
    return dot(texture(tex, UV + o * PX).rgb, vec3(0.2126, 0.7152, 0.0722));
}

void main() {
    UV = v_texcoord;
    PX = 1.0 / vec2(textureSize(tex, 0));

    // Slight hand-drawn wobble on the edge sampling
    vec2 wob = (vec2(vnoise(gl_FragCoord.xy * 0.08),
                     vnoise(gl_FragCoord.xy * 0.08 + 40.0)) - 0.5) * 1.2;
    UV += wob * PX;

    // Sobel edge detection
    float tl = lum(vec2(-1,  1)), t = lum(vec2(0,  1)), tr = lum(vec2(1,  1));
    float l  = lum(vec2(-1,  0)),                       r  = lum(vec2(1,  0));
    float bl = lum(vec2(-1, -1)), b = lum(vec2(0, -1)), br = lum(vec2(1, -1));
    float gx = -tl - 2.0 * l - bl + tr + 2.0 * r + br;
    float gy = -tl - 2.0 * t - tr + bl + 2.0 * b + br;
    float edge = smoothstep(0.05, 0.45, length(vec2(gx, gy)) * EDGE_STRENGTH);

    // Cross-hatching: more directions in darker areas
    UV = v_texcoord;
    vec3 src = texture(tex, UV).rgb;
    float tone = dot(src, vec3(0.2126, 0.7152, 0.0722));
    tone += (hash12(gl_FragCoord.xy * 0.5) - 0.5) * 0.18;  // irregular strokes

    vec2 fc = gl_FragCoord.xy;
    float hatch = 0.0;
    if (tone < 0.80) hatch += step(mod(fc.x + fc.y, HATCH_SPACING), 1.0);
    if (tone < 0.55) hatch += step(mod(fc.x - fc.y, HATCH_SPACING), 1.0);
    if (tone < 0.30) hatch += step(mod(fc.x, HATCH_SPACING * 0.8), 1.0);
    hatch = clamp(hatch, 0.0, 1.0) * HATCH_AMOUNT;

    // Light overall tone wash so flat areas aren't empty
    float wash = (1.0 - tone) * 0.25;

    float ink = clamp(edge + hatch + wash, 0.0, 1.0);

    // Paper with fibres/grain
    float paperNoise = vnoise(fc * 0.9) * 0.5 + hash12(fc) * 0.5;
    vec3 paper = PAPER * (1.0 + (paperNoise - 0.5) * GRAIN * 2.0);

    vec3 pencil = mix(GRAPHITE, src * 0.85, COLOR_MIX);
    vec3 col = mix(paper, pencil, ink);

    // Graphite is a bit grainy itself
    col += (hash12(fc + 7.0) - 0.5) * GRAIN * ink;

    fragColor = vec4(clamp(col, 0.0, 1.0), 1.0);
}
