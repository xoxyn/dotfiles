#version 300 es
precision highp float;

in vec2 v_texcoord;
uniform sampler2D tex;
out vec4 fragColor;

// ---------------------------------------------------------------
// Tweakables
// ---------------------------------------------------------------
#define INVERT        0      // 1 = flip dark themes into dark-ink-on-paper
const float SATURATION   = 0.55;   // 0 = pure monochrome ink, 1 = full colour
const float INK_SPREAD   = 0.45;   // soft ink bleed around text edges
const float GRAIN_AMOUNT = 1.0;    // overall paper texture strength
const float VIGNETTE     = 0.55;   // darkening/yellowing toward edges

const vec3 INK_COLOR   = vec3(0.140, 0.112, 0.095);  // warm dark brown, not pure black
const vec3 PAPER_COLOR = vec3(0.965, 0.930, 0.830);  // cream paper

// ---------------------------------------------------------------
// Noise helpers (no sin(), so no banding on big screens)
// ---------------------------------------------------------------
float hash12(vec2 p) {
    vec3 p3 = fract(vec3(p.xyx) * 0.1031);
    p3 += dot(p3, p3.yzx + 33.33);
    return fract((p3.x + p3.y) * p3.z);
}

float vnoise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    float a = hash12(i);
    float b = hash12(i + vec2(1.0, 0.0));
    float c = hash12(i + vec2(0.0, 1.0));
    float d = hash12(i + vec2(1.0, 1.0));
    return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}

float fbm(vec2 p) {
    float v = 0.0;
    float a = 0.5;
    for (int i = 0; i < 4; i++) {
        v += a * vnoise(p);
        p = p * 2.03 + 17.0;
        a *= 0.5;
    }
    return v;
}

mat2 rot(float a) {
    float s = sin(a), c = cos(a);
    return mat2(c, -s, s, c);
}

void main() {
    vec2 uv = v_texcoord;
    vec2 fc = gl_FragCoord.xy;
    vec2 px = 1.0 / vec2(textureSize(tex, 0));

    // --- Source + subtle ink bleed ---------------------------------
    vec3 c = texture(tex, uv).rgb;
    vec3 blur = 0.25 * (texture(tex, uv + vec2( px.x, 0.0)).rgb +
                        texture(tex, uv + vec2(-px.x, 0.0)).rgb +
                        texture(tex, uv + vec2(0.0,  px.y)).rgb +
                        texture(tex, uv + vec2(0.0, -px.y)).rgb);
    c = mix(c, min(c, blur), INK_SPREAD);

#if INVERT
    c = 1.0 - c;
#endif

    // --- Ink-on-paper tone mapping ---------------------------------
    float luma = dot(c, vec3(0.2126, 0.7152, 0.0722));
    vec3 muted = mix(vec3(luma), c, SATURATION);

    // Slight S-curve so text stays crisp and readable
    muted = smoothstep(0.0, 1.0, muted * 1.04 - 0.02);

    // Per-channel lerp from ink to paper keeps a hint of the original hue
    vec3 col = mix(INK_COLOR, PAPER_COLOR, muted);

    // --- Paper texture ---------------------------------------------
    // Large soft mottling (uneven pulp / aging)
    float mottle = fbm(fc / 220.0);

    // Fibres: noise stretched along two different angles
    float fib1 = vnoise(rot(0.35) * fc * vec2(0.9, 0.05));
    float fib2 = vnoise(rot(-1.10) * fc * vec2(0.7, 0.04));
    float fibres = (fib1 + fib2) * 0.5;

    // Fine tooth / grain
    float tooth = hash12(fc) * 0.6 + vnoise(fc * 0.7) * 0.4;

    float tex_mod = 1.0
        + (mottle - 0.5) * 0.10 * GRAIN_AMOUNT
        + (fibres - 0.5) * 0.07 * GRAIN_AMOUNT
        + (tooth  - 0.5) * 0.06 * GRAIN_AMOUNT;

    // Texture is multiplicative, so it shows on bright paper and
    // barely touches dark ink (which keeps text clean)
    col *= tex_mod;

    // Warm blotches where the paper looks slightly aged
    col *= mix(vec3(1.0), vec3(1.0, 0.965, 0.90), smoothstep(0.45, 0.75, mottle) * GRAIN_AMOUNT);

    // --- Vignette: edges go darker and a bit yellow -----------------
    float d = length((uv - 0.5) * vec2(1.0, 0.85));
    float vig = smoothstep(0.85, 0.25, d);
    col *= mix(mix(vec3(1.0), vec3(0.90, 0.84, 0.70), VIGNETTE), vec3(1.0), vig);

    fragColor = vec4(clamp(col, 0.0, 1.0), 1.0);
}
