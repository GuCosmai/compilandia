// Cole no console da página: resolve todas as missões em ordem, com programas certos e errados.
(async()=>{
  const {G,MISSOES,abrirMissao,executar,disparaGolpe}=window.__c,S=()=>window.__c.S;
  const ed=document.querySelector("#code"),log=[];
  G.auto=true;G.clock=1000;
  const id=n=>MISSOES.find(m=>m.id===n);
  const rodar=async(n,codigo)=>{
    abrirMissao(id(n));ed.value=codigo;ed.dispatchEvent(new Event("input"));
    await executar();
    return{feita:!!S().feitas[n],modo:G.modo,msg:document.querySelector("#saida").textContent.slice(-120)};
  };
  const certo=async(n,c)=>{const r=await rodar(n,c);log.push((r.feita||G.modo==="combate"?"ok  ":"FALHOU ")+n+(r.feita?"":" | "+r.msg));return r};
  const errado=async(n,c,trecho)=>{
    const antes=!!S().feitas[n],r=await rodar(n,c);
    const bom=!antes&&!r.feita&&r.msg.includes(trecho);
    log.push((bom?"ok  ":"FALHOU ")+n+" recusou: "+trecho+(bom?"":" | "+r.msg));
    if(G.rodando)G.abortar=true;
  };
  // Teletipo
  await errado("ola",'print("")',"vazio");
  await errado("ola",'print("a")\nprint("b")',"Sem memória");
  await certo("ola",'print("Olá, mundo")');
  // Sequência
  await errado("passos","direita()\ndireita()","caiu");
  await errado("passos","baixo()","caiu");
  await errado("passos","direita()","não chegou");
  await certo("passos","direita()\nbaixo()\nbaixo()\ndireita()\ndireita()\ndireita()");
  G.modo="explora";
  // for
  await errado("corredor","for i in range(5):\n    direita()","não chegou");
  await certo("corredor","for i in range(13):\n    direita()");
  // Escada
  await errado("escada","for i in range(6):\n    baixo()\n    direita()","caiu");
  await certo("escada","for i in range(6):\n    direita()\n    baixo()");
  // Variáveis
  await errado("criacao",'nome = ""\ncor = "azul"\nvelocidade = 1',"nome");
  await errado("criacao",'nome = "A"\ncor = vermelho\nvelocidade = 1',"aspas");
  await errado("criacao",'nome = "A"\ncor = "azul"\nvelocidade = "2"',"velocidade");
  await certo("criacao",'nome = "Ana"\ncor = "laranja"\nvelocidade = 3');
  // Acumular
  await errado("cofre","total = 0\nfor i in range(6):\n    esquerda()\nabrir_cofre(total)","o programa mandou");
  await errado("cofre","esquerda()\nabrir_cofre(1)","ao lado");
  await certo("cofre","total = 0\nfor i in range(6):\n    esquerda()\n    total = total + pegar()\nabrir_cofre(total)");
  // if (buracos mudam: repete para pegar várias distribuições)
  await errado("buracos","for i in range(13):\n    esquerda()","caiu");
  // Os botões de comando precisam montar um programa com o recuo certo
  abrirMissao(id("buracos"));ed.value="";ed.dispatchEvent(new Event("input"));
  const clica=t=>[...document.querySelectorAll("#chips button")].find(b=>b.textContent===t).click();
  for(const t of["for i in range(5):",'if olhar("esquerda") == "buraco":','pular("esquerda")',"else:","esquerda()"])clica(t);
  const esperado='for i in range(5):\n    if olhar("esquerda") == "buraco":\n        pular("esquerda")\n    else:\n        esquerda()';
  log.push((ed.value===esperado?"ok  ":"FALHOU ")+"chips montam if/else: "+(ed.value===esperado?"":JSON.stringify(ed.value)));
  const prog='for i in range(13):\n    if olhar("esquerda") == "buraco":\n        pular("esquerda")\n    else:\n        esquerda()';
  for(let i=0;i<25;i++){const r=await rodar("buracos",prog);if(!r.feita){log.push("FALHOU buracos #"+i+" "+r.msg);break}delete S().feitas.buracos;G.modo="edit"}
  await certo("buracos",prog);
  // while
  const w='while livre("direita"):\n    direita()\nwhile livre("baixo"):\n    baixo()';
  for(let i=0;i<25;i++){const r=await rodar("desconhecido",w);if(!r.feita){log.push("FALHOU while #"+i+" "+r.msg);break}delete S().feitas.desconhecido;G.modo="edit"}
  await certo("desconhecido",w);
  // def
  await errado("golpe",'def golpe():\n    atacar("direita")\n\ngolpe()',"1 de 4");
  await errado("golpe",'def golpe():\n    atacar("direita")\n    atacar("cima")\n    atacar("baixo")',"não acertou");
  await certo("golpe",'def golpe():\n    atacar("cima")\n    atacar("direita")\n    atacar("baixo")\n    atacar("esquerda")\n\ngolpe()');
  log.push("combate iniciou: "+(G.modo==="combate"));
  log.push("gosmas: "+G.inimigos.filter(e=>!e.morta).length);
  // Coloca as gosmas em volta do herói e dispara o golpe escrito pelo jogador
  const[hx,hy]=[G.heroi.x,G.heroi.y];
  G.inimigos=[[hx,hy-1],[hx+1,hy],[hx,hy+1],[hx-1,hy]].map(([x,y])=>({x,y,vx:x,vy:y,t:9,fase:0,dano:0,morta:false}));
  await disparaGolpe();
  log.push("depois do golpe, vivas: "+G.inimigos.filter(e=>!e.morta).length);
  window.__c.tique(3);await new Promise(r=>setTimeout(r,100));
  log.push((S().feitas.golpe?"ok  ":"FALHOU ")+"golpe concluído após combate");
  // Parâmetros
  await errado("pontes",'for i in range(3):\n    direita()',"caiu");
  await errado("pontes",'construir("cima")',"não há água");
  await certo("pontes",'def ponte(n):\n    for i in range(n):\n        construir("direita")\n        direita()\n    direita()\n    baixo()\n\nponte(3)\nponte(5)\nponte(2)');
  // Listas
  await errado("melodia",'melodia = ["do", "mi", "sol", "mi"]\nfor nota in melodia:\n    tocar(nota)',"pelo menos 8");
  await errado("melodia",'melodia = ["re", "mi", "sol", "mi", "la", "la", "la", "la"]\nfor nota in melodia:\n    tocar(nota)',"4 primeiras");
  await errado("melodia",'melodia = ["do", "mi", "sol", "mi", "la", "sol", "fa", "re"]',"nota por nota");
  await certo("melodia",'melodia = ["do", "mi", "sol", "mi", "la", "sol", "fa", "re"]\nfor nota in melodia:\n    tocar(nota)');
  // Depuração: o código inicial deve falhar e cada conserto muda o erro
  const b0=id("bugs").inicial;
  await errado("bugs",b0,"Faltou");
  let b=b0.replace("while passos < 5\n","while passos < 5:\n");
  await errado("bugs",b,"comparar");
  b=b.replace('= "buraco"','== "buraco"');
  await errado("bugs",b,"Faltou");
  b=b.replace("else\n","else:\n");
  await errado("bugs",b,"passo");
  b=b.replace("passo + 1","passos + 1");
  const r5=await rodar("bugs",b);log.push("com 2 defeitos restantes: "+r5.msg.slice(-60));
  b=b.replace('pular("direita")','pular("esquerda")').replace("passos < 5","passos < 11");
  await certo("bugs",b);
  // Chefe
  const inicialChefe=id("chefe").inicial;
  abrirMissao(id("chefe"));delete S().codigos.chefe;abrirMissao(id("chefe"));
  for(const t of['elif e == "agua":','return "planta"',"else:",'return "fogo"'])[...document.querySelectorAll("#chips button")].find(b=>b.textContent===t).click();
  const c1=ed.value.split("\n").slice(3,8).join("|");
  const c1ok=c1==='    # falta: agua e planta|    elif e == "agua":|        return "planta"|    else:|        return "fogo"';
  log.push((c1ok?"ok  ":"FALHOU ")+"chips no chefe: "+(c1ok?"":c1));
  await errado("chefe",inicialChefe,"");
  const semCura='def contra(e):\n    if e == "fogo":\n        return "agua"\n    elif e == "agua":\n        return "planta"\n    else:\n        return "fogo"\n\nwhile chefe_vivo():\n    magia(contra(escudo()))';
  await errado("chefe",semCura,"corações");
  const final='def contra(e):\n    if e == "fogo":\n        return "agua"\n    elif e == "agua":\n        return "planta"\n    else:\n        return "fogo"\n\nwhile chefe_vivo():\n    if vida() < 2:\n        curar()\n    else:\n        magia(contra(escudo()))';
  await certo("chefe",final);
  log.push("era final: "+S().era+" vista "+G.eraVista+" estrelas "+Object.values(S().feitas).reduce((a,f)=>a+f.e,0));
  // Modo Criador
  abrirMissao(id("criador"));ed.value=id("criador").inicial;ed.dispatchEvent(new Event("input"));await executar();
  log.push("criador pintou água: "+(G.t[7][5]==="~")+" | saída: "+document.querySelector("#saida").textContent.slice(-40));
  G.auto=false;G.clock=1;
  window.__resultado=log;
})().catch(e=>{window.__resultado=["EXCEÇÃO "+(e&&e.message)+" "+(e&&e.stack)]});
"iniciado"
