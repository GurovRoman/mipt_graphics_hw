#version 450
#extension GL_ARB_separate_shader_objects : enable
#extension GL_GOOGLE_include_directive : require

#include "common.h"

layout(location = 0) out vec4 out_fragColor;

layout (location = 0 ) in VS_OUT
{
  vec3 wPos;
  vec3 wNorm;
  vec3 wTangent;
  vec2 texCoord;
  vec3 color;
} surf;

layout(binding = 0, set = 0) uniform AppData
{
  UniformParams Params;
};

layout (binding = 1) uniform sampler2D shadowMap;

vec3 posterize(vec3 vec, uint layers) {
  return ceil(vec * layers) / layers;
}

vec3 color(vec3 pos, vec3 normal) {
  vec3 poscolor = clamp(sin(pos*30.) / 2.0f + 0.5f + log(pos + 1)/4 , 0.f, 1.f);
  vec3 normcolor = (cos(normal * 100) + 7.) / 8.;  // [6/8, 1]
  return posterize(poscolor * normcolor, 3);
}

void main()
{
  const vec4 posLightClipSpace = Params.lightMatrix*vec4(surf.wPos, 1.0f); // 
  const vec3 posLightSpaceNDC  = posLightClipSpace.xyz/posLightClipSpace.w;    // for orto matrix, we don't need perspective division, you can remove it if you want; this is general case;
  const vec2 shadowTexCoord    = posLightSpaceNDC.xy*0.5f + vec2(0.5f, 0.5f);  // just shift coords from [-1,1] to [0,1]

  const bool  outOfView = (shadowTexCoord.x < 0.0001f || shadowTexCoord.x > 0.9999f || shadowTexCoord.y < 0.0091f || shadowTexCoord.y > 0.9999f);
  const float shadow    = ((posLightSpaceNDC.z < textureLod(shadowMap, shadowTexCoord, 0).x + 0.001f) || outOfView) ? 1.0f : 0.5f;

  const vec4 dark_violet = vec4(0.59f, 0.0f, 0.82f, 1.0f);
  const vec4 chartreuse  = vec4(0.5f, 1.0f, 0.0f, 1.0f);

  const bool vertcolor = false;
  vec4 lightColor1 = vec4(vertcolor ? surf.color : color(surf.wPos, surf.wNorm), 1.0f);
   
  vec3 lightDir   = normalize(Params.lightPos - surf.wPos);
  vec4 lightColor = (max(dot(surf.wNorm, lightDir), 0.0f) * 0.95 + 0.05) * lightColor1;
  out_fragColor   = lightColor*shadow;
}
