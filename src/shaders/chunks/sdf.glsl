vec2 sphereHit(vec3 ro,vec3 rd,float radius){float b=dot(ro,rd);float c=dot(ro,ro)-radius*radius;float d=b*b-c;if(d<0.)return vec2(1.,-1.);float s=sqrt(max(d,0.));return vec2(-b-s,-b+s);}
