#version 300 es
precision highp float;

in vec2 v_texcoord;
uniform sampler2D tex;
out vec4 fragColor;

// Tweakables
const float PIXEL_SIZE = 4.0;    // size of each "big pixel" in screen pixels
const float LEVELS     = 12.0;   // colour levels per channel (0 = off)
const float SATURATION = 1.15;
const float GRID       = 0.06;   // faint dark gap between pixels (0 = off)

void main() {
    vec2 res = vec2(textureSize(tex, 0));

    // Snap to the centre of each block
    vec2 p = v_texcoord * res;
    vec2 cell = floor(p / PIXEL_SIZE);
    vec2 snapped = (cell + 0.5) * PIXEL_SIZE;
    vec3 col = texture(tex, snapped / res).rgb;

    // Posterize
    if (LEVELS > 0.5) {
        col = floor(col * LEVELS + 0.5) / LEVELS;
    }

    // Saturation boost
    float l = dot(col, vec3(0.2126, 0.7152, 0.0722));
    col = mix(vec3(l), col, SATURATION);

    // Subtle pixel grid
    if (GRID > 0.0) {
        vec2 local = fract(p / PIXEL_SIZE);
        float gap = step(local.x, 1.0 / PIXEL_SIZE) + step(local.y, 1.0 / PIXEL_SIZE);
        col *= 1.0 - GRID * clamp(gap, 0.0, 1.0);
    }

    fragColor = vec4(clamp(col, 0.0, 1.0), 1.0);
}
