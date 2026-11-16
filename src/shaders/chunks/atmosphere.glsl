float phaseRayleigh(float mu){return .0596831*(1.+mu*mu);}
float phaseMie(float mu,float g){return .0795775*(1.-g*g)/pow(max(1.+g*g-2.*g*mu,.001),1.5);}
