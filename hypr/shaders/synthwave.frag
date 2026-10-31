#version 300 es
precision highp float;

in vec2 v_texcoord;
uniform sampler2D tex;
out vec4 fragColor;

// Tweakables
const float ORIGINAL_MIX = 0.15;   // how much of the real colours leak through
const float GLOW         = 0.35;   // soft neon bloom on bright areas

const vec3 C0 = vec3(0.04, 0.00, 0.12);  // deep indigo
const vec3 C1 = vec3(0.45, 0.05, 0.55);  // purple
const vec3 C2 = vec3(0.98, 0.15, 0.62);  // hot pink
const vec3 C3 = vec3(0.20, 0.90, 1.00);  // cyan

vec3 ramp(float l) {
    if (l < 0.33) return mix(C0, C1, l / 0.33);
    if (l < 0.66) return mix(C1, C2, (l - 0.33) / 0.33);
    return mix(C2, C3, (l - 0.66) / 0.34);
}

void main() {
    vec2 uv = v_texcoord;
    vec3 c = texture(tex, uv).rgb;
    float l = dot(c, vec3(0.2126, 0.7152, 0.0722));

    vec3 mapped = ramp(clamp(l, 0.0, 1.0));

    // Cheap bloom: neon colours bleed out of bright regions
    vec2 px = 1.0 / vec2(textureSize(tex, 0));
    float nb = 0.0;
    nb += dot(texture(tex, uv + px * vec2( 3.0,  0.0)).rgb, vec3(0.333));
    nb += dot(texture(tex, uv + px * vec2(-3.0,  0.0)).rgb, vec3(0.333));
    nb += dot(texture(tex, uv + px * vec2( 0.0,  3.0)).rgb, vec3(0.333));
    nb += dot(texture(tex, uv + px * vec2( 0.0, -3.0)).rgb, vec3(0.333));
    nb *= 0.25;
    mapped += ramp(nb) * smoothstep(0.5, 1.0, nb) * GLOW;

    vec3 col = mix(mapped, c, ORIGINAL_MIX);
    fragColor = vec4(clamp(col, 0.0, 1.0), 1.0);
}
