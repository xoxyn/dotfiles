// Simple CRT effect for Ghostty.

// -- CONFIGURATION --
const float CURVATURE = 0.10;          // screen bulge (0 = flat)
const float SCANLINE_STRENGTH = 0.15;  // 0 = none, 0.3 = heavy
const float SCANLINE_PERIOD = 3.0;     // pixels per scanline
const float ABERRATION = 0.8;          // RGB fringing in pixels (0 = off)
const float VIGNETTE = 0.35;           // corner darkening
const float FLICKER = 0.015;           // subtle brightness wobble (0 = off)
const float BRIGHTNESS = 1.08;         // compensates for scanline darkening

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    vec2 uv = fragCoord / iResolution.xy;

    // Barrel distortion
    vec2 centered = uv - 0.5;
    float r2 = dot(centered, centered);
    vec2 curved = uv + centered * r2 * CURVATURE * 2.0;

    // Outside the curved screen: black bezel
    if (curved.x < 0.0 || curved.x > 1.0 || curved.y < 0.0 || curved.y > 1.0) {
        fragColor = vec4(0.0, 0.0, 0.0, 1.0);
        return;
    }

    // Chromatic aberration: shift red and blue horizontally in opposite directions
    float shift = ABERRATION / iResolution.x;
    float red   = texture(iChannel0, curved + vec2(shift, 0.0)).r;
    vec2  gb    = texture(iChannel0, curved).ga;
    float blue  = texture(iChannel0, curved - vec2(shift, 0.0)).b;
    vec3 color = vec3(red, gb.x, blue);

    // Scanlines
    float scan = 0.5 + 0.5 * sin(fragCoord.y * 6.2831853 / SCANLINE_PERIOD);
    color *= 1.0 - SCANLINE_STRENGTH * scan;

    // Vignette
    color *= 1.0 - VIGNETTE * smoothstep(0.1, 0.6, r2 * 2.0);

    // Gentle flicker
    color *= 1.0 + FLICKER * sin(iTime * 60.0);

    fragColor = vec4(color * BRIGHTNESS, gb.y);
}
