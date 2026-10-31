#version 300 es
precision highp float;

in vec2 v_texcoord;
uniform sampler2D tex;
out vec4 fragColor;

// Tweakables
const float CONTRAST = 1.25;
const float GRAIN    = 0.07;
const float VIGNETTE = 0.45;
const vec3  TINT     = vec3(1.00, 0.98, 0.95);  // slight warm silver tone

float hash12(vec2 p) {
    vec3 p3 = fract(vec3(p.xyx) * 0.1031);
    p3 += dot(p3, p3.yzx + 33.33);
    return fract((p3.x + p3.y) * p3.z);
}

void main() {
    vec2 uv = v_texcoord;
    vec3 c = texture(tex, uv).rgb;

    float l = dot(c, vec3(0.2126, 0.7152, 0.0722));

    // S-curve contrast around mid grey
    l = clamp((l - 0.5) * CONTRAST + 0.5, 0.0, 1.0);
    l = smoothstep(0.0, 1.0, l);

    // Film grain, strongest in the midtones
    float g = hash12(gl_FragCoord.xy) - 0.5;
    l += g * GRAIN * (1.0 - abs(l - 0.5) * 1.4);

    // Vignette
    float d = length(uv - 0.5);
    l *= 1.0 - VIGNETTE * smoothstep(0.35, 0.85, d);

    fragColor = vec4(clamp(vec3(l) * TINT, 0.0, 1.0), 1.0);
}
