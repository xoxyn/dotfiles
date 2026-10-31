#version 300 es
precision highp float;

in vec2 v_texcoord;
uniform sampler2D tex;
out vec4 fragColor;

// Tweakables
const float CURVE      = 0.05;    // screen bulge (0 = flat)
const float SCANLINE   = 0.22;    // scanline darkness
const float MASK       = 0.08;    // RGB phosphor mask strength
const float ABERRATION = 0.0015;  // colour fringing at the edges
const float VIGNETTE   = 0.40;
const float BRIGHTNESS = 1.12;    // compensates for the darkening above

vec2 curve(vec2 uv) {
    uv = uv * 2.0 - 1.0;
    uv *= 1.0 + dot(uv, uv) * CURVE;
    return uv * 0.5 + 0.5;
}

void main() {
    vec2 uv = curve(v_texcoord);

    // Outside the curved tube = black bezel
    if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) {
        fragColor = vec4(0.0, 0.0, 0.0, 1.0);
        return;
    }

    // Chromatic aberration grows toward the edges
    vec2 dir = (uv - 0.5) * ABERRATION * 2.0;
    vec3 col;
    col.r = texture(tex, uv + dir).r;
    col.g = texture(tex, uv).g;
    col.b = texture(tex, uv - dir).b;

    // Scanlines
    float s = 0.5 + 0.5 * sin(gl_FragCoord.y * 3.14159265);
    col *= 1.0 - SCANLINE * (1.0 - s);

    // Phosphor RGB mask
    int px = int(mod(gl_FragCoord.x, 3.0));
    vec3 mask = vec3(1.0 - MASK);
    mask[px] = 1.0;
    col *= mask;

    // Vignette
    vec2 v = uv * (1.0 - uv);
    float vig = pow(clamp(v.x * v.y * 16.0, 0.0, 1.0), VIGNETTE);
    col *= vig;

    fragColor = vec4(clamp(col * BRIGHTNESS, 0.0, 1.0), 1.0);
}
