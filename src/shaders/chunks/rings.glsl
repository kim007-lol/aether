float ringDensity(float r){float base=smoothstep(14.,14.5,r)*(1.-smoothstep(29.,30.,r));base*=1.-.96*exp(-pow((r-18.2)/.5,4.));base*=1.-.98*exp(-pow((r-22.6)/.9,4.));base*=1.-.9*exp(-pow((r-26.8)/.3,4.));return base*(.75+.15*sin(r*20.));}
float planetShadow(vec3 p,vec3 sun){float along=dot(-p,sun);float distance=length(p+sun*max(along,0.));return along>0.?smoothstep(9.7,10.5,distance):1.;}
