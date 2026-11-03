/* ---------- Pixel art: tudo nasce de uma fonte só e cada era reinterpreta os pixels ---------- */
const TS=16,SC=3,T=TS*SC,COLS=16,ROWS=10,W=COLS*T,H=ROWS*T;
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
  campo:{chao:["#5fae45","#4f9a3b","#78c457"],parede:["#8a8f9c","#62667a","#b1b6c2"],copa:["#2f8a45","#1f6335","#4fb25c"],agua:["#2f73d8","#1f52ab","#5aa2f2"]},
  mata:{chao:["#3e8f5a","#327a4c","#56a86e"],parede:["#6b5a48","#4a3d31","#8d7861"],copa:["#1f6d54","#134d3c","#2f9470"],agua:["#1f7f9c","#145e75","#3fb0c9"]},
  deserto:{chao:["#e3bd72","#cfa65b","#f1d28e"],parede:["#b8763f","#8f5730","#d8975c"],copa:["#7f9c3a","#5f7a28","#a3c054"],agua:["#d6482a","#a8301c","#f5923a"]},
  cristal:{chao:["#9fb4e0","#8299cb","#c2d2f2"],parede:["#5e6fc0","#434f96","#8ea0e8"],copa:["#6ae0e0","#3fb0c0","#b8fbf2"],agua:["#2a2f7a","#1c1f58","#4a54b8"]},
  nucleo:{chao:["#3b2a56","#2e2046","#4f3a70"],parede:["#6a2f6f","#4a2050","#9a4a96"],copa:["#d83a7a","#a0285c","#ff76a8"],agua:["#0f0a1e","#06040e","#2a1c4a"]},
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
function pintaTile(tipo,bio,v,hi){
  const c=mk(TS,TS),g=c.getContext("2d"),B=BIOMAS[bio],r=rng(hash(tipo+bio+v+hi));
  const p=(x,y,cor,w=1,h=1)=>{g.fillStyle=cor;g.fillRect(x,y,w,h)};
  const chao=()=>{
    p(0,0,B.chao[0],TS,TS);
    if(hi)for(let y=0;y<TS;y++)for(let x=0;x<TS;x++){const n=r();if(n<.2)p(x,y,B.chao[1]);else if(n>.84)p(x,y,B.chao[2])}
    else{for(let i=0;i<4;i++)p(r()*14|0,r()*15|0,B.chao[1],2,1);for(let i=0;i<3;i++)p(r()*15|0,r()*15|0,B.chao[2])}
  };
  switch(tipo){
    case"chao":chao();break;
    case"lado":
      p(0,0,B.parede[1],TS,TS);
      for(let i=0;i<14;i++)p(r()*15|0,r()*15|0,B.parede[0],2,1);
      p(0,0,B.chao[1],TS,2);
      break;
    case"parede":{
      const[b,e,c2]=B.parede;
      p(0,0,e,TS,TS);
      for(let f=0;f<4;f++){
        const o=f%2?-4:0;
        for(let i=0;i<3;i++){
          const x=o+i*8+(v&1);
          p(x,f*4,hi&&r()<.4?c2:b,7,3);
          p(x,f*4,c2,7,1);
          if(hi)p(x+r()*5|0,f*4+2,e,2,1);
        }
      }
      break;
    }
    case"arvore":{
      chao();
      const[b,e,c2]=B.copa;
      p(6,11,"#5e3b1f",4,5);p(6,11,"#7a4e2a",1,5);
      for(let y=1;y<13;y++){const m=Math.round(6.4*Math.sqrt(1-((y-6.5)/6.5)**2));p(8-m,y,b,m*2,1)}
      for(let i=0;i<(hi?22:9);i++){const x=3+r()*10|0,y=3+r()*8|0;p(x,y,r()<.5?e:c2,hi?1:2,1)}
      p(5,3,c2,3,1);
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
      p(0,0,b,TS,TS);
      for(let f=0;f<4;f++){
        const y=f*4+1,o=(v*2+f*5)%16;
        p(o,y,c2,hi?5:4,1);p((o+9)%16,y+2,e,4,1);
        if(hi){p((o+4)%16,y+1,e,3,1);p((o+12)%16,y,c2,2,1)}
      }
      break;
    }
    case"glitch":{
      const cs=["#0a0612","#ff2e88","#28e6d0","#0a0612","#f4f0ff","#3a1a6a"];
      for(let y=0;y<TS;y+=2){
        const lin=r()<.3;let q=cs[r()*cs.length|0];
        for(let x=0;x<TS;x+=2){if(!lin)q=cs[r()*cs.length|0];p(x,y,q,2,2)}
      }
      break;
    }
    case"buraco":
      chao();
      for(let y=2;y<14;y++){const m=Math.round(6.5*Math.sqrt(1-((y-7.5)/6)**2));p(8-m,y,"#0d0814",m*2,1)}
      p(4,3,B.chao[1],8,1);p(3,4,"#2a2030",10,1);
      break;
    case"tabua":
      p(0,0,B.agua[0],TS,TS);
      for(let i=0;i<4;i++){p(0,i*4,"#a56a34",TS,3);p(0,i*4,"#c98a4a",TS,1);p(0,i*4+3,"#5e3b1f",TS,1);p(3+i*3,i*4+1,"#7a4e2a",2,1)}
      break;
    case"porta":{
      const[b,e,c2]=B.parede;
      p(0,0,e,TS,TS);p(0,0,c2,TS,2);p(0,14,b,TS,2);
      for(let x=1;x<TS;x+=4)p(x,2,"#2b2b38",2,12);
      p(0,6,"#2b2b38",TS,2);p(6,5,"#f2c94c",4,4);p(7,6,"#6b4a10",2,2);
      break;
    }
    case"aberta":{
      chao();
      p(0,0,B.parede[1],2,TS);p(14,0,B.parede[1],2,TS);p(0,0,B.parede[2],1,TS);p(14,0,B.parede[2],1,TS);
      break;
    }
  }
  return c;
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
