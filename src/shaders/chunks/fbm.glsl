#include <noise>
float fbm(vec3 p){float v=0.,a=.5;for(int i=0;i<5;i++){v+=a*noise3(p);p=p*2.03+vec3(5.7,9.2,1.8);a*=.5;}return v;}
float ridge(vec3 p){return 1.-abs(noise3(p)*2.-1.);}
