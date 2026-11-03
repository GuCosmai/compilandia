/* ---------- Desenho: um renderizador por família de eras, todos lendo o mesmo mundo ---------- */
const lerp=(a,b,t)=>a+(b-a)*t;
const fonteCanvas=(px,fam)=>`${px}px ${fam}, ui-monospace, Consolas, monospace`;
const altaDef=era=>era==="16bit"||era==="3d";
const Cam={sy:0,cy:1,sp:1,cp:0,S:T,oy:0};
function proj(x,y,z=0){
  const X=x-8,Y=y-5,rx=X*Cam.cy-Y*Cam.sy,ry=X*Cam.sy+Y*Cam.cy;
  return[W/2+rx*Cam.S,H/2+Cam.oy+ry*Cam.S*Cam.sp-z*Cam.S*Cam.cp];
}
/* De tile para tela, em qualquer era */
function tela(era,x,y,z=0){return era==="3d"?proj(x,y,z):[x*T,(y-z)*T]}
function texTile(t,bio,x,y,era,q){
  const hi=altaDef(era),v=(x*7+y*13)%4;
  const nome={"#":"parede",T:"arvore","~":"agua","%":"glitch",O:"buraco","=":"tabua",D:"porta",d:"aberta"}[t]||"chao";
  const anima=nome==="agua"||nome==="glitch";
  const f=anima?(nome==="agua"?q:q+x*3+y*5)%4:v;
  return tex(`${nome}|${bio}|${f}|${hi}`,era,()=>pintaTile(nome,bio,f,hi));
}
const spr=(nome,f,era)=>tex(`o|${nome}|${f}`,era,()=>pintaObj(nome,f));
function corDoHeroi(){return CORES[S.cor]||"#4c6fd8"}
function sprHeroi(era){
  const H=G.heroi,cor=corDoHeroi(),anda=Math.abs(H.vx-H.x)+Math.abs(H.vy-H.y)>.02;
  const q=anda?1+(Math.floor(G.tempo*9)%2):0;
  return tex(`h|${H.dir}|${q}|${cor}`,era,()=>pintaHeroi(H.dir,q,cor),S.cor?cor:null);
}
/* Lista do que fica em pé no mundo: props das casas, criaturas e herói */
function cena(era){
  const L=[],q=Math.floor(G.tempo*4);
  for(let y=0;y<ROWS;y++)for(let x=0;x<COLS;x++){
    const t=G.t[y][x],n={M:"terminal",C:"bau",c:"bauAberto",V:"cofre",N:"pilar"}[t];
    if(!n)continue;
    let f=0;
    if(n==="terminal")f=q%2;
    if(n==="pilar")f=G.pilaresAcesos[x]>0?1:0;
    L.push({img:spr(n,f,era),x,y,w:1,h:1});
  }
  for(const m of G.moedasChao)L.push({img:spr("moeda",0,era),x:m.x+.15,y:m.y+.15,w:.7,h:.7,rot:m.v});
  for(const e of G.inimigos){
    if(e.morta)continue;
    L.push({img:spr("gosma",Math.floor(G.tempo*3+e.fase)%2,era),x:e.vx,y:e.vy,w:1,h:1,pisca:e.dano>0});
  }
  if(G.chefe&&G.chefe.ativo&&G.chefe.hp>0){
    const f=Math.floor(G.tempo*3)%2;
    L.push({img:tex(`chefe|${f}`,era,()=>pintaChefe(f)),x:3.1,y:3+Math.sin(G.tempo*2)*.08,w:3.2,h:3.2,pisca:G.chefe.hit>0,chefe:true});
  }
  const H=G.heroi;
  if(!H.oculto)L.push({img:sprHeroi(era),x:H.vx,y:H.vy,w:H.esc,h:H.esc,z:H.z,heroi:true,pisca:G.imune>0&&Math.floor(G.tempo*12)%2===0});
  if(!H.oculto&&G.t)L.push({img:spr("bit",q%2,era),x:H.vx-.62,y:H.vy-.5+Math.sin(G.tempo*3)*.08,w:.7,h:.7,bit:true});
  return L;
}
function desenhaTTY(g){
  g.fillStyle="#100a03";g.fillRect(0,0,W,H);
  g.font=fonteCanvas(32,"VT323");g.textAlign="left";g.textBaseline="top";g.fillStyle="#ffb22e";
  const lin=G.tty.slice(-11);
  lin.forEach((l,i)=>g.fillText(l,30,28+i*38));
  if(Math.floor(G.tempo*2)%2===0)g.fillRect(30+g.measureText(lin[lin.length-1]||"").width+(lin.length?8:0),30+(lin.length-1)*38,14,28);
}
function desenhaAscii(g){
  g.fillStyle="#100a03";g.fillRect(0,0,W,H);
  g.font=fonteCanvas(46,"VT323");g.textAlign="center";g.textBaseline="middle";
  const r=Math.floor(G.tempo*8);
  const mapa={"#":["#","#a66f18"],T:["&","#a66f18"],"~":["~","#5c3b0c"],".":["·","#5c3b0c"],M:["π","#ffe2a0"],C:["$","#ffe2a0"],c:["_","#ffb22e"],D:["+","#ffe2a0"],d:["/","#a66f18"],V:["V","#ffe2a0"],N:["i","#ffb22e"],O:["O","#a66f18"],"=":["=","#ffb22e"]};
  const gl="%&*?!§";
  for(let y=0;y<ROWS;y++)for(let x=0;x<COLS;x++){
    const t=G.t[y][x];
    const[c,cor]=t==="%"?[gl[(r+x*3+y)%gl.length],"#ffb22e"]:(mapa[t]||mapa["."]);
    g.fillStyle=cor;g.fillText(c,x*T+T/2,y*T+T/2+2);
  }
  for(const m of G.moedasChao){g.fillStyle="#ffe2a0";g.fillText(String(m.v),m.x*T+T/2,m.y*T+T/2+2)}
  for(const e of G.inimigos)if(!e.morta){g.fillStyle="#ffb22e";g.fillText("g",e.vx*T+T/2,e.vy*T+T/2)}
  const h0=G.heroi;
  g.fillStyle="#fff3d0";g.fillText("@",h0.vx*T+T/2,(h0.vy-h0.z)*T+T/2);
}
function desenha2D(g,era){
  const bio=G.sala.bio,q=Math.floor(G.tempo*3);
  for(let y=0;y<ROWS;y++)for(let x=0;x<COLS;x++){
    const t=G.t[y][x];
    g.drawImage(texTile(t,bio,x,y,era,q),x*T,y*T,T,T);
  }
  if(era==="16bit"){
    g.fillStyle="rgba(14,8,40,.3)";
    for(let y=1;y<ROWS;y++)for(let x=0;x<COLS;x++){
      const a=G.t[y-1][x],t=G.t[y][x];
      if((a==="#"||a==="T"||a==="D")&&t!=="#"&&t!=="T"&&t!=="D")g.fillRect(x*T,y*T,T,12);
    }
  }
  const L=cena(era).sort((a,b)=>a.y+a.h-(b.y+b.h));
  for(const o of L){
    if(o.pisca&&Math.floor(G.tempo*14)%2===0)continue;
    if(era==="16bit"&&!o.bit&&G.t[Math.round(o.y)]){
      g.fillStyle="rgba(14,8,40,.28)";
      g.beginPath();g.ellipse((o.x+o.w/2)*T,(o.y+o.h-.06)*T,o.w*T*.38,o.w*T*.13,0,0,6.3);g.fill();
    }
    g.drawImage(o.img,o.x*T+(1-o.w)*(o.heroi?T/2:0),(o.y-(o.z||0))*T+(1-o.h)*(o.heroi?T/2:0),o.w*T,o.h*T);
    if(o.rot!==undefined)rotulo(g,String(o.rot),(o.x+o.w/2)*T,(o.y+.42)*T,22,era);
    if(o.chefe)auraChefe(g,era,(o.x+o.w/2)*T,(o.y+o.h/2)*T,o.w*T*.62);
  }
  if(era==="16bit"){
    g.save();g.globalCompositeOperation="multiply";
    for(let i=0;i<2;i++){
      const x=((G.tempo*(14+i*7)+i*420)%(W+460))-230,y=120+i*230,r=g.createRadialGradient(x,y,20,x,y,230);
      r.addColorStop(0,"rgba(120,120,190,.5)");r.addColorStop(1,"rgba(255,255,255,0)");
      g.fillStyle=r;g.fillRect(0,0,W,H);
    }
    g.restore();
    const H0=G.heroi,cx=(H0.vx+.5)*T,cy=(H0.vy+.5)*T,v=g.createRadialGradient(cx,cy,110,cx,cy,620);
    v.addColorStop(0,"rgba(255,240,200,.08)");v.addColorStop(.45,"rgba(0,0,0,0)");v.addColorStop(1,"rgba(14,8,50,.5)");
    g.fillStyle=v;g.fillRect(0,0,W,H);
  }
}
function auraChefe(g,era,x,y,r){
  const c={fogo:"#ff6a2c",agua:"#3fa0ff",planta:"#46d060"}[G.chefe.esc];
  g.strokeStyle=era==="1bit"||era==="4tons"?"#e8e8e0":c;
  g.lineWidth=SC*2;g.setLineDash([12,10]);g.lineDashOffset=-G.tempo*30;
  g.beginPath();g.ellipse(x,y,r,r*(era==="3d"?1.05:.95),0,0,6.3);g.stroke();g.setLineDash([]);
  rotulo(g,G.chefe.esc.toUpperCase(),x,y-r-16,24,era,era==="1bit"||era==="4tons"?"#fff":c);
}
function rotulo(g,txt,x,y,px,era,cor="#fff"){
  const f=era==="3d"?"IBM Plex Sans":era==="16bit"?"Pixelify Sans":"VT323";
  g.font=fonteCanvas(px,`"${f}"`);g.textAlign="center";g.textBaseline="middle";
  g.lineWidth=5;g.strokeStyle="rgba(10,6,20,.9)";g.strokeText(txt,x,y);
  g.fillStyle=cor;g.fillText(txt,x,y);
}
const altura=t=>t==="#"?1:t==="T"?1.15:t==="D"?1:(t==="~"||t==="O")?-.22:0;
const LADOS=[[0,1],[0,-1],[1,0],[-1,0]];
function face(g,img,a,b,c,sombra){
  const E=TS+.4;
  g.setTransform((b[0]-a[0])/TS,(b[1]-a[1])/TS,(c[0]-a[0])/TS,(c[1]-a[1])/TS,a[0],a[1]);
  g.drawImage(img,0,0,E,E);
  if(sombra){g.fillStyle=`rgba(12,8,36,${sombra})`;g.fillRect(0,0,E,E)}
  g.setTransform(1,0,0,1,0,0);
}
function desenha3D(g){
  const p=G.p3,e=p*p*(3-2*p),pitch=lerp(Math.PI/2,.74,e),yaw=lerp(0,G.yaw,e);
  Cam.sy=Math.sin(yaw);Cam.cy=Math.cos(yaw);Cam.sp=Math.sin(pitch);Cam.cp=Math.cos(pitch);Cam.S=lerp(T,38,e);Cam.oy=lerp(0,10,e);
  const ceu=g.createLinearGradient(0,0,0,H);
  ceu.addColorStop(0,"#141a34");ceu.addColorStop(1,"#3a2f5e");
  g.fillStyle=ceu;g.fillRect(0,0,W,H);
  const q=Math.floor(G.tempo*3),bio=G.sala.bio,prof=(x,y)=>(x-8)*Cam.sy+(y-5)*Cam.cy,itens=[];
  const alt=(x,y)=>(x<0||y<0||x>=COLS||y>=ROWS)?-1:altura(G.t[y][x]);
  for(let y=0;y<ROWS;y++)for(let x=0;x<COLS;x++)itens.push({d:prof(x+.5,y+.5),x,y});
  const objs=cena("3d");
  for(const o of objs)itens.push({d:prof(o.x+o.w/2,o.y+o.h*.6)+.02,o});
  itens.sort((a,b)=>a.d-b.d);
  const lado=tex(`lado|${bio}`,"3d",()=>pintaTile("lado",bio,0,true));
  for(const it of itens){
    if(it.o){billboard(g,it.o,e);continue}
    const{x,y}=it,t=G.t[y][x],h=altura(t)*e,img=t==="T"&&e>.5?tex(`copa|${bio}`,"3d",()=>pintaTile("copa",bio,0,true)):texTile(t,bio,x,y,"3d",q);
    for(const[dx,dy]of LADOS){
      const hn=alt(x+dx,y+dy)*e,nry=dx*Cam.sy+dy*Cam.cy;
      if(hn>=h||nry<=0)continue;
      let A,B;
      if(dy===1){A=[x,y+1];B=[x+1,y+1]}else if(dy===-1){A=[x+1,y];B=[x,y]}else if(dx===1){A=[x+1,y+1];B=[x+1,y]}else{A=[x,y];B=[x,y+1]}
      const som=dy?.26:.42;
      face(g,t==="#"||t==="T"||t==="D"?img:lado,proj(A[0],A[1],h),proj(B[0],B[1],h),proj(A[0],A[1],hn),som);
    }
    face(g,img,proj(x,y,h),proj(x+1,y,h),proj(x,y+1,h),t==="~"?.12:0);
  }
}
function billboard(g,o,e){
  if(o.pisca&&Math.floor(G.tempo*14)%2===0)return;
  const[x,y]=proj(o.x+o.w/2,o.y+lerp(o.h,o.h*.62,e),o.z||0),s=Cam.S*lerp(1,1.12,e),w=o.w*s,h=o.h*s;
  if(!o.bit){
    g.fillStyle="rgba(10,6,30,.35)";
    g.beginPath();g.ellipse(x,y-2,w*.36,w*.36*Cam.sp,0,0,6.3);g.fill();
  }
  g.drawImage(o.img,x-w/2,y-h,w,h);
  if(o.rot!==undefined)rotulo(g,String(o.rot),x,y-h*.55,22,"3d");
  if(o.chefe)auraChefe(g,"3d",x,y-h*.5,w*.6);
}
function desenhaEfeitos(g,era){
  for(const c of G.cortes){
    const a=c.t/.16,[sx,sy]=tela(era,c.x+.5,c.y+.5,.3*(era==="3d"?1:0)),ang={direita:0,baixo:1.57,esquerda:3.14,cima:-1.57}[c.dir];
    g.strokeStyle=era==="1bit"||era==="4tons"||era==="ascii"?"#fff":"#fff6c8";
    g.lineWidth=SC*3*(1-a)+2;
    g.beginPath();g.arc(sx-Math.cos(ang)*T*.5,sy-Math.sin(ang)*T*.5,T*.8,ang-1+a*.9,ang+.2+a*1.1);g.stroke();
  }
  for(const q of G.tiros){
    const a=Math.min(1,q.t/q.dur),[x,y]=tela(era,lerp(q.x,q.tx,a)+.5,lerp(q.y,q.ty,a)+.5,.4);
    g.fillStyle=era==="1bit"||era==="4tons"||era==="ascii"?"#fff":q.cor;
    const r=(10+Math.sin(G.tempo*30)*2)*(era==="ascii"?.8:1);
    g.fillRect(x-r,y-r,r*2,r*2);
    g.fillStyle="rgba(255,255,255,.75)";g.fillRect(x-r/2,y-r/2,r,r);
  }
  const uni=era==="1bit"||era==="4tons"||era==="ascii";
  for(const q of G.parts){
    const[x,y]=tela(era,q.x,q.y,q.z||0),s=q.s*(altaDef(era)?q.v/q.vida+.4:1);
    g.fillStyle=uni?(era==="ascii"?"#ffb22e":era==="4tons"?"#0f380f":"#fff"):q.c;
    g.fillRect(x-s/2,y-s/2,s,s);
  }
  if(S.nome&&!G.heroi.oculto&&era!=="ascii"&&era!=="tty"){
    const H0=G.heroi,[x,y]=tela(era,H0.vx+.5,H0.vy+(era==="3d"?.4:0),era==="3d"?1.1:H0.z);
    rotulo(g,S.nome,x,y-(era==="3d"?10:8),19,era,era==="1bit"||era==="4tons"?"#fff":corClara());
  }
}
function corClara(){return S.cor&&S.cor!=="azul"&&S.cor!=="roxo"?corDoHeroi():"#fff"}
function desenhaHUD(g,era){
  if(!S.up.hud||era==="tty")return;
  const lcd=era==="4tons",uni=era==="ascii"||era==="1bit"||lcd;
  g.fillStyle=lcd?"rgba(155,188,15,.9)":"rgba(10,6,24,.72)";
  g.fillRect(8,8,G.vidaMax*30+132,36);
  for(let i=0;i<G.vidaMax;i++){
    const x=16+i*30,y=15,ch=i<G.vida;
    g.fillStyle=uni?(lcd?(ch?"#0f380f":"#8bac0f"):(ch?(era==="ascii"?"#ffb22e":"#fff"):"#444")):(ch?"#ff3f5e":"#553048");
    g.fillRect(x+3,y,6,3);g.fillRect(x+13,y,6,3);g.fillRect(x,y+3,22,9);g.fillRect(x+3,y+12,16,4);g.fillRect(x+7,y+16,8,3);
  }
  const x=G.vidaMax*30+22;
  g.fillStyle=uni?(lcd?"#0f380f":era==="ascii"?"#ffb22e":"#fff"):"#f2c94c";
  g.fillRect(x,15,20,20);g.fillStyle=lcd?"#8bac0f":"rgba(10,6,24,.72)";g.fillRect(x+8,19,4,12);
  g.font=fonteCanvas(28,"VT323");g.textAlign="left";g.textBaseline="middle";
  g.fillStyle=lcd?"#0f380f":"#fff";g.fillText(String(S.moedas),x+28,26);
  if(G.chefe&&G.chefe.ativo&&era!=="ascii"){
    const w=280,xx=W-w-16;
    g.fillStyle="rgba(10,6,24,.8)";g.fillRect(xx-4,10,w+8,24);
    g.fillStyle="#3a1a4a";g.fillRect(xx,14,w,16);
    g.fillStyle=lcd?"#0f380f":uni?"#fff":"#ff2e88";g.fillRect(xx,14,w*Math.max(0,G.chefe.hp)/G.chefe.max,16);
  }
}
function mundo(g,era){
  if(era==="tty"||!G.t)return desenhaTTY(g);
  if(era==="ascii")desenhaAscii(g);
  else if(era==="3d")desenha3D(g);
  else desenha2D(g,era);
  desenhaEfeitos(g,era);
  desenhaHUD(g,era);
}
function desenha(){
  const g=G.g;
  g.setTransform(1,0,0,1,0,0);g.imageSmoothingEnabled=false;
  const era=ERAS[G.eraVista].id;
  if(G.tremor>0&&!REDUZ)g.translate((Math.random()-.5)*G.tremor,(Math.random()-.5)*G.tremor);
  if(G.wipe){
    const w=G.wipe,x=w.t/w.dur*W;
    mundo(g,ERAS[w.de].id);
    g.save();g.beginPath();g.rect(0,0,x,H);g.clip();
    mundo(g,ERAS[w.para].id);
    g.restore();
    g.fillStyle="#fff";g.fillRect(x-3,0,6,H);
    return;
  }
  if(G.slide){
    const s=G.slide,e=s.t/s.dur,o=e*e*(3-2*e),dx=s.dx*W*(1-o),dy=s.dy*H*(1-o);
    g.save();g.translate(dx,dy);mundo(g,era);g.restore();
    g.drawImage(s.foto,dx-s.dx*W,dy-s.dy*H);
    return;
  }
  mundo(g,era);
}
