#include <fbm>
float terrain(vec3 n){vec3 p=n*2.2;p+=.35*vec3(fbm(p*1.7),fbm(p*1.7+7.3),fbm(p*1.7+13.1));float h=fbm(p+vec3(3.1,1.4,5.8));float mountains=pow(ridge(n*22.),3.)*smoothstep(.53,.7,h)*.12;return h+mountains;}
float cloudDensity(vec3 p,float time){vec3 q=p*4.2+vec3(time*.004,0.,time*.007);return fbm(q+vec3(fbm(q*1.8),0.,fbm(q*1.3))*1.5)*.75+fbm(p*14.-time*.004)*.25;}
