/* ---------- Pixel art: tudo nasce de uma fonte só e cada era reinterpreta os pixels ---------- */
const TS=16,SC=4,T=TS*SC,COLS=16,ROWS=10,W=COLS*T,H=ROWS*T,K=SC/3;
const ERAS=[
  {id:"tty",ano:1963,nome:"Teletipo"},
  {id:"ascii",ano:1980,nome:"ASCII"},
  {id:"1bit",ano:1982,nome:"1 bit"},
  {id:"4tons",ano:1983,nome:"4 tons"},
  {id:"8bit",ano:1985,nome:"8 bits"},
  {id:"16bit",ano:1991,nome:"16 bits"},
  {id:"3d",ano:1996,nome:"3D"},
];
const BIOMAS={
  campo:{chao:["#5fae45","#4f9a3b","#78c457"],parede:["#8a8f9c","#62667a","#b1b6c2"],copa:["#2f8a45","#1f6335","#4fb25c"],agua:["#2f73d8","#1f52ab","#5aa2f2"],espuma:"#e8f6ff",ambiente:"#fff6e6"},
  mata:{chao:["#3e8f5a","#327a4c","#56a86e"],parede:["#6b5a48","#4a3d31","#8d7861"],copa:["#1f6d54","#134d3c","#2f9470"],agua:["#1f7f9c","#145e75","#3fb0c9"],espuma:"#cfeef0",ambiente:"#b4d2c6"},
  deserto:{chao:["#e3bd72","#cfa65b","#f1d28e"],parede:["#b8763f","#8f5730","#d8975c"],copa:["#7f9c3a","#5f7a28","#a3c054"],agua:["#d6482a","#a8301c","#f5923a"],espuma:"#ffe08a",ambiente:"#ffe2bc"},
  cristal:{chao:["#9fb4e0","#8299cb","#c2d2f2"],parede:["#5e6fc0","#434f96","#8ea0e8"],copa:["#6ae0e0","#3fb0c0","#b8fbf2"],agua:["#2a2f7a","#1c1f58","#4a54b8"],espuma:"#9fb0ff",ambiente:"#bcc8f2"},
  nucleo:{chao:["#3b2a56","#2e2046","#4f3a70"],parede:["#6a2f6f","#4a2050","#9a4a96"],copa:["#d83a7a","#a0285c","#ff76a8"],agua:["#0f0a1e","#06040e","#2a1c4a"],espuma:"#7a5ac0",ambiente:"#7c6cb0"},
};
const mk=(w,h)=>{const c=document.createElement("canvas");c.width=w;c.height=h;return c};
const hash=s=>{let h=2166136261;for(const c of s){h^=c.charCodeAt(0);h=Math.imul(h,16777619)}return h};
function rng(s){return()=>{s=s+0x6D2B79F5|0;let t=Math.imul(s^s>>>15,1|s);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
const BAYER=[[0,8,2,10],[12,4,14,6],[3,11,1,9],[15,7,13,5]];
const VERDES=[[15,56,15],[48,98,48],[139,172,15],[155,188,15]];
function filtra(c,era,manter){
  if(era!=="1bit"&&era!=="4tons")return c;
  const g=c.getContext("2d"),d=g.getImageData(0,0,c.width,c.height),p=d.data;
  const k=manter?[parseInt(manter.slice(1,3),16),parseInt(manter.slice(3,5),16),parseInt(manter.slice(5,7),16)]:null;
  for(let i=0,y=0;y<c.height;y++)for(let x=0;x<c.width;x++,i+=4){
    if(p[i+3]<128){p[i+3]=0;continue}
    if(k&&Math.abs(p[i]-k[0])+Math.abs(p[i+1]-k[1])+Math.abs(p[i+2]-k[2])<70)continue;
    const L=(.3*p[i]+.59*p[i+1]+.11*p[i+2])/255;
    if(era==="1bit"){
      const v=L>.5+.2*(BAYER[y&3][x&3]+.5)/16?232:12;
      p[i]=v;p[i+1]=v;p[i+2]=v-(v>100?8:0);
    }else{
      const q=VERDES[L<.27?0:L<.5?1:L<.72?2:3];
      p[i]=q[0];p[i+1]=q[1];p[i+2]=q[2];
    }
  }
  g.putImageData(d,0,0);
  return c;
}
const CACHE=new Map();
function tex(chave,era,fazer,manter){
  const k=chave+"|"+era+"|"+(manter||"");
  let c=CACHE.get(k);
  if(!c){c=filtra(fazer(),era,manter);CACHE.set(k,c)}
  return c;
}
function contorno(c,cor="#141020"){
  const g=c.getContext("2d"),{width:w,height:h}=c,d=g.getImageData(0,0,w,h).data;
  const a=(x,y)=>x>=0&&y>=0&&x<w&&y<h&&d[(y*w+x)*4+3]>128;
  g.fillStyle=cor;
  for(let y=0;y<h;y++)for(let x=0;x<w;x++)if(!a(x,y)&&(a(x-1,y)||a(x+1,y)||a(x,y-1)||a(x,y+1)))g.fillRect(x,y,1,1);
  return c;
}
/* Dobra a resolução sem borrar: é o que faz os 16 bits parecerem de outra geração */
function escala2x(c){
  const w=c.width,h=c.height,s=new Uint32Array(c.getContext("2d").getImageData(0,0,w,h).data.buffer);
  const o=mk(w*2,h*2),g=o.getContext("2d"),d=g.createImageData(w*2,h*2),b=new Uint32Array(d.data.buffer);
  const px=(x,y)=>s[Math.max(0,Math.min(h-1,y))*w+Math.max(0,Math.min(w-1,x))];
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){
    const P=px(x,y),A=px(x,y-1),B=px(x+1,y),C=px(x-1,y),D=px(x,y+1),i=y*2*w*2+x*2;
    b[i]=C===A&&C!==D&&A!==B?A:P;
    b[i+1]=A===B&&A!==C&&B!==D?B:P;
    b[i+w*2]=D===C&&D!==B&&C!==A?C:P;
    b[i+w*2+1]=B===D&&B!==A&&D!==C?D:P;
  }
  g.putImageData(d,0,0);
  return o;
}
/* Luz vinda de cima: clareia o topo, escurece a base e acende a borda superior */
function iluminar(c){
  const g=c.getContext("2d"),{width:w,height:h}=c,d=g.getImageData(0,0,w,h),p=d.data;
  const q=new Uint8ClampedArray(p);
  for(let y=0,i=0;y<h;y++)for(let x=0;x<w;x++,i+=4){
    if(q[i+3]<128)continue;
    if(q[i]+q[i+1]+q[i+2]<90)continue;
    const f=1.16-.34*y/h,borda=y<2||q[i-w*4+3]<128||q[i-w*4]+q[i-w*4+1]+q[i-w*4+2]<90?36:0;
    p[i]=q[i]*f+borda;p[i+1]=q[i+1]*f+borda;p[i+2]=q[i+2]*f+borda;
  }
  g.putImageData(d,0,0);
  return c;
}
function texLuz(cor){
  let c=CACHE.get("luz"+cor);
  if(c)return c;
  c=mk(128,128);
  const g=c.getContext("2d"),r=g.createRadialGradient(64,64,0,64,64,64);
  r.addColorStop(0,cor);r.addColorStop(.35,cor+"66");r.addColorStop(1,cor+"00");
  g.fillStyle=r;g.fillRect(0,0,128,128);
  CACHE.set("luz"+cor,c);
  return c;
}
function pintaTile(tipo,bio,v,hi,m=0){
  const R=hi?2:1,N=TS*R,c=mk(N,N),g=c.getContext("2d"),B=BIOMAS[bio],r=rng(hash(tipo+bio+v+hi+m));
  const p=(x,y,cor,w=1,h=1)=>{g.fillStyle=cor;g.fillRect(x*R,y*R,w*R,h*R)};
  const d=(x,y,cor,w=1,h=1)=>{g.fillStyle=cor;g.fillRect(x,y,w,h)};
  const flor=(x,y,pet,meio)=>{p(x,y-1,pet);p(x-1,y,pet);p(x+1,y,pet);p(x,y+1,pet);p(x,y,meio)};
  const enfeite=()=>{
    const[,e,c2]=B.chao;
    if(bio==="campo"||bio==="mata"){
      if(hi)for(let i=0;i<14;i++){const x=r()*30|0,y=2+r()*26|0;d(x,y,c2,1,3);d(x+1,y+1,e,1,2)}
      if(v===0){if(bio==="campo"){flor(5,5,"#fff4f0","#ffd23c");flor(11,10,"#ff9ac0","#fff4a0")}else{p(6,8,"#d8443c",4,2);p(7,7,"#d8443c",2,1);p(7,10,"#f0e4d0",2,2);p(7,8,"#fff",1,1)}}
      if(v===3){p(10,4,"#8a8f9c",3,2);p(10,4,"#b1b6c2",2,1)}
      if(v===5&&bio==="campo")flor(9,6,"#c8d8ff","#ffd23c");
    }else if(bio==="deserto"){
      if(hi)for(let i=0;i<4;i++){const y0=5+i*7;for(let x=0;x<N;x++)d(x,y0+Math.round(Math.sin(x*.4+v+i)*1.5),e)}
      if(v===2){p(4,9,"#b08a50",3,2);p(4,9,"#d8b078",2,1);p(10,5,"#b08a50",2,1)}
      if(v===5){p(7,8,"#8a7a3a",1,3);p(6,9,"#8a7a3a",1,2);p(8,9,"#8a7a3a",1,2)}
    }else if(bio==="cristal"){
      if(hi)for(let i=0;i<3;i++){const o=(v*7+i*11)%N;for(let k=0;k<12;k++)d((o+k)%N,(k+i*9)%N,c2)}
      if(v===2){p(7,7,"#b8fbf2",2,5);p(8,5,"#6ae0e0",1,2);p(9,9,"#6ae0e0",1,3)}
    }else{
      p(2,8,"#5a3f88",12,1);p(8,2,"#5a3f88",1,7);
      if(v%4===1){p(7,7,"#d83a7a",3,3);p(8,8,"#ffb0d0",1,1)}
    }
  };
  const chao=()=>{
    const[b,e,c2]=B.chao;
    if(hi)for(let y=0;y<N;y++)for(let x=0;x<N;x++){
      const n=.5+.22*Math.sin((x+v*5)*.62+Math.sin(y*.8+v)*1.4)+.22*Math.sin((y+v*3)*.55+Math.sin(x*.45)*1.2)+(r()-.5)*.3;
      d(x,y,n<.36?e:n>.68?c2:b);
    }else{
      p(0,0,b,TS,TS);
      for(let i=0;i<4;i++)p(r()*14|0,r()*15|0,e,2,1);
      for(let i=0;i<3;i++)p(r()*15|0,r()*15|0,c2);
    }
    enfeite();
  };
  switch(tipo){
    case"chao":chao();break;
    case"lado":
      p(0,0,B.parede[1],TS,TS);
      for(let i=0;i<18;i++)p(r()*15|0,r()*15|0,r()<.7?B.parede[0]:"#2a2030",2,1);
      p(0,0,B.chao[1],TS,2);
      break;
    case"parede":{
      const[b,e,c2]=B.parede;
      if(m&1){
        p(0,0,e,TS,TS);p(0,0,b,TS,14);
        if(hi)for(let i=0;i<46;i++)d(r()*30|0,r()*27|0,r()<.5?e:c2,2,1);
        else for(let i=0;i<5;i++)p(r()*14|0,r()*12|0,c2,2,1);
        p(0,0,c2,TS,1);
        if(hi&&bio==="mata")for(let i=0;i<7;i++)d(r()*28|0,r()*24|0,"#3f8a4a",4,2);
      }else{
        p(0,0,e,TS,TS);
        for(let f=0;f<3;f++){
          const o=f%2?-4:0,y=4+f*4;
          for(let i=0;i<3;i++){
            const x=o+i*8+(v&1);
            p(x,y,hi&&r()<.35?c2:b,7,3);
            p(x,y,c2,7,1);
            if(hi){d(x*2+2+(r()*8|0),y*2+4,e,3,1);d(x*2,y*2+5,e,14,1)}
          }
        }
        p(0,0,c2,TS,2);p(0,2,b,TS,1);p(0,3,e,TS,1);
        if(hi&&bio==="mata")for(let i=0;i<5;i++){const x=r()*30|0;d(x,6,"#3f8a4a",2,4+r()*12|0)}
        if(hi&&bio==="cristal")for(let i=0;i<3;i++)d(r()*28|0,10+r()*18|0,"#c8d4ff",3,1);
      }
      break;
    }
    case"arvore":{
      chao();
      const[b,e,c2]=B.copa;
      if(bio==="deserto"){
        p(7,2,b,3,13);p(7,2,c2,1,13);p(9,2,e,1,13);p(3,6,b,2,5);p(3,6,c2,1,5);p(4,10,b,4,2);p(12,5,b,2,4);p(10,8,b,3,2);
      }else if(bio==="cristal"||bio==="nucleo"){
        for(let y=1;y<15;y++){const m2=Math.round(y/3.2);p(8-m2,y,c2,m2,1);p(8,y,b,m2,1)}
        p(3,9,e,2,6);p(11,8,e,2,7);
      }else{
        p(6,11,"#5e3b1f",4,5);p(6,11,"#7a4e2a",1,5);
        for(let y=1;y<13;y++){const m2=Math.round(6.4*Math.sqrt(1-((y-6.5)/6.5)**2));p(8-m2,y,b,m2*2,1)}
        for(let i=0;i<9;i++){const x=3+r()*10|0,y=3+r()*8|0;p(x,y,r()<.5?e:c2,2,1)}
        p(5,3,c2,3,1);
      }
      break;
    }
    case"copa":{
      const[b,e,c2]=B.copa;
      p(0,0,b,TS,TS);
      for(let i=0;i<46;i++)p(r()*15|0,r()*15|0,r()<.5?e:c2,2,1);
      break;
    }
    case"agua":{
      const[b,e,c2]=B.agua;
      if(hi)for(let y=0;y<N;y++)for(let x=0;x<N;x++){
        const n=Math.sin((x+v*4)*.3+y*.18)+Math.sin((y-v*2)*.45+x*.12);
        d(x,y,n>1.25?c2:n<-.9?e:b);
      }else{
        p(0,0,b,TS,TS);
        for(let f=0;f<4;f++){
          const y=f*4+1,o=(v*2+f*5)%16;
          p(o,y,c2,4,1);p((o+9)%16,y+2,e,4,1);
        }
      }
      /* Margem orgânica: a terra avança sobre a água e a espuma acompanha o recorte */
      const px=(lado,i,k,cor)=>lado===0?p(i,k,cor):lado===1?p(15-k,i,cor):lado===2?p(i,15-k,cor):p(k,i,cor);
      const margem=(lado,ini)=>{
        for(let i=0;i<TS;i++){
          const fundo=ini+((i*7+lado*5+(m&15))%5>2?1:0);
          for(let k=ini;k<fundo;k++)px(lado,i,k,B.chao[1]);
          px(lado,i,fundo,(i+v*3+lado)%5===0?B.espuma:c2);
        }
      };
      if(m&1){
        if(m&16)margem(0,0);
        else{p(0,0,B.parede[1],TS,3);p(0,0,B.parede[0],TS,1);p(0,3,e,TS,1);margem(0,4)}
      }
      if(m&2)margem(1,0);
      if(m&4)margem(2,0);
      if(m&8)margem(3,0);
      break;
    }
    case"glitch":{
      const cs=["#0a0612","#ff2e88","#28e6d0","#0a0612","#f4f0ff","#3a1a6a"];
      for(let y=0;y<TS;y+=2){
        const lin=r()<.3;let q=cs[r()*cs.length|0];
        for(let x=0;x<TS;x+=2){if(!lin)q=cs[r()*cs.length|0];p(x,y,q,2,2)}
      }
      if(hi)for(let i=0;i<5;i++){const y=r()*N|0,h=1+r()*3|0;g.drawImage(c,0,y,N,h,(r()*10|0)-5,y,N,h)}
      break;
    }
    case"buraco":
      chao();
      for(let y=2;y<14;y++){const m2=Math.round(6.5*Math.sqrt(1-((y-7.5)/6)**2));p(8-m2,y,"#0d0814",m2*2,1)}
      p(4,3,B.chao[1],8,1);p(3,4,"#2a2030",10,1);
      if(hi){p(4,12,B.chao[2],8,1);p(6,7,"#1c1228",4,3)}
      break;
    case"tabua":
      p(0,0,B.agua[0],TS,TS);
      for(let i=0;i<4;i++){
        p(0,i*4,"#a56a34",TS,3);p(0,i*4,"#c98a4a",TS,1);p(0,i*4+3,"#5e3b1f",TS,1);p(3+i*3,i*4+1,"#7a4e2a",2,1);
        if(hi){d((5+i*9)%28,i*8+3,"#7a4e2a",6,1);d(1,i*8+2,"#3a2412",2,2);d(29,i*8+2,"#3a2412",2,2)}
      }
      break;
    case"porta":{
      const[b,e,c2]=B.parede;
      p(0,0,e,TS,TS);p(0,0,c2,TS,2);p(0,14,b,TS,2);
      for(let x=1;x<TS;x+=4){p(x,2,"#2b2b38",2,12);if(hi)d(x*2,4,"#5a5a70",1,24)}
      p(0,6,"#2b2b38",TS,2);p(6,5,"#f2c94c",4,4);p(7,6,"#6b4a10",2,2);
      break;
    }
    case"aberta":
      chao();
      p(0,0,B.parede[1],2,TS);p(14,0,B.parede[1],2,TS);p(0,0,B.parede[2],1,TS);p(14,0,B.parede[2],1,TS);
      break;
  }
  return c;
}
function pintaArvore(bio,v){
  const c=mk(32,48),g=c.getContext("2d"),[b,e,l]=BIOMAS[bio].copa,r=rng(hash(bio+v));
  const p=(x,y,w,h,cor)=>{g.fillStyle=cor;g.fillRect(x,y,w,h)};
  const disco=(cx,cy,ra)=>{
    for(let y=-ra;y<=ra;y++)for(let x=-ra;x<=ra;x++){
      if(x*x+y*y>ra*ra)continue;
      const n=(x+y)/ra+(r()-.5)*.5;
      p(cx+x,cy+y,1,1,n<-.55?l:n>.55?e:b);
    }
  };
  if(bio==="deserto"){
    const col=(x,y,w,h)=>{p(x,y,w,h,b);p(x,y,2,h,l);p(x+w-2,y,2,h,e);for(let k=y+3;k<y+h;k+=5)p(x+Math.floor(w/2),k,1,2,"#dfe8a0")};
    col(12,6,8,40);col(4,16,6,14);p(8,26,6,5,b);col(23,12,6,14);p(19,22,6,5,b);
  }else if(bio==="cristal"||bio==="nucleo"){
    const lanca=(cx,topo,base,hw)=>{
      for(let y=topo;y<base;y++){
        const m=Math.min(hw,Math.round((y-topo)*.55)+1);
        p(cx-m,y,m,1,l);p(cx,y,m,1,b);p(cx+m-1,y,1,1,e);
      }
    };
    lanca(9,18,46,6);lanca(23,14,46,6);lanca(16,2,47,8);
  }else{
    p(13,30,6,17,"#5e3b1f");p(13,30,2,17,"#7a4e2a");p(11,45,10,2,"#3a2412");
    disco(9,25,8);disco(23,25,8);disco(16,19,13);disco(16,10,8);
  }
  return contorno(c);
}
function pintaObj(nome,f=0){
  const c=mk(TS,TS),g=c.getContext("2d"),p=(x,y,w,h,cor)=>{g.fillStyle=cor;g.fillRect(x,y,w,h)};
  switch(nome){
    case"bau":
      p(2,5,12,9,"#9a5a26");p(2,5,12,2,"#c47f3c");p(2,9,12,1,"#5e3415");p(2,13,12,1,"#5e3415");
      p(2,5,1,9,"#d8a040");p(13,5,1,9,"#d8a040");p(7,8,2,3,"#f2c94c");p(7,10,2,1,"#a87a1c");
      break;
    case"bauAberto":
      p(2,2,12,5,"#7a4620");p(3,3,10,3,"#2a160a");p(2,7,12,7,"#9a5a26");p(3,7,10,2,"#ffe9a0");p(2,10,12,1,"#5e3415");
      p(2,7,1,7,"#d8a040");p(13,7,1,7,"#d8a040");p(2,2,1,5,"#d8a040");p(13,2,1,5,"#d8a040");
      break;
    case"terminal":
      p(2,1,12,9,"#c8ccd4");p(2,1,12,1,"#eef0f4");p(3,2,10,7,"#0b2a1a");
      p(4,3,5,1,"#46e08a");p(4,5,7,1,"#46e08a");if(f%2)p(4,7,2,1,"#d8ffe6");
      p(6,10,4,2,"#8a8f9c");p(2,12,12,2,"#aeb3bd");p(2,12,12,1,"#dfe2e8");
      break;
    case"cofre":
      p(1,1,14,14,"#5a6276");p(1,1,14,1,"#9aa3b8");p(1,14,14,1,"#30364a");p(3,3,10,10,"#40485c");
      p(6,6,4,4,"#f2c94c");p(7,7,2,2,"#6b4a10");p(12,4,2,2,"#9aa3b8");p(12,10,2,2,"#9aa3b8");
      break;
    case"pilar":
      p(3,1,10,14,"#7f88a8");p(3,1,10,2,"#c0c8e0");p(3,13,10,2,"#4d5470");p(6,5,4,5,f?"#fff3a0":"#3a4060");
      if(f){p(3,3,10,1,"#fff3a0");p(4,4,1,9,"#fff3a0");p(11,4,1,9,"#fff3a0")}
      break;
    case"moeda":
      p(4,3,8,10,"#c98f18");p(3,4,10,8,"#c98f18");p(4,4,8,8,"#f2c94c");p(5,4,2,2,"#fff0a8");p(7,5,2,6,"#c98f18");
      break;
    case"bit":
      p(5,2,6,9,"#28e6d0");p(5,2,6,1,"#b8fff4");p(6,5,1,2,"#0a0612");p(9,5,1,2,"#0a0612");
      if(f%2)p(5,11,6,1,"#28e6d0");
      break;
    case"espada":
      p(7,0,2,11,"#dfe6f2");p(7,0,1,11,"#fff");p(8,1,1,10,"#93a2bc");
      p(4,11,8,2,"#f2c94c");p(4,12,8,1,"#b8862a");p(7,13,2,2,"#7a4e2a");p(7,15,2,1,"#f2c94c");
      break;
    case"gosma":{
      const o=f%2,top=o?5:4;
      for(let y=top;y<15;y++){const m=Math.round((o?7:6)*Math.sqrt(Math.max(0,1-((14.5-y)/(15-top))**2)));p(8-m,y,m*2,1,"#d83a7a")}
      p(4,8+o,3,3,"#fff");p(9,8+o,3,3,"#fff");p(5,9+o,2,2,"#2a0a1e");p(10,9+o,2,2,"#2a0a1e");p(5,top+1,4,1,"#ff9cc4");
      break;
    }
  }
  return contorno(c);
}
const HEROI={
  baixo:["................",".....hhhhhh.....","....hhhhhhhh....","...hhHHHHHHhh...","....ssssssss....","....ssksskss....","....ssksskss....","....ssssssss....",".....ssssss.....","....CCCCCCCC....","...sCCCCCCCCs...","...sCCCbbCCCs...","....CCCCCCCC....","....cc....cc....","....bb....bb....","................"],
  cima:["................",".....hhhhhh.....","....hhhhhhhh....","...hhhhhhhhhh...","....hhhhhhhh....","....hhhhhhhh....","....hhhhhhhh....","....hhhhhhhh....",".....ssssss.....","....CCCCCCCC....","...sCCCCCCCCs...","...sCCCCCCCCs...","....CCCCCCCC....","....cc....cc....","....bb....bb....","................"],
  direita:["................",".....hhhhhh.....","....hhhhhhhh....","....hhHHHHHHh...","....hhhsssss....","....hhsssskss...","....hhsssskss...","....hhssssss....",".....ssssss.....","....CCCCCCC.....","....CCCsCCC.....","....CCCsCCC.....","....CCCCCCC.....",".....cc.cc......",".....bb.bb......","................"],
};
function pintaHeroi(dir,quadro,cor){
  const L=dir==="esquerda"?"direita":dir,lin=[...HEROI[L]];
  if(quadro){
    if(L==="direita"){lin[13]="....cc...cc.....";lin[14]="....bb....bb...."}
    else lin[14]=quadro===1?"....bb..........":"..........bb....";
  }
  const c=mk(TS,TS),g=c.getContext("2d"),p={h:"#5a3a22",H:"#7a5232",s:"#f2c8a0",k:"#1a1420",b:"#4a2f1c",C:cor,c:escurece(cor,.68)};
  lin.forEach((l,y)=>{for(let x=0;x<TS;x++){const q=p[l[x]];if(q){g.fillStyle=q;g.fillRect(x,y,1,1)}}});
  contorno(c);
  if(dir!=="esquerda")return c;
  const e=mk(TS,TS),h=e.getContext("2d");h.translate(TS,0);h.scale(-1,1);h.drawImage(c,0,0);
  return e;
}
function escurece(hex,f){
  const n=i=>Math.round(parseInt(hex.slice(i,i+2),16)*f).toString(16).padStart(2,"0");
  return"#"+n(1)+n(3)+n(5);
}
function pintaChefe(f){
  const c=mk(48,48),g=c.getContext("2d"),p=(x,y,w,h,cor)=>{g.fillStyle=cor;g.fillRect(x,y,w,h)};
  for(let i=0;i<3;i++){
    const y=17+i*8,o=(f+i)%2*2;
    p(3-o,y,12,3,"#22143a");p(33+o,y,12,3,"#22143a");
    p(2-o,y+3,3,6,"#22143a");p(43+o,y+3,3,6,"#22143a");
  }
  for(let y=6;y<44;y++){const m=Math.round(16*Math.sqrt(Math.max(0,1-((y-25)/19)**2)));p(24-m,y,m*2,1,"#3a1f66")}
  for(let y=9;y<41;y++){const m=Math.round(11*Math.sqrt(Math.max(0,1-((y-25)/16)**2)));p(24-m,y,m*2,1,"#5a2f96")}
  p(23,8,2,34,"#22143a");
  const r=rng(77+f);
  for(let i=0;i<9;i++){const y=10+r()*30|0;p(12+r()*18|0,y,6+r()*10|0,1,r()<.5?"#ff2e88":"#28e6d0")}
  p(13,11,8,8,"#fff");p(27,11,8,8,"#fff");p(16,13,4,5,"#ff2e88");p(28,13,4,5,"#ff2e88");
  p(16,4,3,6,"#22143a");p(29,4,3,6,"#22143a");p(13,2,4,3,"#22143a");p(31,2,4,3,"#22143a");
  p(19,40,3,5,"#22143a");p(26,40,3,5,"#22143a");
  return contorno(c);
}
