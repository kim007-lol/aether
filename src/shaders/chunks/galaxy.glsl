#include <fbm>
vec3 galaxyColor(vec3 d){float band=exp(-pow(dot(d,normalize(vec3(.3,.8,.4)))*4.,2.));float n=fbm(d*5.2);float dust=smoothstep(.42,.68,fbm(d*12.+4.));float emission=band*(.05+.22*n)*(1.-dust*.87);vec3 col=mix(vec3(.025,.018,.07),vec3(.15,.105,.065),n)*emission;return col+vec3(.0007,.0012,.0024);}
