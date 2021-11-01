#version 450
#extension GL_ARB_separate_shader_objects : enable
#extension GL_GOOGLE_include_directive : require

#include "unpack_attributes.h"


layout(location = 0) in vec4 vPosNorm;
layout(location = 1) in vec4 vTexCoordAndTang;

layout(push_constant) uniform params_t
{
    mat4 mProjView;
    mat4 mModel;
} params;


layout (location = 0 ) out VS_OUT
{
    vec3 wPos;
    vec3 wNorm;
    vec3 wTangent;
    vec2 texCoord;
    vec3 color;
} vOut;

vec3 posterize(vec3 vec, uint layers) {
    return ceil(vec * layers) / layers;
}

vec3 color(vec3 pos, vec3 normal) {
    vec3 poscolor = clamp(sin(pos*30.) / 2.0f + 0.5f + log(pos + 1)/4 , 0.f, 1.f);
    vec3 normcolor = (cos(normal * 100) + 7.) / 8.;  // [6/8, 1]
    return posterize(poscolor * normcolor, 3);
}

out gl_PerVertex { vec4 gl_Position; };
void main(void)
{
    const vec4 wNorm = vec4(DecodeNormal(floatBitsToInt(vPosNorm.w)),         0.0f);
    const vec4 wTang = vec4(DecodeNormal(floatBitsToInt(vTexCoordAndTang.z)), 0.0f);

    vOut.wPos     = (params.mModel * vec4(vPosNorm.xyz, 1.0f)).xyz;
    vOut.wNorm    = normalize(mat3(transpose(inverse(params.mModel))) * wNorm.xyz);
    vOut.wTangent = normalize(mat3(transpose(inverse(params.mModel))) * wTang.xyz);
    vOut.texCoord = vTexCoordAndTang.xy;
    vOut.color = color(vOut.wPos, vOut.wNorm);

    gl_Position   = params.mProjView * vec4(vOut.wPos, 1.0);
}
