/* ---------- Desenho: um renderizador por família de eras, todos lendo o mesmo mundo ---------- */
const lerp=(a,b,t)=>a+(b-a)*t;
const fonteCanvas=(px,fam)=>`${px}px ${fam}, ui-monospace, Consolas, monospace`;
const altaDef=era=>era==="16bit"||era==="3d";
const comCor=era=>era==="8bit"||altaDef(era);
const monocromo=era=>era==="ascii"||era==="1bit"||era==="4tons";
const ruido=(x,y)=>{const n=Math.sin(x*127.1+y*311.7)*43758.5453;return n-Math.floor(n)};
const Cam={sy:0,cy:1,sp:1,cp:0,S:T,oy:0};
const BUF=mk(W,H),BUFG=BUF.getContext("2d"),MIN=mk(W,H),MING=MIN.getContext("2d");
function proj(x,y,z=0){
  const X=x-8,Y=y-5,rx=X*Cam.cy-Y*Cam.sy,ry=X*Cam.sy+Y*Cam.cy;
  return[W/2+rx*Cam.S,H/2+Cam.oy+ry*Cam.S*Cam.sp-z*Cam.S*Cam.cp];
}
/* De tile para tela, em qualquer era */
function tela(era,x,y,z=0){return era==="3d"?proj(x,y,z):[x*T,(y-z)*T]}
function mascaraAgua(x,y){
  const terra=(a,b)=>{const t=tileEm(a,b);return t!=="~"&&t!=="="};
  return(terra(x,y-1)?1:0)|(terra(x+1,y)?2:0)|(terra(x,y+1)?4:0)|(terra(x-1,y)?8:0);
}
function texTile(t,bio,x,y,era,q){
  const hi=altaDef(era),v=Math.floor(ruido(x,y)*8);
  let nome={"#":"parede",T:"arvore","~":"agua","%":"glitch",O:"buraco","=":"tabua",D:"porta",d:"aberta"}[t]||"chao",f=v,m=0;
  if(nome==="arvore"&&hi)nome="chao";
  if(nome==="agua"){f=q%4;m=mascaraAgua(x,y);if(era==="3d")m|=16}
  if(nome==="glitch")f=(q+x*3+y*5)%4;
  if(nome==="parede"){f=v&3;m="#D".includes(tileEm(x,y+1))?1:0}
  if(nome==="arvore"||nome==="tabua"||nome==="porta"||nome==="aberta"||nome==="buraco")f=v&1;
  return tex(`${nome}|${bio}|${f}|${hi}|${m}`,era,()=>pintaTile(nome,bio,f,hi,m));
}
const spr=(nome,f,era)=>tex(`o|${nome}|${f}|${altaDef(era)}`,era,()=>{const c=pintaObj(nome,f);return altaDef(era)?iluminar(escala2x(c)):c});
function corDoHeroi(){return CORES[S.cor]||"#4c6fd8"}
function sprHeroi(era){
  const H0=G.heroi,cor=corDoHeroi(),anda=Math.abs(H0.vx-H0.x)+Math.abs(H0.vy-H0.y)>.02,hi=altaDef(era);
  const q=anda?[1,0,2,0][Math.floor(G.tempo*11)%4]:0;
  return tex(`h|${H0.dir}|${q}|${cor}|${hi}`,era,()=>{const c=pintaHeroi(H0.dir,q,cor);return hi?iluminar(escala2x(c)):c},S.cor?cor:null);
}
/* Lista do que fica em pé no mundo: props das casas, criaturas e herói */
function cena(era){
  const L=[],q=Math.floor(G.tempo*4),hi=era==="16bit",bio=G.sala.bio;
  for(let y=0;y<ROWS;y++)for(let x=0;x<COLS;x++){
    const t=G.t[y][x],n={M:"terminal",C:"bau",c:"bauAberto",V:"cofre",N:"pilar"}[t];
    if(hi&&t==="T"){
      const v=(x+y)%2;
      L.push({img:tex(`arv|${bio}|${v}`,era,()=>pintaArvore(bio,v)),x,y:y-.5,w:1,h:1.5});
    }
    if(!n)continue;
    let f=0;
    if(n==="terminal")f=q%2;
    if(n==="pilar")f=G.pilaresAcesos[x]>0?1:0;
    L.push({img:spr(n,f,era),x,y,w:1,h:1});
  }
  for(const m of G.moedasChao)L.push({img:spr("moeda",0,era),x:m.x+.15,y:m.y+.15+Math.sin(G.tempo*3+m.x)*.04,w:.7,h:.7,rot:m.v});
  for(const e of G.inimigos){
    if(e.morta)continue;
    L.push({img:spr("gosma",Math.floor(G.tempo*3+e.fase)%2,era),x:e.vx,y:e.vy,w:1,h:1,pisca:e.dano>0});
  }
  if(G.chefe&&G.chefe.ativo&&G.chefe.hp>0){
    const f=Math.floor(G.tempo*3)%2;
    L.push({img:tex(`chefe|${f}|${altaDef(era)}`,era,()=>{const c=pintaChefe(f);return altaDef(era)?iluminar(escala2x(c)):c}),x:3.1,y:3+Math.sin(G.tempo*2)*.08,w:3.2,h:3.2,pisca:G.chefe.hit>0,chefe:true});
  }
  const h0=G.heroi;
  if(!h0.oculto)L.push({img:sprHeroi(era),x:h0.vx,y:h0.vy,w:h0.esc,h:h0.esc,z:h0.z,heroi:true,pisca:G.imune>0&&Math.floor(G.tempo*12)%2===0});
  if(!h0.oculto&&G.t)L.push({img:spr("bit",q%2,era),x:h0.vx-.62,y:h0.vy-.5+Math.sin(G.tempo*3)*.08,w:.7,h:.7,bit:true});
  return L;
}
function desenhaTTY(g){
  g.fillStyle="#100a03";g.fillRect(0,0,W,H);
  g.font=fonteCanvas(32*K,"VT323");g.textAlign="left";g.textBaseline="top";g.fillStyle="#ffb22e";
  g.shadowColor="#ff9a1f";g.shadowBlur=10*K;
  const lin=G.tty.slice(-11),a=38*K,x0=30*K;
  lin.forEach((l,i)=>g.fillText(l,x0,28*K+i*a));
  if(Math.floor(G.tempo*2)%2===0)g.fillRect(x0+g.measureText(lin[lin.length-1]||"").width+(lin.length?8*K:0),30*K+(lin.length-1)*a,14*K,28*K);
  g.shadowBlur=0;
}
function desenhaAscii(g){
  g.fillStyle="#100a03";g.fillRect(0,0,W,H);
  g.font=fonteCanvas(46*K,"VT323");g.textAlign="center";g.textBaseline="middle";
  const r=Math.floor(G.tempo*8),o=Math.floor(G.tempo*2);
  const mapa={"#":["#","#a66f18"],T:["&","#a66f18"],".":["·","#5c3b0c"],M:["π","#ffe2a0"],C:["$","#ffe2a0"],c:["_","#ffb22e"],D:["+","#ffe2a0"],d:["/","#a66f18"],V:["V","#ffe2a0"],N:["i","#ffb22e"],O:["O","#a66f18"],"=":["=","#ffb22e"]};
  const gl="%&*?!§";
  for(let y=0;y<ROWS;y++)for(let x=0;x<COLS;x++){
    const t=G.t[y][x];
    let c,cor;
    if(t==="%"){c=gl[(r+x*3+y)%gl.length];cor="#ffb22e"}
    else if(t==="~"){c=(x+y+o)%3===0?"-":"~";cor="#5c3b0c"}
    else[c,cor]=mapa[t]||mapa["."];
    if(cor==="#ffe2a0"){g.shadowColor="#ff9a1f";g.shadowBlur=12*K}
    g.fillStyle=cor;g.fillText(c,x*T+T/2,y*T+T/2+2);
    g.shadowBlur=0;
  }
  for(const m of G.moedasChao){g.fillStyle="#ffe2a0";g.fillText(String(m.v),m.x*T+T/2,m.y*T+T/2+2)}
  for(const e of G.inimigos)if(!e.morta){g.fillStyle="#ffb22e";g.fillText("g",e.vx*T+T/2,e.vy*T+T/2)}
  const h0=G.heroi;
  g.shadowColor="#ffd080";g.shadowBlur=16*K;
  g.fillStyle="#fff3d0";g.fillText("@",h0.vx*T+T/2,(h0.vy-h0.z)*T+T/2);
  g.shadowBlur=0;
}
function sombrasDeParede(g){
  const alto=t=>t==="#"||t==="D",L=T/3;
  g.fillStyle="rgba(14,8,40,.3)";
  for(let y=0;y<ROWS;y++)for(let x=0;x<COLS;x++){
    if(alto(G.t[y][x]))continue;
    if(alto(tileEm(x,y-1)))g.fillRect(x*T,y*T,T,L);
    if(alto(tileEm(x-1,y)))g.fillRect(x*T,y*T,L/2,T);
    if(alto(tileEm(x+1,y)))g.fillRect((x+1)*T-L/2,y*T,L/2,T);
  }
}
function brilhoNaAgua(g,era){
  g.save();g.globalCompositeOperation="lighter";
  const cor=BIOMAS[G.sala.bio].agua[2];
  for(let y=0;y<ROWS;y++)for(let x=0;x<COLS;x++){
    if(G.t[y][x]!=="~")continue;
    for(let i=0;i<2;i++){
      const a=Math.sin(G.tempo*2.2+ruido(x+i,y)*40);
      if(a<.82)continue;
      const[sx,sy]=tela(era,x+ruido(x,y+i),y+ruido(y+i,x),era==="3d"?-.2:0),s=SC*1.5;
      g.globalAlpha=(a-.82)*5;g.fillStyle=cor;g.fillRect(sx-s,sy-.5,s*2,1.5);g.fillRect(sx-.5,sy-s,1.5,s*2);
    }
  }
  g.restore();
}
function desenha2D(g,era){
  const bio=G.sala.bio,q=Math.floor(G.tempo*3),hi=era==="16bit";
  for(let y=0;y<ROWS;y++)for(let x=0;x<COLS;x++)g.drawImage(texTile(G.t[y][x],bio,x,y,era,q),x*T,y*T,T,T);
  if(hi){sombrasDeParede(g);brilhoNaAgua(g,era)}
  const L=cena(era).sort((a,b)=>a.y+a.h-(b.y+b.h));
  for(const o of L){
    if(o.pisca&&Math.floor(G.tempo*14)%2===0)continue;
    if(comCor(era)&&!o.bit&&G.t[Math.round(o.y)]){
      g.fillStyle=hi?"rgba(14,8,40,.3)":"rgba(0,0,0,.28)";
      g.beginPath();g.ellipse((o.x+o.w/2)*T,(o.y+o.h-.06)*T,o.w*T*.38,o.w*T*.13,0,0,6.3);g.fill();
    }
    g.drawImage(o.img,o.x*T+(1-o.w)*(o.heroi?T/2:0),(o.y-(o.z||0))*T+(1-o.h)*(o.heroi?T/2:0),o.w*T,o.h*T);
    if(o.rot!==undefined)rotulo(g,String(o.rot),(o.x+o.w/2)*T,(o.y+.42)*T,22,era);
    if(o.chefe){auraChefe(g,era,(o.x+o.w/2)*T,(o.y+o.h/2)*T,o.w*T*.62);G.chefeTela=[o.img,o.x*T,o.y*T,o.w*T,o.h*T]}
  }
  if(hi)climaPlano(g,bio);
}
/* Cada bioma tem o seu tempo: nuvens, raios de sol, aurora ou calor */
function climaPlano(g,bio){
  if(G.leve)return;
  g.save();
  if(bio==="campo"){
    g.globalCompositeOperation="multiply";
    for(let i=0;i<2;i++){
      const x=((G.tempo*(18+i*9)+i*560)%(W+620))-310,y=160+i*300,r=g.createRadialGradient(x,y,26,x,y,310);
      r.addColorStop(0,"rgba(120,120,190,.5)");r.addColorStop(1,"rgba(255,255,255,0)");
      g.fillStyle=r;g.fillRect(0,0,W,H);
    }
  }else if(bio==="mata"){
    g.globalCompositeOperation="lighter";
    for(let i=0;i<4;i++){
      const x=((G.tempo*(10+i*3)+i*290)%(W+500))-250,l=70+i*24;
      g.globalAlpha=.055+.03*Math.sin(G.tempo*.8+i);
      g.fillStyle="#fff2b0";g.beginPath();g.moveTo(x,0);g.lineTo(x+l,0);g.lineTo(x+l-210,H);g.lineTo(x-210,H);g.closePath();g.fill();
    }
  }else if(bio==="cristal"){
    g.globalCompositeOperation="lighter";
    for(let i=0;i<3;i++){
      const o=Math.sin(G.tempo*.5+i*2)*W*.3+W*.5,r=g.createLinearGradient(o-260,0,o+260,0);
      r.addColorStop(0,"rgba(90,255,210,0)");r.addColorStop(.5,i%2?"rgba(120,120,255,.1)":"rgba(90,255,210,.1)");r.addColorStop(1,"rgba(90,255,210,0)");
      g.fillStyle=r;g.fillRect(0,0,W,H*.7);
    }
  }
  g.restore();
}
function ondaDeCalor(g){
  if(G.leve||REDUZ)return;
  const c=g.canvas,a=K*1.7;
  for(let y=0;y<H;y+=8)g.drawImage(c,0,y,W,8,Math.sin(y*.035+G.tempo*3)*a,y,W,8);
}
function falhaDeTela(g){
  const c=g.canvas;
  for(let i=0;i<7;i++){const y=Math.random()*H,h=4+Math.random()*30;g.drawImage(c,0,y,W,h,(Math.random()-.5)*46,y,W,h)}
}
/* Luz: escurece o ambiente de cada bioma e depois soma as fontes de luz por cima */
function desenhaLuzes(g,era){
  const bio=G.sala.bio;
  g.save();
  g.globalCompositeOperation="multiply";g.fillStyle=BIOMAS[bio].ambiente;g.fillRect(0,0,W,H);
  g.globalCompositeOperation="lighter";
  const pulso=.92+.08*Math.sin(G.tempo*4);
  const luz=(x,y,cor,raio,a=1)=>{
    const[sx,sy]=tela(era,x,y,.3),r=raio*T*pulso;
    g.globalAlpha=a;g.drawImage(texLuz(cor),sx-r,sy-r,r*2,r*2);
  };
  const cristais=bio==="cristal"||bio==="nucleo",copa=BIOMAS[bio].copa[2];
  for(let y=0;y<ROWS;y++)for(let x=0;x<COLS;x++){
    const t=G.t[y][x];
    if(t==="M")luz(x+.5,y+.4,"#46e08a",1.7,.5);
    else if(t==="%")luz(x+.5,y+.5,(x+y)%2?"#ff2e88":"#28e6d0",.95,.24);
    else if(t==="C")luz(x+.5,y+.5,"#ffd86a",1.2,.42);
    else if(t==="D")luz(x+.5,y+.5,"#ffc23c",.8,.3);
    else if(t==="~"&&bio==="deserto"&&(x+y)%3===0)luz(x+.5,y+.5,"#ff7a30",1.3,.2);
    else if(t==="T"&&cristais)luz(x+.5,y+.3,copa,1.5,.34);
    else if(t==="N"&&G.pilaresAcesos[x]>0)luz(x+.5,y+.5,"#fff3a0",1.6,.8);
  }
  for(const m of G.moedasChao)luz(m.x+.5,m.y+.5,"#ffd86a",.7,.3);
  const h0=G.heroi;
  luz(h0.vx+.5,h0.vy+.5,"#ffe8c0",2.2,bio==="nucleo"?.5:.22);
  if(G.chefe&&G.chefe.ativo&&G.chefe.hp>0)luz(4.7,4.6,{fogo:"#ff6a2c",agua:"#3fa0ff",planta:"#46d060"}[G.chefe.esc],3.6,.55);
  for(const c of G.cortes)luz(c.x+.5,c.y+.5,"#fff6c8",1.2,.6);
  for(const q of G.tiros){const a=Math.min(1,q.t/q.dur);luz(lerp(q.x,q.tx,a)+.5,lerp(q.y,q.ty,a)+.5,q.cor,1.7,.8)}
  for(const a of G.amb)if(a.k==="vaga")luz(a.x,a.y,"#d8ff7a",.55,.5*Math.max(0,Math.sin(G.tempo*3+a.f)));
  g.restore();
  /* O chefe tem luz própria: redesenhado por cima para não virar silhueta no escuro do núcleo */
  if(G.chefeTela){
    g.globalAlpha=.8;g.drawImage(...G.chefeTela);g.globalAlpha=1;
    G.chefeTela=null;
  }
}
/* Vida no cenário, a partir dos 8 bits */
function novoAmb(bio,inicio){
  const R=Math.random,x=R()*COLS,y=R()*ROWS,f=R()*6;
  switch(bio){
    case"campo":return R()<.3?{k:"asa",x,y,dx:(R()<.5?-1:1)*.7,dy:.1,c:["#ffd23c","#ff8ab8","#ffffff"][R()*3|0],v:9,f,s:1}:{k:"pt",x,y,dx:.16+R()*.2,dy:-.07,c:"#fff7c0",v:3+R()*5,f,s:.7};
    case"mata":return R()<.6?{k:"vaga",x,y,dx:0,dy:0,c:"#d8ff7a",v:4+R()*5,f,s:.8}:{k:"pt",x,y:inicio?y:-.2,dx:.2,dy:.45,c:"#7ab85a",v:12,f,s:1.2};
    case"deserto":return{k:"pt",x,y,dx:.1,dy:-.5-R()*.5,c:R()<.5?"#ffb040":"#ff6a2c",v:1.5+R()*3,f,s:.8};
    case"cristal":return{k:"pt",x,y:inicio?y:-.2,dx:.08,dy:.35+R()*.3,c:"#e8f4ff",v:12,f,s:.8};
    default:return{k:"pt",x,y,dx:0,dy:-.4-R()*.4,c:R()<.5?"#ff2e88":"#28e6d0",v:1.5+R()*3,f,s:1};
  }
}
function atualizaAmbiente(dt){
  if(G.auto||REDUZ||!G.sala||G.eraVista<4)return;
  const alvo=G.leve?10:G.eraVista>=5?30:14,bio=G.sala.bio;
  while(G.amb.length<alvo)G.amb.push(novoAmb(bio,true));
  G.amb=G.amb.map(a=>{
    a.v-=dt;a.x+=a.dx*dt;a.y+=a.dy*dt;
    if(a.k==="vaga"){a.x+=Math.sin(G.tempo+a.f)*dt*.5;a.y+=Math.cos(G.tempo*1.3+a.f)*dt*.5}
    if(a.k==="asa")a.y+=Math.sin(G.tempo*5+a.f)*dt*.5;
    return a.v<=0||a.x<-1||a.x>COLS+1||a.y<-1||a.y>ROWS+1?novoAmb(bio,false):a;
  });
}
function desenhaAmbiente(g,era){
  if(!comCor(era))return;
  for(const a of G.amb){
    const[x,y]=tela(era,a.x,a.y,.8),s=a.s*SC*(era==="8bit"?1:.9);
    g.fillStyle=a.c;
    g.globalAlpha=altaDef(era)?Math.min(1,a.v):1;
    if(a.k==="asa"){
      const w=Math.abs(Math.sin(G.tempo*11+a.f))*s*1.6+1;
      g.fillRect(x-w,y-s/2,w,s);g.fillRect(x+1,y-s/2,w,s);
      g.fillStyle="#1a1420";g.fillRect(x,y-s/2,1.5,s);
    }else if(a.k==="vaga"){
      g.globalAlpha=Math.max(0,Math.sin(G.tempo*3+a.f));g.fillRect(x-s/2,y-s/2,s,s);
    }else g.fillRect(x-s/2,y-s/2,s,s);
  }
  g.globalAlpha=1;
}
function auraChefe(g,era,x,y,r){
  const c={fogo:"#ff6a2c",agua:"#3fa0ff",planta:"#46d060"}[G.chefe.esc],mono=monocromo(era);
  g.strokeStyle=mono?"#e8e8e0":c;
  g.lineWidth=SC*2;g.setLineDash([12*K,10*K]);g.lineDashOffset=-G.tempo*30;
  g.beginPath();g.ellipse(x,y,r,r*(era==="3d"?1.05:.95),0,0,6.3);g.stroke();g.setLineDash([]);
  rotulo(g,G.chefe.esc.toUpperCase(),x,y-r-16*K,24,era,mono?"#fff":c);
}
function rotulo(g,txt,x,y,px,era,cor="#fff"){
  const f=era==="3d"?"IBM Plex Sans":era==="16bit"?"Pixelify Sans":"VT323";
  g.font=fonteCanvas(px*K,`"${f}"`);g.textAlign="center";g.textBaseline="middle";
  g.lineWidth=5*K;g.strokeStyle="rgba(10,6,20,.9)";g.strokeText(txt,x,y);
  g.fillStyle=cor;g.fillText(txt,x,y);
}
const altura=t=>t==="#"?1:t==="D"?1:(t==="~"||t==="O")?-.22:0;
const LADOS=[[0,1],[0,-1],[1,0],[-1,0]];
const CEUS={campo:["#2b5a9e","#9cc8e6"],mata:["#123a40","#4a8a72"],deserto:["#4a2450","#ea9450"],cristal:["#0e1238","#3f46a8"],nucleo:["#0a0618","#3f1c5e"]};
const FORMAS={
  campo:[[.4,.6,.4,.6,0,.7,1],[.06,.94,.06,.94,.6,1.3],[.22,.78,.22,.78,1.3,1.72]],
  mata:[[.4,.6,.4,.6,0,.7,1],[.06,.94,.06,.94,.6,1.3],[.22,.78,.22,.78,1.3,1.72]],
  deserto:[[.36,.64,.36,.64,0,1.55],[.06,.36,.42,.58,.65,.85],[.06,.24,.42,.58,.85,1.2],[.64,.94,.42,.58,.85,1.05],[.76,.94,.42,.58,1.05,1.4]],
  cristal:[[.28,.72,.28,.72,0,1],[.38,.62,.38,.62,1,1.75]],
  nucleo:[[.28,.72,.28,.72,0,1],[.38,.62,.38,.62,1,1.75]],
};
function face(g,img,a,b,c,sombra){
  const N=img.width,E=N*1.025;
  g.setTransform((b[0]-a[0])/N,(b[1]-a[1])/N,(c[0]-a[0])/N,(c[1]-a[1])/N,a[0],a[1]);
  g.drawImage(img,0,0,E,E);
  if(sombra){g.fillStyle=`rgba(12,8,36,${sombra})`;g.fillRect(0,0,E,E)}
  g.setTransform(1,0,0,1,0,0);
}
function cantosDoLado(dx,dy,x0,x1,y0,y1){
  if(dy===1)return[[x0,y1],[x1,y1]];
  if(dy===-1)return[[x1,y0],[x0,y0]];
  if(dx===1)return[[x1,y1],[x1,y0]];
  return[[x0,y0],[x0,y1]];
}
function caixa(g,x0,x1,y0,y1,z0,z1,img){
  for(const[dx,dy]of LADOS){
    if(dx*Cam.sy+dy*Cam.cy<=0)continue;
    const[A,B]=cantosDoLado(dx,dy,x0,x1,y0,y1);
    face(g,img,proj(A[0],A[1],z1),proj(B[0],B[1],z1),proj(A[0],A[1],z0),dy?.16:.34);
  }
  face(g,img,proj(x0,y0,z1),proj(x1,y0,z1),proj(x0,y1,z1),0);
}
function faixaDeSombra(g,a,b,c,d){
  g.beginPath();g.moveTo(a[0],a[1]);g.lineTo(b[0],b[1]);g.lineTo(c[0],c[1]);g.lineTo(d[0],d[1]);g.closePath();g.fill();
}
function fundo3D(g,bio,e){
  const[c0,c1]=CEUS[bio],ceu=g.createLinearGradient(0,0,0,H);
  ceu.addColorStop(0,c0);ceu.addColorStop(1,c1);
  g.fillStyle=ceu;g.fillRect(0,0,W,H);
  g.fillStyle="#fff";
  for(let i=0;i<46;i++){
    g.globalAlpha=(.2+.6*Math.abs(Math.sin(G.tempo*.8+i)))*e*(bio==="campo"?.3:1);
    g.fillRect(ruido(i,1)*W,ruido(i,2)*H*.7,2.2,2.2);
  }
  const luz=texLuz("#ffffff");
  for(let i=0;i<5;i++){
    const x=((G.tempo*(5+i*2)+i*260)%(W+500))-250,y=H*(.14+i*.17),w=300+i*40;
    g.globalAlpha=.1*e;g.drawImage(luz,x-w/2,y-34,w,68);
  }
  g.globalAlpha=e*.55;g.fillStyle=c0;
  for(let i=0;i<3;i++){
    const x=W*(.12+i*.38)+Math.sin(G.tempo*.15+i)*14,y=H*(.74+(i%2)*.14),w=80+i*30;
    g.beginPath();g.moveTo(x-w,y);g.lineTo(x+w,y);g.lineTo(x+w*.3,y+w*.42);g.lineTo(x-w*.2,y+w*.6);g.closePath();g.fill();
  }
  g.globalAlpha=1;
}
function desenha3D(g){
  const p=G.p3,e=p*p*(3-2*p),pitch=lerp(Math.PI/2,.74,e),balanco=REDUZ?0:Math.sin(G.tempo*.3)*.025;
  const yaw=lerp(0,G.yaw+balanco,e);
  Cam.sy=Math.sin(yaw);Cam.cy=Math.cos(yaw);Cam.sp=Math.sin(pitch);Cam.cp=Math.cos(pitch);Cam.S=lerp(T,T*.76,e);Cam.oy=lerp(0,4*K,e);
  const bio=G.sala.bio,q=Math.floor(G.tempo*3);
  fundo3D(g,bio,e);
  const prof=(x,y)=>(x-8)*Cam.sy+(y-5)*Cam.cy,itens=[];
  const altEm=(x,y)=>{
    if(x<0||y<0||x>=COLS||y>=ROWS)return-(1.1+ruido(x+40,y+40)*1.5);
    const t=G.t[y][x];
    if(t==="#"&&(x===0||y===0||x===COLS-1||y===ROWS-1)&&(x+y)%2)return 1.18;
    return altura(t);
  };
  for(let y=0;y<ROWS;y++)for(let x=0;x<COLS;x++)itens.push({d:prof(x+.5,y+.5),x,y});
  for(const o of cena("3d"))itens.push({d:prof(o.x+o.w/2,o.y+o.h*.6)+.02,o});
  itens.sort((a,b)=>a.d-b.d);
  const lado=tex(`lado|${bio}`,"3d",()=>pintaTile("lado",bio,0,true));
  const copa=tex(`copa|${bio}`,"3d",()=>pintaTile("copa",bio,0,true));
  const pedra=(x,y,m)=>{const f=Math.floor(ruido(x,y)*4);return tex(`parede|${bio}|${f}|true|${m}`,"3d",()=>pintaTile("parede",bio,f,true,m))};
  g.fillStyle="rgba(12,8,36,.3)";
  for(const it of itens){
    if(it.o){billboard(g,it.o,e);continue}
    const{x,y}=it,t=G.t[y][x],h=altEm(x,y)*e,alto=t==="#"||t==="D";
    const topo=t==="#"?pedra(x,y,1):texTile(t==="T"?".":t,bio,x,y,"3d",q),parede=t==="#"?pedra(x,y,0):t==="D"?topo:lado;
    for(const[dx,dy]of LADOS){
      if(dx*Cam.sy+dy*Cam.cy<=0)continue;
      const hn=altEm(x+dx,y+dy)*e;
      if(hn>=h)continue;
      const[A,B]=cantosDoLado(dx,dy,x,x+1,y,y+1),som=dy?.22:.4,z1=Math.max(hn,0);
      if(h>z1)face(g,parede,proj(A[0],A[1],h),proj(B[0],B[1],h),proj(A[0],A[1],z1),som);
      if(hn<0){
        const z0=Math.min(h,0),z2=Math.max(hn,-.7*e);
        if(z0>z2)face(g,lado,proj(A[0],A[1],z0),proj(B[0],B[1],z0),proj(A[0],A[1],z2),som+.1);
        if(hn<z2)face(g,lado,proj(A[0],A[1],z2),proj(B[0],B[1],z2),proj(A[0],A[1],hn),som+.34);
      }
    }
    face(g,topo,proj(x,y,h),proj(x+1,y,h),proj(x,y+1,h),t==="~"?.05:0);
    if(!alto&&e>.5&&t!=="~"){
      const L=.3,sobe=(a,b)=>altEm(a,b)>.5;
      g.fillStyle="rgba(12,8,36,.3)";
      if(sobe(x,y-1))faixaDeSombra(g,proj(x,y),proj(x+1,y),proj(x+1,y+L),proj(x,y+L));
      if(sobe(x-1,y))faixaDeSombra(g,proj(x,y),proj(x+L,y),proj(x+L,y+1),proj(x,y+1));
      if(sobe(x+1,y))faixaDeSombra(g,proj(x+1,y),proj(x+1-L,y),proj(x+1-L,y+1),proj(x+1,y+1));
    }
    if(t==="T"){
      for(const[a0,a1,b0,b1,z0,z1,madeira]of FORMAS[bio])caixa(g,x+a0,x+a1,y+b0,y+b1,z0*e,z1*e,madeira?lado:copa);
    }
  }
  brilhoNaAgua(g,"3d");
}
function billboard(g,o,e){
  if(o.pisca&&Math.floor(G.tempo*14)%2===0)return;
  const[x,y]=proj(o.x+o.w/2,o.y+lerp(o.h,o.h*.62,e),o.z||0),s=Cam.S*lerp(1,1.12,e),w=o.w*s,h=o.h*s;
  if(!o.bit){
    const[sx,sy]=proj(o.x+o.w/2,o.y+lerp(o.h,o.h*.62,e),0);
    g.fillStyle="rgba(10,6,30,.35)";
    g.beginPath();g.ellipse(sx,sy-2,w*.36,w*.36*Cam.sp,0,0,6.3);g.fill();
  }
  g.drawImage(o.img,x-w/2,y-h,w,h);
  if(o.rot!==undefined)rotulo(g,String(o.rot),x,y-h*.55,22,"3d");
  if(o.chefe){auraChefe(g,"3d",x,y-h*.5,w*.6);G.chefeTela=[o.img,x-w/2,y-h,w,h]}
}
function brilhoFinal(g){
  if(G.leve)return;
  const w=W>>2,h=H>>2;
  MING.imageSmoothingEnabled=true;MING.globalCompositeOperation="copy";
  MING.drawImage(g.canvas,0,0,w,h);
  MING.globalCompositeOperation="source-over";
  g.save();g.globalCompositeOperation="screen";g.globalAlpha=.14;g.imageSmoothingEnabled=true;
  g.drawImage(MIN,0,0,w,h,0,0,W,H);
  g.restore();
}
function desenhaEfeitos(g,era){
  const mono=monocromo(era),h0=G.heroi;
  for(const r of G.raios){
    const a=r.t/r.dur,[x,y]=tela(era,r.x+.5,r.y+.3,.3),al=Math.sin(a*Math.PI),L=T*(1.1+a*2.4);
    g.save();g.translate(x,y);g.rotate(G.tempo*1.4);
    if(!mono)g.globalCompositeOperation="lighter";
    g.globalAlpha=al*.55;g.fillStyle=mono?"#fff":"#ffe9a0";
    for(let i=0;i<8;i++){g.rotate(Math.PI/4);g.beginPath();g.moveTo(0,0);g.lineTo(L,-T*.16);g.lineTo(L,T*.16);g.closePath();g.fill()}
    g.restore();
  }
  for(const c of G.cortes){
    const a=c.t/.16,ang={direita:0,baixo:1.57,esquerda:3.14,cima:-1.57}[c.dir],[sx,sy]=tela(era,h0.vx+.5,h0.vy+.5,era==="3d"?.4:0),giro=ang-1.15+a*2.3;
    g.strokeStyle=mono?"#fff":"#fff6c8";g.globalAlpha=1-a*.6;
    g.lineWidth=SC*3*(1-a)+2;
    g.beginPath();g.arc(sx,sy,T*1.1,ang-1.15,giro);g.stroke();
    g.globalAlpha=1;
    if(era!=="ascii"){
      g.save();g.translate(sx,sy);g.rotate(giro+Math.PI/2);
      g.drawImage(spr("espada",0,era),-T*.42,-T*1.12,T*.84,T*.84);
      g.restore();
    }
  }
  for(const q of G.tiros){
    const a=Math.min(1,q.t/q.dur),[x,y]=tela(era,lerp(q.x,q.tx,a)+.5,lerp(q.y,q.ty,a)+.5,.4);
    g.fillStyle=mono?"#fff":q.cor;
    const r=(10+Math.sin(G.tempo*30)*2)*K;
    g.fillRect(x-r,y-r,r*2,r*2);
    g.fillStyle="rgba(255,255,255,.75)";g.fillRect(x-r/2,y-r/2,r,r);
  }
  for(const q of G.parts){
    const[x,y]=tela(era,q.x,q.y,q.z||0),s=q.s*(altaDef(era)?q.v/q.vida+.4:1);
    g.fillStyle=mono?(era==="ascii"?"#ffb22e":era==="4tons"?"#0f380f":"#fff"):q.c;
    g.fillRect(x-s/2,y-s/2,s,s);
  }
  for(const q of G.textos){
    const a=q.t/q.dur,[x,y]=tela(era,q.x+.5,q.y+.2-a*.8,.6);
    g.globalAlpha=1-a*a;rotulo(g,q.txt,x,y,26,era,mono?"#fff":q.c);g.globalAlpha=1;
  }
  if(S.nome&&!h0.oculto&&era!=="ascii"&&era!=="tty"){
    const[x,y]=tela(era,h0.vx+.5,h0.vy+(era==="3d"?.4:0),era==="3d"?1.1:h0.z);
    rotulo(g,S.nome,x,y-(era==="3d"?10:8)*K,19,era,era==="1bit"||era==="4tons"?"#fff":corClara());
  }
}
function corClara(){return S.cor&&S.cor!=="azul"&&S.cor!=="roxo"?corDoHeroi():"#fff"}
function desenhaHUD(g,era){
  if(!S.up.hud||era==="tty")return;
  const lcd=era==="4tons",uni=monocromo(era),hi=altaDef(era);
  g.save();g.scale(K,K);
  const larg=G.vidaMax*30+132,VW=W/K;
  g.fillStyle=lcd?"rgba(155,188,15,.9)":"rgba(10,6,24,.72)";
  if(hi&&g.roundRect){g.beginPath();g.roundRect(8,8,larg,36,10);g.fill();g.strokeStyle="rgba(255,255,255,.22)";g.lineWidth=1.5;g.stroke()}
  else g.fillRect(8,8,larg,36);
  for(let i=0;i<G.vidaMax;i++){
    const x=16+i*30,y=15,ch=i<G.vida;
    g.fillStyle=uni?(lcd?(ch?"#0f380f":"#8bac0f"):(ch?(era==="ascii"?"#ffb22e":"#fff"):"#444")):(ch?"#ff3f5e":"#553048");
    g.fillRect(x+3,y,6,3);g.fillRect(x+13,y,6,3);g.fillRect(x,y+3,22,9);g.fillRect(x+3,y+12,16,4);g.fillRect(x+7,y+16,8,3);
    if(hi&&ch){g.fillStyle="#ffc0cc";g.fillRect(x+3,y+3,4,3)}
  }
  const x=G.vidaMax*30+22;
  g.fillStyle=uni?(lcd?"#0f380f":era==="ascii"?"#ffb22e":"#fff"):"#f2c94c";
  g.fillRect(x,15,20,20);g.fillStyle=lcd?"#8bac0f":"rgba(10,6,24,.72)";g.fillRect(x+8,19,4,12);
  g.font=fonteCanvas(28,"VT323");g.textAlign="left";g.textBaseline="middle";
  g.fillStyle=lcd?"#0f380f":"#fff";g.fillText(String(S.moedas),x+28,26);
  if(G.chefe&&G.chefe.ativo&&era!=="ascii"){
    const w=280,xx=VW-w-16;
    g.fillStyle="rgba(10,6,24,.8)";g.fillRect(xx-4,10,w+8,24);
    g.fillStyle="#3a1a4a";g.fillRect(xx,14,w,16);
    g.fillStyle=lcd?"#0f380f":uni?"#fff":"#ff2e88";g.fillRect(xx,14,w*Math.max(0,G.chefe.hp)/G.chefe.max,16);
    if(hi){g.fillStyle="rgba(255,255,255,.28)";g.fillRect(xx,14,w*Math.max(0,G.chefe.hp)/G.chefe.max,5)}
  }
  g.restore();
}
function mundo(g,era){
  if(era==="tty"||!G.t)return desenhaTTY(g);
  if(era==="ascii")desenhaAscii(g);
  else if(era==="3d")desenha3D(g);
  else desenha2D(g,era);
  if(altaDef(era))desenhaLuzes(g,era);
  desenhaAmbiente(g,era);
  desenhaEfeitos(g,era);
  if(era==="16bit"&&G.sala.bio==="deserto")ondaDeCalor(g);
  if(G.chefe&&G.chefe.hit>0&&!REDUZ&&era!=="ascii")falhaDeTela(g);
  if(era==="3d")brilhoFinal(g);
  desenhaHUD(g,era);
}
function noBuffer(era){
  BUFG.setTransform(1,0,0,1,0,0);BUFG.imageSmoothingEnabled=false;
  mundo(BUFG,era);
  return BUF;
}
/* Cada salto de era tem a sua passagem, porque cada salto era uma tecnologia diferente */
function transicao(g,w){
  const e=Math.min(1,w.t/w.dur),a=ERAS[w.de].id,b=ERAS[w.para].id;
  if(w.tipo==="liga"){
    g.fillStyle="#000";g.fillRect(0,0,W,H);
    if(e<.3){const s=1-e/.3;g.drawImage(noBuffer(a),0,H/2*(1-s),W,Math.max(2,H*s))}
    else if(e<.5){const s=(e-.3)/.2;g.fillStyle="#ffe2a0";g.fillRect(W/2*s,H/2-2,W*(1-s),4)}
    else{const s=(e-.5)/.5,o=s*s*(3-2*s);g.drawImage(noBuffer(b),0,H/2*(1-o),W,Math.max(2,H*o))}
  }else if(w.tipo==="blocos"){
    mundo(g,a);
    g.save();g.beginPath();
    for(let y=0;y<ROWS*2;y++)for(let x=0;x<COLS*2;x++)if(ruido(x+.5,y+.5)<e*1.08)g.rect(x*T/2,y*T/2,T/2,T/2);
    g.clip();mundo(g,b);g.restore();
  }else if(w.tipo==="circulo"){
    const[x,y]=tela(a,G.heroi.vx+.5,G.heroi.vy+.5),r=e*e*W*1.3;
    mundo(g,a);
    g.save();g.beginPath();g.arc(x,y,r,0,6.3);g.clip();mundo(g,b);g.restore();
    g.strokeStyle="#fff";g.lineWidth=5*K;g.beginPath();g.arc(x,y,r,0,6.3);g.stroke();
  }else if(w.tipo==="mosaico"){
    const t=1-Math.abs(e*2-1),n=1+Math.floor(t*t*30),w2=Math.max(2,Math.ceil(W/n)),h2=Math.max(2,Math.ceil(H/n));
    noBuffer(e<.5?a:b);
    MING.imageSmoothingEnabled=false;MING.globalCompositeOperation="copy";MING.drawImage(BUF,0,0,w2,h2);MING.globalCompositeOperation="source-over";
    g.imageSmoothingEnabled=false;g.drawImage(MIN,0,0,w2,h2,0,0,W,H);
  }else{
    const y=e*H;
    mundo(g,a);
    g.save();g.beginPath();g.rect(0,0,W,y);g.clip();mundo(g,b);g.restore();
    g.fillStyle="#fff";g.fillRect(0,y-3,W,6);
  }
}
function desenha(){
  const g=G.g;
  g.setTransform(1,0,0,1,0,0);g.imageSmoothingEnabled=false;
  const era=ERAS[G.eraVista].id;
  if(G.tremor>0&&!REDUZ)g.translate((Math.random()-.5)*G.tremor*K,(Math.random()-.5)*G.tremor*K);
  if(G.wipe)return transicao(g,G.wipe);
  if(G.slide){
    const s=G.slide,e=s.t/s.dur,o=e*e*(3-2*e),dx=s.dx*W*(1-o),dy=s.dy*H*(1-o);
    g.drawImage(noBuffer(era),dx,dy);
    g.drawImage(s.foto,dx-s.dx*W,dy-s.dy*H);
    return;
  }
  mundo(g,era);
}
