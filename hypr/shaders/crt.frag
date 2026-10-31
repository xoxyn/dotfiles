#version 300 es
precision highp float;

in vec2 v_texcoord;
uniform sampler2D tex;
out vec4 fragColor;

void main() {
    vec2 uv = v_texcoord;

    vec4 color = texture(tex, uv);

    // Scanlines
    float scanline = sin(uv.y * 1080.0 * 3.14159) * 0.04;

    // Slight vignette
    vec2 centered = uv - 0.5;
    float vignette = 1.0 - dot(centered, centered) * 0.7;

    color.rgb *= (1.0 - scanline) * vignette;

    fragColor = color;
}
