#version 450
#extension GL_ARB_separate_shader_objects : enable

layout(location = 0) out vec4 color;

layout (binding = 0) uniform sampler2D colorTex;

layout (location = 0 ) in VS_OUT
{
  vec2 texCoord;
} surf;

float gaussian(float x, float sigma) {
    return exp(-x * x / (2 * sigma));
}

vec4 bilateralFilter(const sampler2D tex, const vec2 texCoord, const int window_size) {
    const vec4 curColor = textureLod(tex, texCoord, 0);
    const vec2 step = 1. / textureSize(tex, 0);
    vec4 result = vec4(0);
    float weight = 0.;

    for (int i = -window_size; i < window_size; ++i)
        for (int j = -window_size; j < window_size; ++j) {
            vec4 offsetColor = textureLod(tex, texCoord + step * vec2(i, j), 0);
            float w = gaussian(length(offsetColor - curColor), 0.005) * gaussian(length(vec2(i, j)), 10);
            result += offsetColor * w;
            weight += w;
        }

    return result / weight;
}

void main()
{
  color = bilateralFilter(colorTex, surf.texCoord, 4);
}
