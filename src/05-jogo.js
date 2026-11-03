/* ---------- Estado e utilidades ---------- */
const REDUZ=matchMedia("(prefers-reduced-motion: reduce)").matches;
const TOQUE=matchMedia("(pointer: coarse)").matches;
const $=s=>document.querySelector(s);
const DIRS={cima:[0,-1],baixo:[0,1],esquerda:[-1,0],direita:[1,0]};
class Objetivo{}
class Falha extends Error{}
const ABORTA={aborta:true};
const novoSave=()=>({v:1,em:0,feitas:{},codigos:{},up:{},era:0,nome:"",cor:"",vel:1,melodia:[],golpe:"",moedas:0,sala:0});
let S=novoSave();
const G={g:null,tempo:0,modo:"edit",sala:null,iSala:0,t:null,inicio:null,
  heroi:{x:5,y:3,vx:5,vy:3,dir:"baixo",z:0,esc:1,vel:6,oculto:false,pulo:null},
  moedasChao:[],inimigos:[],cortes:[],tiros:[],parts:[],pilaresAcesos:{},chefe:null,vida:5,vidaMax:5,imune:0,
  tty:["COMPILANDIA/OS  1963","MEMORIA: 1 LINHA","MUNDO: NAO ENCONTRADO","",">"],
  eraVista:0,wipe:null,slide:null,p3:0,p3Alvo:0,yaw:-.55,tremor:0,clock:1,
  rodando:false,abortar:false,passoAPasso:false,continuar:null,linhaAtual:0,linhaErro:0,
  missao:null,dicasUsadas:0,falhas:0,ultimo:"",auto:false,
  golpeFn:null,golpeI:null,golpeAtivo:false,cofre:0,teclas:new Set()};
const dorme=ms=>new Promise(r=>setTimeout(r,ms));
const tileEm=(x,y)=>(G.t&&G.t[y]&&G.t[y][x])||"#";
const inimigoEm=(x,y)=>G.inimigos.find(e=>!e.morta&&e.x===x&&e.y===y);
const novaGosma=(x,y,treino)=>({x,y,vx:x,vy:y,treino,t:.6+Math.random()*.6,fase:Math.random()*4,dano:0,morta:false});

/* ---------- Som: de silêncio a beeps, de beeps à música de quem joga ---------- */
const Som={ac:null,mudo:false,
  liga(){
    if(!this.ac){const AC=window.AudioContext||window.webkitAudioContext;if(AC)try{this.ac=new AC()}catch{}}
    if(this.ac&&this.ac.state==="suspended")this.ac.resume();
  },
  nota(f,d=.1,tipo="square",v=.05,atraso=0){
    if(!this.ac||this.mudo)return;
    const t=this.ac.currentTime+atraso,o=this.ac.createOscillator(),g=this.ac.createGain();
    o.type=tipo;o.frequency.value=f;g.gain.setValueAtTime(v,t);g.gain.exponentialRampToValueAtTime(.001,t+d);
    o.connect(g).connect(this.ac.destination);o.start(t);o.stop(t+d);
  },
  fx(f,d,t,v,a){if(S.up.som)this.nota(f,d,t,v,a)},
  passo(){this.fx(190,.04,"square",.018)},
  bate(){this.fx(90,.12,"square",.05)},
  erro(){this.fx(140,.18,"sawtooth",.04);this.fx(100,.22,"sawtooth",.04,.1)},
  corte(){this.fx(720,.07,"sawtooth",.03);this.fx(360,.09,"square",.03,.03)},
  acerto(){this.fx(220,.09,"square",.05);this.fx(110,.14,"square",.05,.05)},
  moeda(){this.fx(988,.06,"square",.04);this.fx(1319,.13,"square",.04,.06)},
  abre(){[523,659,784,1047].forEach((f,i)=>this.fx(f,.14,"square",.05,i*.09))},
  evolui(){[392,523,659,784,1047,1319].forEach((f,i)=>this.fx(f,.2,"triangle",.09,i*.1))},
};
let bgmProx=0,bgmPos=0;
function bgmTick(){
  const ac=Som.ac;
  if(!S.up.musica||Som.mudo||!ac||!S.melodia.length||ac.state!=="running")return;
  const passo=60/132/2,M=S.melodia,R=[130.81,174.61,196,146.83],rico=G.eraVista>=5;
  if(bgmProx<ac.currentTime)bgmProx=ac.currentTime+.05;
  while(bgmProx<ac.currentTime+.3){
    const a=bgmProx-ac.currentTime,i=bgmPos,r=R[Math.floor(i/8)%4];
    if(i%2===0)Som.nota(NOTAS[M[(i/2)%M.length]]*2,passo*1.7,rico?"triangle":"square",rico?.07:.035,a);
    if(i%4===0)Som.nota(r/2,passo*3,"triangle",.09,a);
    if(rico&&i%4===2)Som.nota(r*1.5,passo*1.2,"square",.016,a);
    bgmProx+=passo;bgmPos++;
  }
}
setInterval(bgmTick,100);

/* ---------- Comandos do jogo: cada um é chamado pelo código de quem joga ---------- */
const semArgs=(a,n,l)=>{if(a.length)throw new Erro(`${n}() não recebe valores. Deixe os parênteses vazios.`,l,n==="direita"||n==="esquerda"||n==="cima"||n==="baixo"?"Para repetir um passo, use um for.":undefined)};
function dirOk(v,n,l){
  if(typeof v==="string"&&DIRS[v])return v;
  if(v&&typeof v==="object"&&DIRS[v.nome])throw new Erro(`A direção vai entre aspas: ${n}("${v.nome}")`,l);
  throw new Erro(`${n}() precisa de uma direção: "cima", "baixo", "esquerda" ou "direita".`,l);
}
function gasta(c){
  if(++c.acoes>350)throw new Falha("O herói cansou: foram mais de 350 ações. Confira se o programa sabe a hora de parar.");
}
const msPasso=c=>c.rapido?130:220/G.clock;
function anda(x,y,ms){
  const H=G.heroi,d=Math.abs(x-H.x)+Math.abs(y-H.y);
  H.x=x;H.y=y;H.vel=d/(Math.max(ms,1)/1000);
}
function brilho(x,y,cor="#fff6c8",n=8){
  if(G.auto||G.parts.length>400)return;
  for(let i=0;i<n;i++){
    const a=Math.random()*6.3,s=.8+Math.random()*2.4,v=.35+Math.random()*.5;
    G.parts.push({x:x+.5,y:y+.5,z:.1,dx:Math.cos(a)*s,dy:Math.sin(a)*s,dz:1+Math.random()*2,s:SC*(1+Math.random()*2|0)+2,c:cor,v,vida:v});
  }
}
const nomeTile=t=>({"#":"parede",T:"parede",N:"parede","~":"agua",O:"buraco",C:"bau",M:"terminal",V:"cofre",D:"porta"}[t]||"chao");
function oQueHa(x,y){return inimigoEm(x,y)?"inimigo":nomeTile(tileEm(x,y))}
function* chegar(x,y,c,t){
  if(t==="~"||t==="O"){
    yield{e:c.rapido?130:220};
    G.heroi.cai=.5;
    yield{e:380};
    throw new Falha(`O herói caiu ${t==="O"?"no buraco":"na água"} na linha ${G.linhaAtual}.`);
  }
  yield{e:c.rapido?130:220};
  if(t==="C")throw new Objetivo();
}
function* passo(dir,c){
  const H=G.heroi,[dx,dy]=DIRS[dir],nx=H.x+dx,ny=H.y+dy,t=tileEm(nx,ny);
  gasta(c);H.dir=dir;
  if(inimigoEm(nx,ny)||"#TDMVN".includes(t)){
    G.tremor=5;Som.bate();
    if(!c.silencioso)c.aviso(`Linha ${G.linhaAtual}: o herói bateu em ${oQueHa(nx,ny)==="inimigo"?"um inimigo":"algo"} e ficou parado.`);
    yield{e:c.rapido?60:160};
    return;
  }
  anda(nx,ny,msPasso(c));Som.passo();
  yield* chegar(nx,ny,c,t);
}
const direcao=d=>({d:1,f:function*(a,l,c){semArgs(a,d,l);yield* passo(d,c)}});
const GF={
  direita:direcao("direita"),esquerda:direcao("esquerda"),cima:direcao("cima"),baixo:direcao("baixo"),
  pegar:{d:5,f:function*(a,l,c){
    semArgs(a,"pegar",l);
    const H=G.heroi,i=G.moedasChao.findIndex(m=>m.x===H.x&&m.y===H.y);
    if(i<0)return 0;
    const v=G.moedasChao.splice(i,1)[0].v;
    brilho(H.x,H.y,"#f2c94c",6);Som.moeda();c.aviso(`pegar() devolveu ${v}`,"mudo");
    yield{e:120};
    return v;
  }},
  abrir_cofre:{d:5,f:function*(a,l){
    const H=G.heroi;
    if(tileEm(H.x-1,H.y)!=="V"&&tileEm(H.x+1,H.y)!=="V")throw new Falha("O herói precisa estar ao lado do cofre para abrir.");
    if(typeof a[0]!=="number")throw new Falha("abrir_cofre() precisa de um número, como abrir_cofre(total).");
    yield{e:200};
    if(a[0]!==G.cofre)throw new Falha(`O cofre tinha ${G.cofre} moedas e o programa mandou ${a[0]}.`);
    throw new Objetivo();
  }},
  olhar:{d:6,f:function*(a,l,c){const d=dirOk(a[0],"olhar",l),[dx,dy]=DIRS[d],H=G.heroi;H.dir=d;yield{e:c.rapido?0:50};return oQueHa(H.x+dx,H.y+dy)}},
  pular:{d:6,f:function*(a,l,c){
    const d=dirOk(a[0],"pular",l),[dx,dy]=DIRS[d],H=G.heroi,nx=H.x+dx*2,ny=H.y+dy*2,t=tileEm(nx,ny);
    gasta(c);H.dir=d;
    if("#TDMVN".includes(t)){G.tremor=5;Som.bate();yield{e:160};return}
    const ms=msPasso(c)*1.5;
    anda(nx,ny,ms);H.pulo={t:0,d:ms/1000};Som.fx(420,.12,"square",.04);
    yield* chegar(nx,ny,c,t);
  }},
  livre:{d:7,f:function*(a,l){
    const d=dirOk(a[0],"livre",l),[dx,dy]=DIRS[d],H=G.heroi;
    return["chao","bau"].includes(oQueHa(H.x+dx,H.y+dy));
  }},
  atacar:{d:8,f:function*(a,l,c){
    const d=dirOk(a[0],"atacar",l),[dx,dy]=DIRS[d],H=G.heroi;
    gasta(c);H.dir=d;G.cortes.push({x:H.x+dx,y:H.y+dy,dir:d,t:0});Som.corte();
    const e=inimigoEm(H.x+dx,H.y+dy);
    if(e){e.morta=true;c.acertos=(c.acertos||0)+1;brilho(e.x,e.y,"#ff5c9c",12);Som.acerto();G.tremor=4}
    yield{e:c.rapido?90:160};
  }},
  construir:{d:9,f:function*(a,l,c){
    const d=dirOk(a[0],"construir",l),[dx,dy]=DIRS[d],H=G.heroi,x=H.x+dx,y=H.y+dy;
    gasta(c);H.dir=d;
    if(tileEm(x,y)!=="~")throw new Falha(`Na linha ${G.linhaAtual} não há água para construir: ali tem ${oQueHa(x,y)}.`);
    G.t[y][x]="=";brilho(x,y,"#c98a4a",5);Som.fx(300,.05,"square",.04);
    yield{e:120};
  }},
  tocar:{d:10,f:function*(a,l,c){
    const n=a[0];
    if(typeof n!=="string"||!NOTAS[n])throw new Erro(`“${paraTexto(n)}” não é uma nota. Use do, re, mi, fa, sol, la ou si.`,l);
    Som.nota(NOTAS[n],.3,"triangle",.14);c.notas.push(n);
    G.pilaresAcesos[4+Object.keys(NOTAS).indexOf(n)]=.3;
    yield{e:260};
  }},
  chefe_vivo:{d:12,f:function*(){return!!(G.chefe&&G.chefe.hp>0)}},
  escudo:{d:12,f:function*(){return G.chefe.esc}},
  vida:{d:12,f:function*(){return G.vida}},
  magia:{d:12,f:function*(a,l,c){
    const el=String(a[0]??"").replace("á","a"),B=G.chefe,H=G.heroi;
    if(!VENCE[el]&&!Object.values(VENCE).includes(el))throw new Erro(`magia() aceita "fogo", "agua" ou "planta", e recebeu “${paraTexto(a[0])}”.`,l);
    gasta(c);H.dir="esquerda";
    G.tiros.push({x:H.x,y:H.y,tx:4.2,ty:4.2,t:0,dur:.3/G.clock,cor:{fogo:"#ff6a2c",agua:"#3fa0ff",planta:"#46d060"}[el]});Som.corte();
    yield{e:320};
    if(VENCE[B.esc]===el){
      B.hp--;B.hit=.3;G.tremor=8;brilho(4.2,4.2,"#ff5c9c",14);Som.acerto();
      if(B.hp<=0){B.hit=0;throw new Objetivo()}
    }else{
      c.aviso(`Escudo de ${B.esc}: ${el} não funcionou e custou um coração.`);
      yield* feridaHeroi(c);
    }
    yield* turnoChefe(c);
  }},
  curar:{d:12,f:function*(a,l,c){
    gasta(c);G.vida=Math.min(G.vidaMax,G.vida+2);
    brilho(G.heroi.x,G.heroi.y,"#7dff9c",12);Som.fx(660,.2,"triangle",.08);
    yield{e:300};
    yield* turnoChefe(c);
  }},
  pintar:{d:13,f:function*(a,l){
    const[x,y,t]=a,m={chao:".",agua:"~",parede:"#",arvore:"T"}[t];
    if(!m)throw new Erro(`Tipo de casa desconhecido. Use "chao", "agua", "parede" ou "arvore".`,l);
    if(typeof x!=="number"||typeof y!=="number"||x<0||y<0||x>15||y>9||x%1||y%1)throw new Erro(`A casa (${paraTexto(x)}, ${paraTexto(y)}) fica fora do mapa. x vai de 0 a 15 e y de 0 a 9.`,l);
    const H=G.heroi;
    if(!(x===H.x&&y===H.y)){G.t[y][x]=m;brilho(x,y,"#fff6c8",3)}
    yield{e:12};
  }},
  fogos:{d:13,f:function*(){
    for(let i=0;i<6;i++){brilho(2+Math.random()*12,1+Math.random()*7,["#ff5c9c","#28e6d0","#f2c94c","#7dff9c"][i%4],22);Som.fx(500+i*140,.1,"triangle",.05);yield{e:120}}
  }},
};
function sorteiaEscudo(){const o=Object.keys(VENCE);G.chefe.esc=o[Math.floor(Math.random()*3)]}
function* feridaHeroi(c){
  G.vida--;G.imune=.6;G.tremor=10;Som.acerto();
  yield{e:200};
  if(G.vida<=0)throw new Falha("O herói ficou sem corações. Use vida() e curar() antes que seja tarde.");
}
function* turnoChefe(c){
  const B=G.chefe;
  B.turno++;
  if(B.turno%2===0){
    G.tiros.push({x:4.2,y:4.2,tx:G.heroi.x,ty:G.heroi.y,t:0,dur:.3/G.clock,cor:"#ff2e88"});
    yield{e:320};
    yield* feridaHeroi(c);
  }
  sorteiaEscudo();
}
function embutidasPara(i){
  const m=embutidasBase();
  for(const[n,f]of Object.entries(GF))if((f.d??99)<=i)m.set(n,{bi:true,nome:n,fn:f.f});
  return m;
}
const bloqueadasPara=i=>new Set(Object.keys(GF).filter(n=>(GF[n].d??99)>i));
function novoCtx(){
  return{acoes:0,impressos:[],notas:[],acertos:0,
    imprime(t){this.impressos.push(t);saida(t);if(G.eraVista===0)G.tty.push(t,">")},
    aviso(t,cls="aviso"){saida(t,cls)}};
}
async function conduz(gen,c){
  let r=gen.next(),n=0,folga=0;
  while(!r.done){
    if(G.abortar)throw ABORTA;
    const v=r.value;
    if(v.l!==undefined){
      if(c.silencioso){if(++folga%300===0)await dorme(0)}
      else{
        G.linhaAtual=v.l;marcaLinha(v.l);mostraVariaveis(v.A);n++;
        if(G.passoAPasso){atualizaBotoes();await new Promise(res=>{G.continuar=res});if(G.abortar)throw ABORTA}
        else if(n<400)await dorme(G.auto?0:70/G.clock);
        else if(++folga%300===0)await dorme(0);
      }
    }else if(v.e!==undefined)await dorme(G.auto?0:c.rapido?v.e:v.e/G.clock);
    r=gen.next();
  }
}

/* ---------- Salas ---------- */
function carregaSala(i,crua){
  const sala=SALAS[i];G.sala=sala;G.iSala=i;
  const feita=!crua&&salaFeita(i);
  G.t=sala.mapa.map(l=>l.split(""));
  G.inicio=null;G.moedasChao=[];G.inimigos=[];G.pilaresAcesos={};G.chefe=null;
  for(let y=0;y<ROWS;y++)for(let x=0;x<COLS;x++){
    const c=G.t[y][x];
    if(c==="S"){G.inicio=[x,y];G.t[y][x]="."}
    if(feita){if(c==="%")G.t[y][x]=".";if(c==="C"||c==="V")G.t[y][x]="c";if(c==="D")G.t[y][x]="d"}
  }
  if(i===11&&!S.feitas.chefe)G.chefe={hp:8,max:8,esc:"fogo",turno:0,ativo:true,hit:0};
  if(feita&&sala.bau)G.t[sala.bau[1]][sala.bau[0]]="c";
  if(feita&&sala.pontes)for(const[x,y]of sala.pontes)G.t[y][x]="=";
}
const missaoDaSala=i=>{
  if(i===11&&S.feitas.chefe)return MISSOES[13];
  return MISSOES.find(m=>m.sala===i&&!m.livre);
};
function salaFeita(i){const m=MISSOES.find(q=>q.sala===i&&!q.livre);return!!(m&&S.feitas[m.id])}
function pontoInicial(){
  if(G.inicio)return G.inicio;
  for(let y=1;y<ROWS;y++)for(let x=7;x<COLS;x++)if(G.t[y][x]===".")return[x,y];
  return[8,1];
}
function poeHeroi(x,y){const H=G.heroi;H.x=H.vx=x;H.y=H.vy=y;H.z=0;H.esc=1;H.cai=0;H.pulo=null}
function preparaSala(m){
  carregaSala(m.sala,true);
  if(m.prepara)m.prepara();
  if(G.inicio)poeHeroi(...G.inicio);
}
function copiaTela(){const c=mk(W,H);c.getContext("2d").drawImage($("#cv"),0,0);return c}
function mudaSala(dx,dy){
  const a=G.sala,b=SALAS.findIndex(s=>s.gx===a.gx+dx&&s.gy===a.gy+dy);
  if(b<0)return;
  const H=G.heroi,foto=S.up.rolagem&&!REDUZ?copiaTela():null,nx=dx?(dx>0?0:COLS-1):H.x,ny=dy?(dy>0?0:ROWS-1):H.y;
  carregaSala(b);poeHeroi(nx,ny);
  S.sala=b;salvar();
  if(foto)G.slide={foto,dx,dy,t:0,dur:.5};
  anunciaSala();renderPainel();
}
function anunciaSala(){
  const m=missaoDaSala(G.iSala);
  if(m&&!S.feitas[m.id])fala(`Terminal à vista: ${m.titulo}. Encoste nele para programar.`);
}
function tentaAndar(dir){
  const H=G.heroi,[dx,dy]=DIRS[dir];H.dir=dir;
  const nx=H.x+dx,ny=H.y+dy;
  if(nx<0||ny<0||nx>=COLS||ny>=ROWS)return mudaSala(dx,dy);
  const t=tileEm(nx,ny);
  if(inimigoEm(nx,ny))return;
  if(t==="M"){G.teclas.clear();return abreTerminal()}
  if(t==="D")return fala("Porta trancada. Ela abre quando o programa do terminal funcionar.");
  if(t==="%")return fala("Trecho corrompido: só o código atravessa. Procure o terminal.");
  if(t==="C"||t==="V")return fala("Trancado por enquanto. Só um programa abre isso.");
  if("#T~ON".includes(t))return;
  H.x=nx;H.y=ny;H.vel=3+S.vel*2;Som.passo();
}
function abreTerminal(){
  if(G.modo==="combate")return;
  const m=missaoDaSala(G.iSala);
  if(m)abrirMissao(m);
}
function iniciaCombate(m,c,fonte){
  G.modo="combate";G.missao=null;renderPainel();
  G.vida=G.vidaMax=5;G.combateDe={m,c,fonte};
  spawnGosmas();
  fala("Espaço, ou o botão Golpe, roda o seu golpe() de verdade. Acabe com as gosmas!");
  document.activeElement&&document.activeElement.blur();
}
function spawnGosmas(){G.inimigos=[[3,1],[13,2],[2,7],[13,7],[8,1],[8,8]].map(([x,y])=>novaGosma(x,y,false))}
function atualizaCombate(dt){
  const H=G.heroi;
  for(const e of G.inimigos){
    if(e.morta)continue;
    e.t-=dt;
    if(e.t>0)continue;
    e.t=.5+Math.random()*.4;
    const dx=Math.sign(H.x-e.x),dy=Math.sign(H.y-e.y),op=Math.abs(H.x-e.x)>Math.abs(H.y-e.y)?[[dx,0],[0,dy]]:[[0,dy],[dx,0]];
    for(const[a,b]of op){
      if(!a&&!b)continue;
      const x=e.x+a,y=e.y+b;
      if(x===H.x&&y===H.y){
        if(G.imune<=0){G.vida--;G.imune=1;G.tremor=9;Som.acerto()}
        break;
      }
      if(".=c".includes(tileEm(x,y))&&!inimigoEm(x,y)){e.x=x;e.y=y;break}
    }
  }
  if(G.vida<=0){G.vida=G.vidaMax;spawnGosmas();poeHeroi(...G.inicio);fala("As gosmas venceram essa. Respire e tente de novo. Dá para melhorar o golpe depois.")}
  if(G.inimigos.every(e=>e.morta)){
    const d=G.combateDe;G.combateDe=null;
    G.vida=G.vidaMax=5;
    concluiMissao(d.m,d.c,d.fonte);
  }
}
async function disparaGolpe(){
  if(!G.golpeFn||G.golpeAtivo||!S.up.espada||(G.modo!=="explora"&&G.modo!=="combate"))return;
  G.golpeAtivo=true;
  const I=G.golpeI,c=I.ctx;c.rapido=true;c.silencioso=true;c.acoes=0;I.passos=0;
  const[x0,y0]=[G.heroi.x,G.heroi.y];
  try{await conduz(I.chamar(G.golpeFn,[],0),c)}
  catch(e){
    if(e instanceof Erro)fala("Seu golpe() deu erro: "+e.message);
    else if(e instanceof Falha)poeHeroi(x0,y0);
    else if(!(e instanceof Objetivo)&&e!==ABORTA)throw e;
  }
  G.golpeAtivo=false;
}
function restauraGolpe(){
  if(!S.golpe)return;
  try{
    const c=novoCtx();c.silencioso=true;c.rapido=true;
    const I=novoInterp(c,embutidasPara(99));
    const g=I.rodar(analisar(S.golpe).filter(s=>s.k==="def"||s.k==="atrib"));
    let r=g.next();while(!r.done)r=g.next();
    G.golpeFn=I.glob.get("golpe")||null;G.golpeI=I;
  }catch{G.golpeFn=null}
}

/* ---------- Execução dos programas ---------- */
const contaLinhas=f=>f.split("\n").filter(l=>l.trim()&&!l.trim().startsWith("#")).length;
const confereBau=()=>({ok:false,msg:"O programa terminou e o herói não chegou ao baú."});
async function executar(aPasso=false){
  const m=G.missao;
  if(!m||G.rodando)return;
  Som.liga();
  const fonte=$("#code").value;
  limpaSaida();G.linhaErro=0;G.ultimo="";
  const n=contaLinhas(fonte);
  if(m.memoria&&n>m.memoria){
    const t=`Sem memória: o programa tem ${n} linhas e aqui só cabem ${m.memoria}.`;
    saida(t,"erro");fala(t);Som.erro();G.ultimo=t;return;
  }
  let prog;
  try{prog=analisar(fonte)}catch(e){if(!(e instanceof Erro))throw e;mostraErro(e);return}
  S.codigos[m.id]=fonte;
  if(innerWidth<=920&&!G.auto)$("#tela").scrollIntoView({block:"start",behavior:REDUZ?"auto":"smooth"});
  G.rodando=true;G.abortar=false;G.passoAPasso=aPasso;G.modo="run";
  if(m.sala!=null&&!m.livre)preparaSala(m);
  atualizaBotoes();
  const c=novoCtx(),I=novoInterp(c,embutidasPara(m.i),bloqueadasPara(m.i));
  I.fonte=fonte;G.I=I;
  let res;
  try{
    await conduz(I.rodar(prog),c);
    res=(m.confere||confereBau)(c,I);
  }catch(e){
    if(e instanceof Objetivo)res={ok:true};
    else if(e instanceof Falha){G.linhaErro=G.linhaAtual;res={ok:false,msg:e.message}}
    else if(e===ABORTA)res={parou:true};
    else if(e instanceof Erro){mostraErro(e);res={erro:true}}
    else{G.rodando=false;G.modo="edit";throw e}
  }
  G.rodando=false;G.passoAPasso=false;G.continuar=null;G.linhaAtual=0;atualizaEditor();atualizaBotoes();
  if(res.ok===true){
    G.ultimo="";
    if(res.combate&&!S.feitas[m.id]){iniciaCombate(m,c,fonte);return}
    await concluiMissao(m,c,fonte);
    return;
  }
  G.modo="edit";
  if(res.ok===false){
    G.falhas++;G.ultimo=res.msg;saida(res.msg,"erro");fala(res.msg);Som.erro();
    if(G.falhas>=2)$("#btDica").classList.add("chama");
  }
  if(res.ok===null){saida("Programa concluído.","mudo");return}
  if(m.sala!=null&&!m.livre){await dorme(G.auto?0:res.ok===false?650:0);if(G.modo==="edit"&&!G.rodando)preparaSala(m)}
}
function mudaEra(i){
  return new Promise(res=>{
    const de=G.eraVista;
    G.eraVista=i;aplicaTema();
    if(G.auto||REDUZ||de===i){G.p3=ERAS[i].id==="3d"?1:0;G.p3Alvo=G.p3;return res()}
    if(ERAS[i].id==="3d"){G.p3=0;G.p3Alvo=1;G.wipe=null;setTimeout(res,3400);return}
    G.p3Alvo=G.p3;
    G.wipe={de,para:i,t:0,dur:1.5,fim(){G.p3=G.p3Alvo=0;res()}};
  });
}
async function demonstraMelodia(){
  for(const n of CHAVE_MELODIA){
    await dorme(G.auto?0:430);
    if(!G.missao||G.missao.id!=="melodia"||G.rodando)return;
    Som.nota(NOTAS[n],.3,"triangle",.12);
    G.pilaresAcesos[4+Object.keys(NOTAS).indexOf(n)]=.3;
  }
}
async function abreBau(){
  let p=null;
  for(let y=0;y<ROWS;y++)for(let x=0;x<COLS;x++)if("CV".includes(G.t[y][x]))p=[x,y];
  if(!p&&G.sala.bau){p=G.sala.bau;G.t[p[1]][p[0]]="C";if(!G.auto)await dorme(350)}
  if(!p)return;
  G.t[p[1]][p[0]]="c";brilho(p[0],p[1],"#ffe9a0",26);Som.abre();
  if(!G.auto)await dorme(650);
}
async function curaSala(){
  const L=[];
  for(let y=0;y<ROWS;y++)for(let x=0;x<COLS;x++)if("%O".includes(G.t[y][x]))L.push([x,y]);
  for(const[x,y]of L){G.t[y][x]=".";brilho(x,y,"#a8fff0",4);if(!G.auto)await dorme(16)}
  for(let y=0;y<ROWS;y++)for(let x=0;x<COLS;x++)if(G.t[y][x]==="D"){G.t[y][x]="d";brilho(x,y,"#f2c94c",14);Som.abre()}
}
function cartaoEvolucao(o){
  return new Promise(res=>{
    if(G.auto)return res();
    $("#evoTipo").textContent=o.tipo;
    $("#evoTitulo").textContent=o.titulo;
    $("#evoTexto").textContent=o.texto;
    const a=$("#evoAprendeu");a.hidden=!o.aprendeu;a.textContent=o.aprendeu?"Você aprendeu: "+o.aprendeu:"";
    $("#evoEstrelas").textContent="★".repeat(o.e)+"☆".repeat(3-o.e);
    $("#evoDetalhe").textContent=o.detalhe;
    const el=$("#evolucao"),bt=$("#evoOk");
    el.hidden=false;bt.focus({preventScroll:true});
    bt.onclick=()=>{el.hidden=true;bt.blur();res()};
  });
}
async function concluiMissao(m,c,fonte){
  G.modo="cena";
  const primeira=!S.feitas[m.id],n=contaLinhas(fonte),semDica=G.dicasUsadas===0,enxuto=n<=m.par,e=1+(semDica?1:0)+(enxuto?1:0);
  S.feitas[m.id]={e:Math.max(e,S.feitas[m.id]?.e||0)};
  S.codigos[m.id]=fonte;
  if(m.id==="cofre")S.moedas+=G.cofre;
  if(m.id==="ola"){carregaSala(0,true);if(G.inicio)poeHeroi(...G.inicio)}
  if(m.id==="chefe"&&G.chefe){brilho(4.2,4.2,"#ff5c9c",40);G.chefe.ativo=false;G.chefe=null;G.vida=G.vidaMax=5}
  if(m.sala!=null&&m.id!=="chefe")await abreBau();
  const g=m.ganha;
  Som.evolui();
  if(primeira&&g){
    for(const u of g.up||[])S.up[u]=true;
    if(g.era!=null){S.era=g.era;await mudaEra(g.era)}
  }
  salvar();montaEras();atualizaPlacar();atualizaEditor();
  const det=`${semDica?"Sem dicas":"Com dicas"}. ${n} ${n===1?"linha":"linhas"} de código${m.par?` (meta: ${m.par})`:""}.`;
  await cartaoEvolucao(primeira&&g
    ?{tipo:"Nova evolução",titulo:g.titulo,texto:g.texto,aprendeu:g.aprendeu,e,detalhe:det}
    :{tipo:"Missão repetida",titulo:m.titulo,texto:"Programa funcionando de novo. Sua melhor marca fica guardada.",e:S.feitas[m.id].e,detalhe:det});
  if(m.sala!=null&&m.id!=="chefe")await curaSala();
  if(m.id==="chefe"&&primeira){
    const linhas=MISSOES.reduce((a,x)=>a+(S.feitas[x.id]&&S.codigos[x.id]?contaLinhas(S.codigos[x.id]):0),0),est=Object.values(S.feitas).reduce((a,f)=>a+f.e,0);
    await cartaoEvolucao({tipo:"Fim da jornada",titulo:"Você programou um mundo",texto:"Do teletipo ao 3D, cada evolução saiu do seu código. Variáveis, if, for, while, funções e listas são Python de verdade: funcionam igual fora daqui. O próximo passo é instalar o Python e criar seus próprios programas.",e:3,detalhe:`${linhas} linhas nas versões finais dos seus programas. ${est} de 39 estrelas.`});
  }
  G.missao=null;
  if(primeira&&g&&m.depois)fala(m.depois);
  if(m.id==="ola"){abrirMissao(MISSOES[1]);return}
  G.modo="explora";renderPainel();
}

/* ---------- Interface ---------- */
const ed=$("#code"),hl=$("#hl"),gut=$("#gutter"),out=$("#saida");
const esc=s=>s.replace(/[&<>]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;"}[c]));
const RE_COR=/(#.*$)|("[^"]*"?|'[^']*'?)|\b(\d+(?:\.\d+)?)\b|\b(if|elif|else|while|for|in|def|return|break|continue|pass|and|or|not|True|False|None)\b|([\p{L}_][\p{L}\p{N}_]*)(?=\()/gu;
function colore(l){
  let r="",u=0;
  for(const m of l.matchAll(RE_COR)){
    r+=esc(l.slice(u,m.index));
    const c=m[1]?"com":m[2]?"str":m[3]?"num":m[4]?"kw":"fn";
    r+=`<span class="t-${c}">${esc(m[0])}</span>`;
    u=m.index+m[0].length;
  }
  return r+esc(l.slice(u));
}
function atualizaEditor(){
  const ls=ed.value.split("\n");
  hl.innerHTML=ls.map((l,i)=>`<div class="l${i+1===G.linhaAtual?" atual":""}${i+1===G.linhaErro?" errada":""}">${(S.up.sintaxe?colore(l):esc(l))||" "}</div>`).join("");
  gut.hidden=!S.up.linhas;
  if(S.up.linhas)gut.innerHTML=ls.map((_,i)=>`<div>${i+1}</div>`).join("");
  sincroniza();atualizaMemoria();
}
function sincroniza(){hl.scrollTop=ed.scrollTop;hl.scrollLeft=ed.scrollLeft;gut.scrollTop=ed.scrollTop}
function marcaLinha(n){
  for(const d of hl.querySelectorAll(".atual"))d.classList.remove("atual");
  const d=hl.children[n-1];
  if(d){d.classList.add("atual");const y=d.offsetTop;if(y<ed.scrollTop||y>ed.scrollTop+ed.clientHeight-30)ed.scrollTop=y-40;sincroniza()}
}
function atualizaMemoria(){
  const m=G.missao,box=$("#memoria");
  if(!m||!m.memoria){box.textContent="Memória livre";box.classList.remove("cheia");return}
  const n=contaLinhas(ed.value);
  box.textContent=`Memória ${n}/${m.memoria} ${m.memoria===1?"linha":"linhas"}`;
  box.classList.toggle("cheia",n>m.memoria);
}
function saida(t,cls=""){
  const d=document.createElement("div");
  d.className="ln "+cls;d.textContent=t;out.append(d);
  while(out.children.length>200)out.firstChild.remove();
  $("#caixaAbas").scrollTop=$("#caixaAbas").scrollHeight;
  if(cls==="erro"||cls==="dica")abaAtiva("saida");
}
function limpaSaida(){out.textContent=""}
function mostraErro(e){
  G.linhaErro=e.line||G.linhaAtual;G.linhaAtual=0;
  const txt=(G.linhaErro?`Linha ${G.linhaErro}: `:"")+e.message;
  saida(txt,"erro");if(e.dica)saida(e.dica,"dica");
  fala(e.dica?`${e.message} ${e.dica}`:e.message);
  G.ultimo=txt+(e.dica?" "+e.dica:"");
  G.falhas++;Som.erro();atualizaEditor();
  if(G.falhas>=2)$("#btDica").classList.add("chama");
}
let falaT=null;
function fala(t){
  clearInterval(falaT);
  const e=$("#falaTxt");
  if(REDUZ||G.auto){e.textContent=t;return}
  let i=0;e.textContent="";
  falaT=setInterval(()=>{i+=2;e.textContent=t.slice(0,i);if(i>=t.length)clearInterval(falaT)},16);
}
function mostraVariaveis(A){
  if(!S.up.variaveis&&!G.auto)return;
  const box=$("#vars"),mapa=new Map();
  const cad=[];for(let e=A;e;e=e.pai)cad.unshift(e);
  for(const e of cad)for(const[k,v]of e.v)mapa.set(k,v);
  const L=[...mapa].filter(([,v])=>!(v&&v.usr));
  box.textContent="";
  if(!L.length){box.textContent="Nenhuma variável ainda.";return}
  const f=document.createDocumentFragment();
  for(const[k,v]of L){
    const d=document.createElement("div");d.className="var";
    const a=document.createElement("span");a.textContent=k;
    const b=document.createElement("code");b.textContent=paraTexto(v,true);
    const c=document.createElement("small");c.textContent=tipoDe(v);
    d.append(a,b,c);f.append(d);
  }
  box.append(f);
}
function abaAtiva(a){
  for(const b of document.querySelectorAll(".aba"))b.setAttribute("aria-selected",b.dataset.aba===a);
  for(const n of["saida","vars","manual"])$("#"+n).hidden=n!==a;
}
function atualizaBotoes(){
  const r=G.rodando;
  $("#btRodar").textContent=r?"Parar":"Executar";
  $("#btRodar").classList.toggle("parar",r);
  $("#btPasso").hidden=!S.up.depurador;
  $("#btPasso").textContent=r&&G.passoAPasso?"Próxima linha":"Passo a passo";
  $("#btPasso").disabled=r&&!G.passoAPasso;
  $("#btDica").disabled=r;
  ed.readOnly=r;
}
function renderPainel(){
  const m=G.missao;
  $("#areaMissao").hidden=!m;$("#passeio").hidden=!!m;
  if(m){
    $("#mConceito").textContent=m.conceito;
    $("#mTitulo").textContent=m.titulo;
    $("#mTexto").innerHTML=m.texto;
    const ch=$("#chips");ch.textContent="";
    for(const c of m.chips){
      const b=document.createElement("button"),t=c.t||c;
      b.type="button";b.className="chip";b.textContent=t;
      b.onclick=()=>{insereChip(c.t?c:{t});ed.focus({preventScroll:true})};
      ch.append(b);
    }
    $("#btDica").textContent=`Dica ${G.dicasUsadas}/${m.dicas.length}`;
    $("#btDica").classList.remove("chama");
    $("#btFechar").hidden=!S.up.teclado;
  }else{
    const q=missaoDaSala(G.iSala),bt=$("#btTerminal");
    bt.hidden=!q||G.modo==="combate";
    $("#teclasAjuda").textContent=(TOQUE?"Use as setas da tela para andar.":"Setas ou WASD para andar.")+" Encoste em um terminal para programar."+(S.up.espada?(TOQUE?" O botão Golpe":" Espaço")+" roda o seu golpe().":"")+(S.era>=6&&!TOQUE?" Q e E giram a câmera.":"")+(S.era>0?" A linha do tempo no topo troca de era.":"");
    if(q)bt.textContent=S.feitas[q.id]?`Abrir o terminal: ${q.titulo}`:"Abrir o terminal desta sala";
    const lista=$("#diario");lista.textContent="";
    let primeiraAberta=true;
    for(const x of MISSOES){
      if(x.livre&&!S.feitas.chefe)continue;
      const f=S.feitas[x.id],li=document.createElement("li");
      if(!f&&!primeiraAberta){li.className="oculta";li.textContent="? ? ?";lista.append(li);continue}
      if(!f)primeiraAberta=false;
      if(!f&&!x.livre)li.className="agora";
      const a=document.createElement("span"),b=document.createElement("span");
      a.textContent=x.conceito;b.textContent=f?"★".repeat(f.e)+"☆".repeat(3-f.e):x.livre?"livre":"agora";
      li.append(a,b);lista.append(li);
    }
  }
  $("#controles").hidden=!(S.up.teclado&&TOQUE)||!!m;
  $("#btGolpe").hidden=!S.up.espada;
  renderManual();atualizaBotoes();atualizaMemoria();
}
function renderManual(){
  const nivel=G.missao?G.missao.i:MISSOES.reduce((a,m)=>S.feitas[m.id]?Math.max(a,m.i+1):a,0),b=$("#manual");
  b.textContent="";
  for(const e of MANUAL){
    if(e.d>nivel)continue;
    const d=document.createElement("div");d.className="ent";
    const c=document.createElement("code");c.textContent=e.s;
    const p=document.createElement("span");p.textContent=e.t;
    d.append(c,p);b.append(d);
  }
}
function insereChip({t,inline,troca,topo}){
  const v=ed.value,pos=ed.selectionStart;
  if(troca){ed.value=t;aoEditar();return}
  if(inline){ed.setRangeText(t,pos,ed.selectionEnd,"end");aoEditar();return}
  const recuoDepois=l=>(l.match(/^ */)||[""])[0]+(l.trim().endsWith(":")?"    ":"");
  const ini=v.lastIndexOf("\n",pos-1)+1;
  let fim=v.indexOf("\n",pos);if(fim<0)fim=v.length;
  const lin=v.slice(ini,fim),vazia=!lin.trim(),ant=v.slice(0,Math.max(0,ini-1)),pl=ant.slice(ant.lastIndexOf("\n")+1);
  let r=topo?"":vazia?(lin.length?lin:recuoDepois(pl)):recuoDepois(lin);
  if(/^(else|elif)\b/.test(t)){
    const ls=v.slice(0,fim).split("\n");
    for(let i=ls.length-1;i>=0;i--)if(/^ *(if|elif)\b/.test(ls[i])){r=ls[i].match(/^ */)[0];break}
  }
  if(vazia)ed.setRangeText(r+t,ini,fim,"end");
  else ed.setRangeText("\n"+r+t,fim,fim,"end");
  aoEditar();
}
function aoEditar(){
  G.linhaErro=0;
  if(G.missao)S.codigos[G.missao.id]=ed.value;
  atualizaEditor();
}
function abrirMissao(m){
  G.missao=m;G.modo="edit";G.dicasUsadas=0;G.falhas=0;G.ultimo="";G.proxima=null;
  if(m.sala!=null&&!m.livre)preparaSala(m);
  ed.value=S.codigos[m.id]??m.inicial;
  G.linhaErro=0;limpaSaida();
  renderPainel();atualizaEditor();abaAtiva("saida");
  const p=S.codigos[m.id]!=null?ed.value.length:(m.cursor??ed.value.length);
  ed.setSelectionRange(p,p);
  if(!TOQUE)ed.focus({preventScroll:true});
  if(m.id==="melodia")demonstraMelodia();
}
function fecharEditor(){
  if(!G.missao||G.rodando||!S.up.teclado)return;
  const m=G.missao;
  G.missao=null;G.modo="explora";
  if(!m.livre){const[x,y]=[G.heroi.x,G.heroi.y];carregaSala(G.iSala);poeHeroi(x,y)}
  renderPainel();ed.blur();
}
function darDica(){
  const m=G.missao;
  if(!m)return;
  if(G.dicasUsadas>=m.dicas.length){saida(m.dicas[m.dicas.length-1],"dica");return}
  const d=m.dicas[G.dicasUsadas++];
  saida(d,"dica");fala(d.split("\n")[0]);
  $("#btDica").textContent=`Dica ${G.dicasUsadas}/${m.dicas.length}`;
  $("#btDica").classList.remove("chama");
}
function montaEras(){
  const ol=$("#eras");ol.textContent="";
  ERAS.forEach((e,i)=>{
    const li=document.createElement("li"),b=document.createElement("button"),ok=i<=S.era;
    b.type="button";b.disabled=!ok||G.modo==="run"||(i===0&&!!G.t);
    b.className=i===G.eraVista?"atual":"";
    b.setAttribute("aria-label",ok?`Ver o jogo em ${e.nome}, ${e.ano}`:"Era ainda não destravada");
    const a=document.createElement("small"),n=document.createElement("span");
    a.textContent=ok?e.ano:"····";n.textContent=ok?e.nome:"???";
    b.append(a,n);
    b.onclick=()=>{if(i!==G.eraVista&&!G.wipe&&!G.rodando&&G.t){mudaEra(i).then(montaEras);montaEras()}};
    li.append(b);ol.append(li);
  });
}
function aplicaTema(){document.documentElement.dataset.era=ERAS[G.eraVista].id;montaEras()}
function atualizaPlacar(){
  const t=Object.values(S.feitas).reduce((a,f)=>a+f.e,0);
  $("#estrelas").textContent=`★ ${t}/39`;
}

/* ---------- Pedir ajuda ao Bit, quando quem abre a página permite usar o Claude ---------- */
let perguntar=null,ctlBit=null;
async function ligaBit(){
  try{
    if(!window.claude||!window.claude.use)return;
    perguntar=await window.claude.use("sample");
    $("#btBit").hidden=!perguntar;
  }catch{}
}
async function perguntaAoBit(){
  const m=G.missao;
  if(!m||!perguntar)return;
  if(ctlBit){ctlBit.abort();return}
  const obj=m.texto.replace(/<[^>]+>/g," ").replace(/\s+/g," ").trim().slice(0,900);
  const p=`Você é o Bit, um pequeno cursor amigável, tutor dentro do jogo Compilândia, que ensina Python para iniciantes em português do Brasil.
Responda em no máximo 3 frases curtas, sem listas, sem markdown e sem cumprimentos. Dê uma pista que faça a pessoa pensar. Nunca escreva o programa completo. Pode citar um comando ou uma linha do código dela. Se houver erro, explique a causa em palavras simples.
Missão: ${m.titulo} (conceito: ${m.conceito}).
Objetivo: ${obj}
Dicas prontas, que mostram a solução esperada e não devem ser reveladas diretamente: ${m.dicas.join(" | ").slice(0,700)}
Código atual:
${ed.value.slice(0,1500)}
Último resultado: ${G.ultimo||"ainda não executou ou não houve erro"}`;
  const bt=$("#btBit"),rot=bt.textContent;
  ctlBit=new AbortController();bt.textContent="Parar resposta";
  const d=document.createElement("div");d.className="ln bit";d.textContent="Pensando...";
  abaAtiva("saida");out.append(d);out.scrollTop=out.scrollHeight;
  try{
    await perguntar(p,{modelTier:"quick",signal:ctlBit.signal,onText:({text})=>{d.textContent=text;out.scrollTop=out.scrollHeight}});
  }catch(e){
    if(e&&e.code==="cancelled"){d.textContent=e.text||"Resposta cancelada."}
    else if(e&&["not_granted","sampling_disabled","not_declared","capability_disabled","capability_removed"].includes(e.code)){d.textContent="Esta pergunta ao Claude não foi permitida. As dicas do jogo continuam funcionando.";bt.hidden=true}
    else if(e&&e.code==="rate_limited")d.textContent=e.text||"Muitas perguntas por agora. Tente de novo daqui a pouco.";
    else d.textContent=(e&&e.text)||"Não consegui responder agora. Tente de novo.";
  }
  ctlBit=null;bt.textContent=rot;
}

/* ---------- Salvar: no navegador sempre, e na conta quando disponível ---------- */
const CHAVE="compilandia-v1";
let docNuvem=null,tNuvem=null;
function salvar(){
  S.em=Date.now();
  if(G.auto)return;
  try{localStorage.setItem(CHAVE,JSON.stringify(S))}catch{}
  if(docNuvem){
    clearTimeout(tNuvem);
    tNuvem=setTimeout(()=>{docNuvem.set({em:S.em,estado:JSON.stringify(S)}).catch(()=>{})},800);
  }
}
function lerLocal(){
  try{const r=JSON.parse(localStorage.getItem(CHAVE));if(r&&r.v===1)return{...novoSave(),...r}}catch{}
  return null;
}
async function ligaNuvem(){
  try{
    if(!window.claude||!window.claude.use)return;
    const[db,user]=await Promise.all([window.claude.use("db"),window.claude.use("user")]);
    if(!db||!user)return;
    const id=await user.id();
    if(!id)return;
    docNuvem=db.doc(`data/users/${id}/save`);
    const s=await docNuvem.get();
    if(s.exists){
      const d=s.data(),r=JSON.parse(d.estado);
      if(r&&r.v===1&&d.em>S.em&&!G.rodando){S={...novoSave(),...r};retoma()}
    }
  }catch{}
}
function retoma(){
  G.eraVista=S.era;G.p3=ERAS[S.era].id==="3d"?1:0;G.p3Alvo=G.p3;G.vida=G.vidaMax=5;
  restauraGolpe();aplicaTema();atualizaPlacar();
  if(!S.feitas.ola){G.t=null;G.sala=null;abrirMissao(MISSOES[0]);return}
  if(!S.feitas.passos){carregaSala(0,true);abrirMissao(MISSOES[1]);return}
  carregaSala(S.sala);poeHeroi(...pontoInicial());
  G.missao=null;G.modo="explora";
  renderPainel();anunciaSala();
}

/* ---------- Laço principal ---------- */
function atualiza(dt){
  G.tempo+=dt;
  const H=G.heroi;
  if(G.wipe){G.wipe.t+=dt;if(G.wipe.t>=G.wipe.dur){const f=G.wipe.fim;G.wipe=null;f&&f()}}
  if(G.slide){G.slide.t+=dt;if(G.slide.t>=G.slide.dur)G.slide=null}
  if(G.p3!==G.p3Alvo){const d=dt/3;G.p3=G.p3<G.p3Alvo?Math.min(G.p3Alvo,G.p3+d):Math.max(G.p3Alvo,G.p3-d)}
  const dx=H.x-H.vx,dy=H.y-H.vy,dist=Math.hypot(dx,dy);
  if(dist>0){const s=H.vel*dt;if(s>=dist){H.vx=H.x;H.vy=H.y}else{H.vx+=dx/dist*s;H.vy+=dy/dist*s}}
  if(H.pulo){H.pulo.t+=dt;const a=H.pulo.t/H.pulo.d;H.z=a>=1?0:Math.sin(a*Math.PI)*.9;if(a>=1)H.pulo=null}
  if(H.cai>0){H.cai-=dt;H.esc=Math.max(.05,H.esc-dt*2.4)}
  for(const e of G.inimigos){const a=e.x-e.vx,b=e.y-e.vy,d=Math.hypot(a,b);if(d>.01){const s=Math.min(d,5*dt);e.vx+=a/d*s;e.vy+=b/d*s}else{e.vx=e.x;e.vy=e.y}}
  if(G.modo==="combate")atualizaCombate(dt);
  if((G.modo==="explora"||G.modo==="combate")&&S.up.teclado&&!G.slide&&!G.golpeAtivo&&Math.hypot(H.x-H.vx,H.y-H.vy)<.01){
    const k=[...G.teclas].pop()||G.proxima;
    G.proxima=null;
    if(k)tentaAndar(k);
  }
  if(G.chefe&&G.chefe.hit>0)G.chefe.hit-=dt;
  G.imune=Math.max(0,G.imune-dt);
  G.tremor=Math.max(0,G.tremor-dt*30);
  for(const k in G.pilaresAcesos)G.pilaresAcesos[k]-=dt;
  for(const c of G.cortes)c.t+=dt;
  G.cortes=G.cortes.filter(c=>c.t<.16);
  for(const q of G.tiros)q.t+=dt;
  G.tiros=G.tiros.filter(q=>q.t<q.dur);
  for(const q of G.parts){q.x+=q.dx*dt;q.y+=q.dy*dt;q.dz-=9*dt;q.z=Math.max(0,q.z+q.dz*dt);q.v-=dt}
  G.parts=G.parts.filter(q=>q.v>0);
}
let ultT=0;
function quadro(t){
  const dt=Math.min(.05,(t-ultT)/1000||0);ultT=t;
  atualiza(dt);desenha();
  requestAnimationFrame(quadro);
}

/* ---------- Eventos ---------- */
const TECLAS={ArrowUp:"cima",ArrowDown:"baixo",ArrowLeft:"esquerda",ArrowRight:"direita",w:"cima",s:"baixo",a:"esquerda",d:"direita",W:"cima",S:"baixo",A:"esquerda",D:"direita"};
ed.addEventListener("input",aoEditar);
ed.addEventListener("scroll",sincroniza);
ed.addEventListener("keydown",e=>{
  if((e.ctrlKey||e.metaKey)&&e.key==="Enter"){e.preventDefault();$("#btRodar").click();return}
  if(e.key==="Escape"){fecharEditor();return}
  if(ed.readOnly)return;
  const v=ed.value,p=ed.selectionStart,q=ed.selectionEnd,ini=v.lastIndexOf("\n",p-1)+1;
  if(e.key==="Tab"){
    e.preventDefault();
    if(e.shiftKey){
      const n=Math.min(4,(v.slice(ini).match(/^ */)||[""])[0].length);
      if(n){ed.setRangeText("",ini,ini+n,"preserve");aoEditar()}
    }else{ed.setRangeText("    ",p,q,"end");aoEditar()}
  }else if(e.key==="Enter"){
    e.preventDefault();
    const lin=v.slice(ini,p);
    let r=(lin.match(/^ */)||[""])[0];
    if(lin.trim().endsWith(":"))r+="    ";
    ed.setRangeText("\n"+r,p,q,"end");aoEditar();
  }else if(e.key==="Backspace"&&p===q&&p>ini&&/^ +$/.test(v.slice(ini,p))&&(p-ini)%4===0){
    e.preventDefault();ed.setRangeText("",p-4,p,"end");aoEditar();
  }
});
addEventListener("keydown",e=>{
  if(e.target===ed)return;
  if(!$("#evolucao").hidden||!$("#menu").hidden)return;
  const k=TECLAS[e.key];
  if(k&&(G.modo==="explora"||G.modo==="combate")){e.preventDefault();G.teclas.delete(k);G.teclas.add(k);if(!e.repeat)G.proxima=k;Som.liga();return}
  if(e.key===" "&&(G.modo==="explora"||G.modo==="combate")){e.preventDefault();disparaGolpe();return}
  if(e.key==="Enter"&&G.modo==="explora"){const[a,b]=DIRS[G.heroi.dir];if(tileEm(G.heroi.x+a,G.heroi.y+b)==="M"){e.preventDefault();abreTerminal()}return}
  if(ERAS[G.eraVista].id==="3d"){if(e.key==="q"||e.key==="Q")G.yaw=Math.max(-1.2,G.yaw-.2);if(e.key==="e"||e.key==="E")G.yaw=Math.min(1.2,G.yaw+.2)}
});
addEventListener("keyup",e=>{const k=TECLAS[e.key];if(k)G.teclas.delete(k)});
addEventListener("blur",()=>G.teclas.clear());
$("#cv").addEventListener("click",()=>{if(G.modo==="edit"&&S.up.teclado)fecharEditor()});
for(const b of document.querySelectorAll("[data-k]")){
  const k=b.dataset.k;
  b.addEventListener("pointerdown",e=>{e.preventDefault();G.teclas.add(k);G.proxima=k;Som.liga()});
  for(const ev of["pointerup","pointerleave","pointercancel"])b.addEventListener(ev,()=>G.teclas.delete(k));
}
$("#btGolpe").addEventListener("pointerdown",e=>{e.preventDefault();disparaGolpe()});
$("#btRodar").onclick=()=>{
  if(G.rodando){G.abortar=true;G.continuar&&G.continuar();return}
  executar(false);
};
$("#btPasso").onclick=()=>{
  if(G.rodando){G.continuar&&G.continuar();return}
  executar(true);
};
$("#btDica").onclick=darDica;
$("#btBit").onclick=perguntaAoBit;
$("#btFechar").onclick=fecharEditor;
$("#btTerminal").onclick=()=>{Som.liga();abreTerminal()};
$("#btClock").onclick=e=>{G.clock=G.clock>=4?1:G.clock*2;e.target.textContent=`Clock ${G.clock}×`};
$("#btSom").onclick=e=>{Som.mudo=!Som.mudo;Som.liga();e.target.textContent=Som.mudo?"Som desligado":"Som ligado"};
for(const b of document.querySelectorAll(".aba"))b.onclick=()=>abaAtiva(b.dataset.aba);
$("#btMenu").onclick=()=>{$("#menu").hidden=false;$("#btZerar").textContent="Recomeçar do zero";$("#btVoltar").focus()};
$("#btVoltar").onclick=()=>{$("#menu").hidden=true};
$("#btZerar").onclick=e=>{
  if(e.target.textContent!=="Sim, apagar meu progresso"){e.target.textContent="Sim, apagar meu progresso";return}
  S=novoSave();S.em=Date.now();
  G.tty=["COMPILANDIA/OS  1963","MEMORIA: 1 LINHA","MUNDO: NAO ENCONTRADO","",">"];
  G.golpeFn=null;salvar();$("#menu").hidden=true;retoma();
};

/* ---------- Início ---------- */
function iniciar(){
  S=lerLocal()||novoSave();
  G.g=$("#cv").getContext("2d");
  retoma();
  if(!S.feitas.passos||!G.missao&&salaFeita(G.iSala))fala(S.feitas.ola?"Que bom ver você de novo.":"Oi, eu sou o Bit. Vamos acordar esta máquina?");
  requestAnimationFrame(quadro);
  ligaNuvem();ligaBit();
  try{window.claude?.hot?.snapshot?.(()=>({}))}catch{}
}
window.__c={G,get S(){return S},MISSOES,abrirMissao,executar,disparaGolpe,mudaEra,carregaSala,poeHeroi,retoma,tileEm,tique(n=1,dt=.05){for(let i=0;i<n;i++)atualiza(dt);desenha()}};
if(window.claude?.hot?.ready)window.claude.hot.ready(iniciar);else iniciar();
