/* ---------- Mundo: salas de 16x10, ligadas como um tabuleiro ----------
   # parede  T árvore  ~ água  % corrompido (só o código atravessa)  . chão
   S início do programa  M terminal  C baú  D porta  V cofre  N pilar  O buraco  = tábua */
const SALAS=[
{gx:0,gy:0,bio:"campo",mapa:[
"################",
"#TT..........TT#",
"#T..~~~~~~~..M.#",
"#...~S%~~~~....#",
"#...~~%~~~~....#",
"#...~~%%%C.....D",
"#...~~~~~~~....#",
"#T..~~~~~~~...T#",
"#TT..........TT#",
"################"]},
{gx:1,gy:0,bio:"campo",mapa:[
"################",
"#TTT~~~~~~~~TTT#",
"#T~~~~~~~~~~~~T#",
"#~~~~~~~~~~~~~~#",
"#M~~~~~~~~~~~~.#",
".S%%%%%%%%%%%%CD",
"#.~~~~~~~~~~~~.#",
"#~~~~~~~~~~~~~~#",
"#TTT~~~~~~~~TTT#",
"################"]},
{gx:2,gy:0,bio:"campo",mapa:[
"################",
"#.S%~~~~~~~~~~~#",
"#M.%%~~~~~~~~~~#",
"#..~%%~~~~~~~~~#",
"#..~~%%~~~~~~~~#",
"...~~~%%~~~~~~~#",
"#..~~~~%%~~~~~~#",
"#..~~~~~C......#",
"#..~~~~~.......#",
"########D#######"]},
{gx:2,gy:1,bio:"mata",bau:[9,4],mapa:[
"########.#######",
"#TT.........TT.#",
"#T............T#",
"#..............#",
"#.....M........#",
"D..............#",
"#..............#",
"#T............T#",
"#TT..........TT#",
"################"]},
{gx:1,gy:1,bio:"mata",mapa:[
"################",
"#TT...~~~~~~..T#",
"#.....~~~~~~...#",
"#.....~~~~~~...#",
"#.....~~~~~~.M.#",
"D.....V%%%%%%S..",
"#.....~~~~~~...#",
"#.....~~~~~~...#",
"#TT...~~~~~~..T#",
"################"]},
{gx:0,gy:1,bio:"mata",mapa:[
"################",
"#TT~~~~~~~~~~TT#",
"#~~~~~~~~~~~~~~#",
"#~~~~~~~~~~~~~.#",
"#~~~~~~~~~~~~M.#",
"#C%%%%%%%%%%%%S.",
"#..~~~~~~~~~~~~#",
"#..~~~~~~~~~~~~#",
"#.........~~~~~#",
"########D#######"]},
{gx:0,gy:2,bio:"deserto",mapa:[
"########.#######",
"#..............#",
"#..~~~~~~~~~~~.#",
"#MS%%%%%%%%~~~.#",
"#..~~~~~~~%~~~.#",
"#..~~~~~~~%~~~.D",
"#..~~~~~~~C~~~.#",
"#..~~~~~~~~~~~.#",
"#..............#",
"################"]},
{gx:1,gy:2,bio:"deserto",bau:[8,3],mapa:[
"################",
"#T............T#",
"#.M............#",
"#....#....#....#",
"#..............#",
".......S.......D",
"#..............#",
"#....#....#....#",
"#T............T#",
"################"]},
{gx:2,gy:2,bio:"deserto",pontes:[[2,3],[3,3],[4,3],[6,4],[7,4],[8,4],[9,4],[10,4],[12,5],[13,5]],mapa:[
"################",
"#..~~~~~~~~~~~~#",
"#.M~~~~~~~~~~~~#",
"#S~~~.~~~~~~~~~#",
"#..~~.~~~~~.~~~#",
"...~~~~~~~~.~~C#",
"#..~~~~~~~~~~~.#",
"#..~~~~~~~~~~~.#",
"#..~~~~~.......#",
"########D#######"]},
{gx:2,gy:3,bio:"cristal",bau:[8,7],mapa:[
"########.#######",
"#T............T#",
"#..............#",
"#...NNNNNNN....#",
"#..............#",
"D......M.......#",
"#..............#",
"#..............#",
"#T............T#",
"################"]},
{gx:1,gy:3,bio:"cristal",mapa:[
"################",
"#~~~~~~~~~~~~~~#",
"#~~~~~~~~~~~~~~#",
"#~~~~~~~~~~~~~.#",
"#..~~~~~~~~~~M.#",
"D.C%%%%%%%%%%S..",
"#..~~~~~~~~~~~.#",
"#~~~~~~~~~~~~~~#",
"#~~~~~~~~~~~~~~#",
"################"]},
{gx:0,gy:3,bio:"nucleo",mapa:[
"################",
"#T............T#",
"#..............#",
"#............M.#",
"#..............#",
"#............S..",
"#..............#",
"#..............#",
"#T............T#",
"################"]},
];
const CORES={vermelho:"#e0342c",azul:"#2c6fe0",verde:"#2fb84a",amarelo:"#f2c32c",roxo:"#9a3fd8",laranja:"#f0802c",rosa:"#f25fa8",ciano:"#28d0e0",branco:"#f0f0f0"};
const NOTAS={do:261.63,re:293.66,mi:329.63,fa:349.23,sol:392,la:440,si:493.88};
const CHAVE_MELODIA=["do","mi","sol","mi"];
const VENCE={fogo:"agua",agua:"planta",planta:"fogo"};

const MISSOES=[
{id:"ola",era:"tty",titulo:"Olá, mundo",conceito:"Comandos",memoria:1,par:1,cursor:7,
 texto:`<p>O Grande Bug apagou Compilândia. Sobrou este teletipo e eu, o Bit.</p><p>Para acordar a máquina, mande ela escrever alguma coisa. O comando <code>print</code> escreve na tela, e o texto vai entre aspas. Escreva algo entre as aspas e execute.</p>`,
 inicial:`print("")`,chips:[{t:`print("Olá, mundo")`,troca:true}],
 dicas:["Clique entre as duas aspas e digite o que quiser.","O comando completo pode ser assim: print(\"Olá, mundo\")","Clique no botão com o texto pronto logo abaixo do editor e depois em Executar."],
 confere(c){return c.impressos.some(t=>t.trim())?{ok:true}:{ok:false,msg:"A máquina escreveu um texto vazio. Coloque alguma palavra entre as aspas."}},
 ganha:{era:1,titulo:"ASCII",texto:"A máquina acordou. Agora existe um mundo, feito só de letras e símbolos.",aprendeu:"Um programa é uma lista de ordens escritas para a máquina."},
 depois:"Olha só: um mundo de letras. O @ é você."},
{id:"passos",sala:0,titulo:"Primeiros passos",conceito:"Sequência",memoria:8,par:6,
 texto:`<p>O <code>@</code> é o seu herói e o teclado ainda não funciona: aqui quem anda é o código.</p><p>A máquina lê de cima para baixo, uma linha por vez. Leve o herói pelo trecho corrompido até o baú <code>$</code>.</p><p>Clique nos comandos abaixo para escrever mais rápido.</p>`,
 inicial:`direita()\n`,chips:["direita()","baixo()","esquerda()","cima()"],
 dicas:["O trecho corrompido é a trilha de símbolos que muda sozinha. Siga por ela.","O herói dá um passo à direita e depois desce duas vezes.","direita, baixo, baixo, direita, direita, direita."],
 ganha:{up:["teclado"],titulo:"Teclado",texto:"Setas ou WASD agora movem o herói. Trechos corrompidos continuam aceitando só código.",aprendeu:"A ordem das linhas é a ordem em que tudo acontece."},
 depois:"Agora você anda sozinho. Saia pela porta à direita."},
{id:"corredor",sala:1,titulo:"O corredor de 13 passos",conceito:"Repetição com for",memoria:3,par:2,
 texto:`<p>O baú está a 13 passos, e esta memória antiga guarda só 3 linhas. Não cabe escrever <code>direita()</code> treze vezes.</p><p>O <code>for</code> repete as linhas que estão abaixo dele, com recuo de 4 espaços:</p><pre>for i in range(4):\n    print("oi")</pre><p>Isso escreve <code>oi</code> quatro vezes.</p>`,
 inicial:``,chips:["for i in range(5):","direita()"],
 dicas:["Você precisa de duas linhas: o for e a ordem que ele repete.","O número dentro de range() é quantas vezes o bloco repete. Conte os passos até o baú.","for i in range(13):\n    direita()"],
 ganha:{era:2,up:["linhas"],titulo:"Pixels em 1 bit",texto:"As letras viraram pontos. O editor também evoluiu e ganhou números de linha.",aprendeu:"Quando algo se repete, deixe a máquina repetir."},
 depois:"Pixels! Cada um só sabe ser preto ou branco, mas já é um mundo."},
{id:"escada",sala:2,titulo:"A escada",conceito:"Blocos com várias linhas",memoria:3,par:3,
 texto:`<p>Um <code>for</code> pode repetir mais de uma linha. Tudo que tem o mesmo recuo faz parte do mesmo bloco.</p><pre>for i in range(2):\n    print("um")\n    print("dois")\nprint("fim")</pre><p>Isso escreve um, dois, um, dois e, no final, fim. Desça a escada até o baú.</p>`,
 inicial:``,chips:["for i in range(5):","direita()","baixo()"],
 dicas:["Cada degrau é sempre o mesmo par de movimentos.","Um degrau é direita() seguido de baixo(). Conte quantos degraus há.","for i in range(6):\n    direita()\n    baixo()"],
 ganha:{era:3,up:["sintaxe","som"],titulo:"4 tons e som",texto:"Quatro tons de verde, efeitos sonoros e cores no código: cada tipo de palavra agora aparece de um jeito.",aprendeu:"O recuo define o que está dentro do bloco."},
 depois:"Quatro tons e até um beep. Estamos ficando chiques. Desça pela porta."},
{id:"criacao",sala:3,titulo:"Quem é você?",conceito:"Variáveis",memoria:3,par:3,
 texto:`<p>Uma variável é um nome que guarda um valor. O motor do jogo lê estas três:</p><pre>nome = "Sofia"\ncor = "azul"\nvelocidade = 2</pre><p>Texto vai entre aspas e número vai sem aspas. Mude para os valores que você quiser.</p><p><strong>Cores:</strong> vermelho, azul, verde, amarelo, roxo, laranja, rosa, ciano, branco. <strong>Velocidade:</strong> de 1 a 5.</p>`,
 inicial:`nome = ""\ncor = ""\nvelocidade = 1\n`,chips:[],cursor:8,
 dicas:["Escreva o seu nome entre as aspas da primeira linha.","cor precisa ser uma das palavras da lista, entre aspas e sem acento.","nome = \"Ana\"\ncor = \"verde\"\nvelocidade = 3"],
 confere(c,I){
   const n=I.glob.get("nome"),k=I.glob.get("cor"),v=I.glob.get("velocidade");
   if(typeof n!=="string"||!n.trim())return{ok:false,msg:"A variável nome precisa guardar um texto. Escreva seu nome entre aspas."};
   if(typeof k!=="string"||!CORES[k])return{ok:false,msg:`“${k??""}” não é uma cor que eu conheço. Use uma da lista, entre aspas.`};
   if(typeof v!=="number"||v<1||v>5)return{ok:false,msg:"A variável velocidade precisa ser um número de 1 a 5, sem aspas."};
   S.nome=n.trim().slice(0,12);S.cor=k;S.vel=v;
   return{ok:true};
 },
 ganha:{up:["variaveis"],titulo:"Sua primeira cor",texto:"O herói é a única coisa colorida do mundo, e a velocidade que você escolheu já vale. A aba Variáveis mostra a memória do programa enquanto ele roda.",aprendeu:"Uma variável guarda um valor com um nome."},
 depois:"Prazer em conhecer você! Siga pela porta à esquerda."},
{id:"cofre",sala:4,titulo:"O cofre de moedas",conceito:"Acumular valores",memoria:6,par:5,
 texto:`<p>Cada pilha tem uma quantidade de moedas, e os valores mudam a cada execução. Por isso, contar de cabeça não adianta.</p><p><code>pegar()</code> recolhe a pilha onde o herói está e <strong>devolve</strong> quantas moedas havia. Some tudo em uma variável:</p><pre>total = 0\ntotal = total + pegar()</pre><p>No fim, ao lado do cofre, use <code>abrir_cofre(total)</code>.</p>`,
 inicial:`total = 0\n`,chips:["esquerda()","total = total + pegar()","for i in range(5):","abrir_cofre(total)"],
 dicas:["São 6 pilhas seguidas, à esquerda do herói.","Dentro do for: ande um passo e some o que pegar() devolver.","total = 0\nfor i in range(6):\n    esquerda()\n    total = total + pegar()\nabrir_cofre(total)"],
 prepara(){
   G.moedasChao=[];G.cofre=0;
   for(let x=7;x<=12;x++){const v=1+Math.floor(Math.random()*9);G.moedasChao.push({x,y:5,v});G.cofre+=v}
 },
 confere:()=>({ok:false,msg:"O programa terminou sem abrir o cofre. Chame abrir_cofre(total) ao lado dele."}),
 ganha:{up:["hud"],titulo:"Placar",texto:"Corações e moedas no canto da tela. Um jogo só parece jogo quando guarda sua pontuação.",aprendeu:"Uma variável pode ser atualizada a partir do próprio valor."},
 depois:"Placar na tela! Agora dá até para se gabar."},
{id:"buracos",sala:5,titulo:"Chão traiçoeiro",conceito:"Decisões com if",memoria:6,par:5,
 texto:`<p>Os buracos mudam de lugar a cada execução, então o herói precisa olhar antes de pisar.</p><p><code>olhar("esquerda")</code> devolve o que há ao lado: <code>"chao"</code>, <code>"buraco"</code>, <code>"parede"</code>, <code>"agua"</code>. O <code>if</code> escolhe o que fazer:</p><pre>if olhar("esquerda") == "buraco":\n    pular("esquerda")\nelse:\n    esquerda()</pre><p><code>==</code> compara. <code>pular</code> avança duas casas.</p>`,
 inicial:``,chips:["for i in range(5):",`if olhar("esquerda") == "buraco":`,`pular("esquerda")`,"else:","esquerda()"],
 dicas:["Repita a decisão várias vezes: o if fica dentro de um for.","São 13 casas até o baú. Se sobrarem repetições, tudo bem: o programa para ao chegar.","for i in range(13):\n    if olhar(\"esquerda\") == \"buraco\":\n        pular(\"esquerda\")\n    else:\n        esquerda()"],
 prepara(){
   const xs=[3,4,5,6,7,8,9,10,11,12].sort(()=>Math.random()-.5),e=[];
   for(const x of xs)if(e.length<4&&e.every(q=>Math.abs(q-x)>1))e.push(x);
   e.forEach(x=>{G.t[5][x]="O"});
 },
 ganha:{era:4,titulo:"8 bits",texto:"Cor em tudo! Grama, água, tijolos e baús. A interface também entrou na fase dos fliperamas.",aprendeu:"if faz o programa decidir com base no que acontece agora."},
 depois:"Cores! Eu não sabia que eu era azul-piscina."},
{id:"desconhecido",sala:6,titulo:"Distância desconhecida",conceito:"Repetição com while",memoria:4,par:4,
 texto:`<p>O caminho muda a cada execução e você não sabe quantos passos ele tem. O <code>for</code> não serve quando não dá para contar antes.</p><p>O <code>while</code> repete <strong>enquanto</strong> a condição for verdadeira. <code>livre("baixo")</code> devolve <code>True</code> se dá para andar para baixo:</p><pre>while livre("baixo"):\n    baixo()</pre><p>O caminho sempre vai para a direita e depois para baixo, até o baú.</p>`,
 inicial:``,chips:[`while livre("direita"):`,`while livre("baixo"):`,"direita()","baixo()"],
 dicas:["São dois laços, um depois do outro.","O primeiro while anda para a direita até bater na borda do caminho.","while livre(\"direita\"):\n    direita()\nwhile livre(\"baixo\"):\n    baixo()"],
 prepara(){
   for(let y=3;y<=7;y++)for(let x=3;x<=13;x++)G.t[y][x]="~";
   const X=6+Math.floor(Math.random()*7),Y=5+Math.floor(Math.random()*3);
   for(let x=3;x<=X;x++)G.t[3][x]="%";
   for(let y=4;y<Y;y++)G.t[y][X]="%";
   G.t[Y][X]="C";
 },
 ganha:{up:["rolagem"],titulo:"Rolagem de tela",texto:"Trocar de sala agora desliza suavemente, em vez de piscar.",aprendeu:"while repete até a situação mudar, sem saber quantas vezes."},
 depois:"Sentiu? As salas agora deslizam. Luxo de console."},
{id:"golpe",sala:7,titulo:"Seu próprio golpe",conceito:"Funções com def",memoria:12,par:6,
 texto:`<p>Gosmas à vista! Uma função é um conjunto de comandos com um nome. <code>def</code> ensina o comando novo e nada acontece até você <strong>chamar</strong> esse nome:</p><pre>def saudacao():\n    print("oi")\n    print("tudo bem?")\n\nsaudacao()</pre><p><code>atacar("cima")</code> corta na direção escolhida. Crie <code>golpe()</code> e acerte pelo menos 3 das 4 gosmas de treino.</p><p>Depois vem a surpresa: a tecla <strong>Espaço</strong> vai rodar o <em>seu</em> código.</p>`,
 inicial:`def golpe():\n    atacar("direita")\n\ngolpe()\n`,chips:[`atacar("cima")`,`atacar("direita")`,`atacar("baixo")`,`atacar("esquerda")`],cursor:34,
 dicas:["As linhas de dentro do def têm recuo. A chamada golpe() fica sem recuo, no final.","Coloque um atacar para cada direção dentro da função.","def golpe():\n    atacar(\"cima\")\n    atacar(\"direita\")\n    atacar(\"baixo\")\n    atacar(\"esquerda\")\n\ngolpe()"],
 prepara(){
   const[x,y]=G.inicio;
   G.inimigos=[[x,y-1],[x+1,y],[x,y+1],[x-1,y]].map(([a,b])=>novaGosma(a,b,true));
 },
 confere(c,I){
   const f=I.glob.get("golpe");
   if(!f||!f.usr)return{ok:false,msg:"Não encontrei a função. Comece com: def golpe():"};
   if((c.acertos||0)<3)return{ok:false,msg:c.acertos?`Você acertou ${c.acertos} de 4. Faltam mais direções dentro da função.`:"Você definiu o golpe, mas ele não acertou nada. Chamou golpe() no fim, sem recuo?"};
   G.golpeFn=f;G.golpeI=I;S.golpe=I.fonte;S.up.espada=true;
   return{ok:true,combate:true};
 },
 ganha:{up:["espada"],titulo:"Espaço roda o seu código",texto:"A tecla Espaço chama o golpe() que você escreveu. Volte ao terminal quando quiser mudar o golpe: ele continua funcionando em qualquer sala.",aprendeu:"Funções dão nome a um conjunto de comandos, e você pode chamar esse nome quantas vezes quiser."},
 depois:"Sua função virou um botão do jogo. Isso é programar de verdade."},
{id:"pontes",sala:8,titulo:"Três rios",conceito:"Parâmetros",memoria:10,par:9,
 texto:`<p>São três rios de larguras diferentes, e a memória não dá conta de três laços inteiros. Uma função pode receber valores:</p><pre>def repete(n):\n    for i in range(n):\n        print("oi")\n\nrepete(2)\nrepete(5)</pre><p><code>n</code> é um <strong>parâmetro</strong>: vale 2 na primeira chamada e 5 na segunda.</p><p><code>construir("direita")</code> põe uma tábua na água ao lado. Crie <code>ponte(n)</code>. As larguras são 3, 5 e 2, e entre um rio e outro é preciso descer uma casa.</p>`,
 inicial:`def ponte(n):\n    \n`,chips:["for i in range(n):",`construir("direita")`,"direita()","baixo()",{t:"ponte(3)",topo:true}],cursor:18,
 dicas:["Para cada tábua: construa, depois ande.","Ao terminar o rio, o herói ainda está sobre a água: mais um passo à direita chega à margem. Depois vem o baixo().","def ponte(n):\n    for i in range(n):\n        construir(\"direita\")\n        direita()\n    direita()\n    baixo()\n\nponte(3)\nponte(5)\nponte(2)"],
 ganha:{era:5,titulo:"16 bits",texto:"Luz, sombra, água animada e nuvens passando. A interface também ficou mais macia.",aprendeu:"Parâmetros deixam a mesma função resolver casos diferentes."},
 depois:"Olha essas sombras! Dá até vontade de morar aqui."},
{id:"melodia",sala:9,titulo:"A porta que canta",conceito:"Listas",memoria:4,par:3,
 texto:`<p>Esta porta só abre com música. Uma lista guarda vários valores em ordem, e o <code>for</code> passa por eles:</p><pre>cores = ["azul", "rosa"]\nfor c in cores:\n    print(c)</pre><p>Crie a lista <code>melodia</code> com pelo menos 8 notas e toque com <code>tocar(nota)</code>. As 4 primeiras precisam ser <code>do, mi, sol, mi</code>. O resto é com você.</p><p><strong>Notas:</strong> do, re, mi, fa, sol, la, si. Esta melodia vira a música do jogo.</p>`,
 inicial:`melodia = ["do", "mi", "sol", "mi"]\n`,chips:[{t:`, "la", "sol", "fa", "re"`,inline:true},"for nota in melodia:","tocar(nota)"],cursor:34,
 dicas:["Acrescente mais notas dentro dos colchetes, separadas por vírgula.","Depois da lista, um for passa por cada nota e chama tocar(nota).","melodia = [\"do\", \"mi\", \"sol\", \"mi\", \"la\", \"sol\", \"fa\", \"re\"]\nfor nota in melodia:\n    tocar(nota)"],
 confere(c,I){
   const l=I.glob.get("melodia");
   if(!Array.isArray(l))return{ok:false,msg:"Não encontrei a lista melodia. Ela começa com: melodia = [\"do\", ...]"};
   if(l.length<8)return{ok:false,msg:`A lista tem ${l.length} notas. A porta pede pelo menos 8.`};
   if(!CHAVE_MELODIA.every((n,i)=>l[i]===n))return{ok:false,msg:"As 4 primeiras notas precisam ser do, mi, sol, mi."};
   if(l.some(n=>!NOTAS[n]))return{ok:false,msg:"Alguma nota da lista não existe. Use do, re, mi, fa, sol, la, si, sem acento."};
   if(c.notas.join()!==l.join())return{ok:false,msg:"A lista está certa, mas o herói precisa tocar nota por nota, com for e tocar(nota)."};
   S.melodia=[...l].slice(0,32);
   return{ok:true};
 },
 ganha:{up:["musica"],titulo:"Música",texto:"A melodia que você escreveu agora é o tema de Compilândia, com baixo e acompanhamento.",aprendeu:"Listas guardam vários valores, e o for percorre um por um."},
 depois:"Essa música é sua. Eu vou cantarolar isso por dias."},
{id:"bugs",sala:10,titulo:"O código do Bug",conceito:"Depuração",memoria:0,par:7,
 texto:`<p>O Grande Bug deixou este programa aqui, cheio de defeitos. Ele deveria levar o herói até o baú, desviando dos buracos.</p><p>Execute, leia o erro, corrija e repita. Programar é isso: quase ninguém acerta de primeira. A linha com problema fica marcada.</p><p>São 5 defeitos, e nem todos geram mensagem de erro.</p>`,
 inicial:`passos = 0\nwhile passos < 5\n    if olhar("esquerda") = "buraco":\n        pular("direita")\n    else\n        esquerda()\n    passos = passo + 1\n`,chips:[],
 dicas:["Dois defeitos são falta de dois-pontos. Outro é = no lugar de ==.","Leia o nome da variável na última linha com calma. E para onde o pular está indo?","O corredor tem 11 casas, então 5 repetições são poucas: troque por while passos < 11:"],
 prepara(){
   const xs=[4,5,6,7,8,9,10,11].sort(()=>Math.random()-.5),e=[];
   for(const x of xs)if(e.length<3&&e.every(q=>Math.abs(q-x)>1))e.push(x);
   e.forEach(x=>{G.t[5][x]="O"});
 },
 ganha:{up:["depurador"],titulo:"Depurador",texto:"O botão Passo a passo executa uma linha por vez. Você olha cada variável antes de seguir. Use no chefe.",aprendeu:"Erros mostram onde olhar. Quando não há mensagem, siga o programa linha a linha."},
 depois:"Falta só um. Ele está na sala à esquerda e não vai gostar de você."},
{id:"chefe",sala:11,titulo:"O Grande Bug",conceito:"Tudo junto",memoria:0,par:14,
 texto:`<p>O chefe muda de escudo a cada turno. <code>escudo()</code> devolve <code>"fogo"</code>, <code>"agua"</code> ou <code>"planta"</code>. Ataque com <code>magia(...)</code> usando o que vence:</p><p>água vence fogo, planta vence água, fogo vence planta.</p><p>Magia errada custa um coração. A cada 2 turnos ele ataca. <code>vida()</code> diz seus corações e <code>curar()</code> gasta um turno para recuperar 2.</p><p><code>return</code> faz a função devolver um valor. Termine <code>contra</code> e escreva a estratégia.</p>`,
 inicial:`def contra(e):\n    if e == "fogo":\n        return "agua"\n    # falta: agua e planta\n\nwhile chefe_vivo():\n    magia(contra(escudo()))\n`,chips:[`elif e == "agua":`,`return "planta"`,"else:",`return "fogo"`,"if vida() < 2:","curar()"],cursor:83,
 dicas:["Primeiro complete contra(e): falta um caso para água e um para planta.","Sem curar, o herói morre antes. No while, verifique a vida antes de atacar.","while chefe_vivo():\n    if vida() < 2:\n        curar()\n    else:\n        magia(contra(escudo()))"],
 prepara(){G.chefe={hp:8,max:8,esc:"fogo",turno:0,ativo:true,hit:0};G.vida=3;G.vidaMax=3;sorteiaEscudo()},
 confere:()=>({ok:false,msg:"O programa acabou e o chefe continua de pé. Use um while chefe_vivo():"}),
 ganha:{era:6,titulo:"3D",texto:"O mundo saiu do plano. Cada bloco ganhou altura e a câmera pode girar com as teclas Q e E. A linha do tempo no topo deixa você voltar a qualquer era.",aprendeu:"Variáveis, decisões, repetições, funções e listas juntas resolvem problemas grandes."},
 depois:"Compilândia está de pé, e foi você quem escreveu. O terminal desta sala agora é livre."},
{id:"criador",sala:11,titulo:"Modo Criador",conceito:"Sem regras",memoria:0,par:0,livre:true,
 texto:`<p>Sem missão e sem limite. O mundo é seu, e tudo que você aprendeu funciona aqui.</p><p><code>pintar(x, y, "agua")</code> muda uma casa (x de 0 a 15, y de 0 a 9). Tipos: <code>"chao"</code>, <code>"agua"</code>, <code>"parede"</code>, <code>"arvore"</code>. <code>fogos()</code> solta fogos.</p>`,
 inicial:`for x in range(2, 14):\n    pintar(x, 7, "agua")\n    if x % 2 == 0:\n        pintar(x, 2, "arvore")\nfogos()\n`,chips:[`pintar(8, 4, "parede")`,"fogos()","for x in range(16):",`tocar("la")`],
 dicas:["Use for dentro de for para pintar uma área inteira.","x % 2 == 0 é verdadeiro para números pares. Bom para fazer xadrez.","for x in range(16):\n    for y in range(10):\n        if (x + y) % 2 == 0:\n            pintar(x, y, \"agua\")"],
 confere:()=>({ok:null})},
];
MISSOES.forEach((m,i)=>{m.i=i});

const MANUAL=[
  {d:0,s:'print("texto")',t:"Escreve na tela."},
  {d:1,s:"direita()  esquerda()  cima()  baixo()",t:"Move o herói uma casa."},
  {d:2,s:"for i in range(n):",t:"Repete o bloco n vezes."},
  {d:4,s:"nome = valor",t:"Guarda um valor em uma variável."},
  {d:5,s:"pegar()",t:"Recolhe as moedas da casa e devolve a quantidade."},
  {d:5,s:"abrir_cofre(n)",t:"Tenta abrir o cofre ao lado com o número n."},
  {d:6,s:"if / elif / else",t:"Escolhe qual bloco executar."},
  {d:6,s:'olhar("direção")',t:'Devolve o que há ao lado: "chao", "buraco", "parede", "agua", "inimigo", "bau".'},
  {d:6,s:'pular("direção")',t:"Avança duas casas no ar."},
  {d:7,s:"while condição:",t:"Repete enquanto a condição for verdadeira."},
  {d:7,s:'livre("direção")',t:"True se dá para andar para esse lado."},
  {d:8,s:"def nome():",t:"Cria uma função. Ela só roda quando é chamada."},
  {d:8,s:'atacar("direção")',t:"Corta a casa ao lado."},
  {d:9,s:'construir("direção")',t:"Coloca uma tábua na água ao lado."},
  {d:10,s:'lista = ["a", "b"]',t:"Guarda vários valores. len(lista) diz o tamanho."},
  {d:10,s:'tocar("do")',t:"Toca uma nota: do, re, mi, fa, sol, la, si."},
  {d:12,s:"return valor",t:"Faz a função devolver um valor."},
  {d:12,s:"chefe_vivo()  escudo()  vida()",t:"Informações da batalha."},
  {d:12,s:'magia("agua")  curar()',t:"Ações da batalha. Cada uma gasta um turno."},
  {d:13,s:'pintar(x, y, "tipo")  fogos()',t:"Muda o mundo."},
];
