#include <galaxy>
varying vec3 vDirection;void main(){gl_FragColor=vec4(galaxyColor(normalize(vDirection)),1.);}