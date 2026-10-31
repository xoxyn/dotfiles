#version 300 es
precision highp float;

in vec2 v_texcoord;
uniform sampler2D tex;
out vec4 fragColor;

// Tweakables
const float DITHER = 0.30;   // 0 = hard bands, higher = more dithering

// Classic DMG green palette, dark to light
const vec3 PALETTE[4] = vec3[4](
    vec3(0.059, 0.220, 0.059),
    vec3(0.188, 0.384, 0.188),
    vec3(0.545, 0.675, 0.059),
    vec3(0.608, 0.737, 0.059)
);

// 4x4 Bayer ordered-dither matrix
const float BAYER[16] = float[16](
     0.0,  8.0,  2.0, 10.0,
    12.0,  4.0, 14.0,  6.0,
     3.0, 11.0,  1.0,  9.0,
    15.0,  7.0, 13.0,  5.0
);

void main() {
    vec3 c = texture(tex, v_texcoord).rgb;
    float l = dot(c, vec3(0.2126, 0.7152, 0.0722));

    int x = int(mod(gl_FragCoord.x, 4.0));
    int y = int(mod(gl_FragCoord.y, 4.0));
    float threshold = BAYER[y * 4 + x] / 16.0 - 0.5;

    float v = clamp(l + threshold * DITHER, 0.0, 0.999);
    int idx = int(floor(v * 4.0));

    fragColor = vec4(PALETTE[idx], 1.0);
}
