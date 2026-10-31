#version 300 es
precision highp float;

in vec2 v_texcoord;
uniform sampler2D tex;
out vec4 fragColor;

// Tweakables
// Warmer / dimmer = lower blue. Try (1.0, 0.85, 0.70) for mild,
// (1.0, 0.72, 0.45) for strong.
const vec3  WARMTH = vec3(1.00, 0.80, 0.58);
const float DIM    = 0.95;

void main() {
    vec3 c = texture(tex, v_texcoord).rgb;
    float lumaBefore = dot(c, vec3(0.2126, 0.7152, 0.0722));

    c *= WARMTH;

    // Restore some of the lost brightness so whites don't turn muddy
    float lumaAfter = dot(c, vec3(0.2126, 0.7152, 0.0722));
    c *= mix(1.0, lumaBefore / max(lumaAfter, 0.001), 0.5);

    fragColor = vec4(clamp(c * DIM, 0.0, 1.0), 1.0);
}
