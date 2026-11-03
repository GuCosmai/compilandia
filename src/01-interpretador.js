/* ---------- Interpretador: um pedaço real de Python, executado linha a linha ---------- */
const KW=new Set("if elif else while for in def return break continue pass and or not True False None".split(" "));
class Erro extends Error{constructor(msg,line,dica){super(msg);this.line=line;this.dica=dica}}
class Retorno{constructor(v){this.v=v}}
class Quebra{}
class Segue{}
const PT_PY={se:"if",senao:"else","senão":"else",enquanto:"while",para:"for",repita:"for",funcao:"def","função":"def",imprimir:"print",escreva:"print",mostrar:"print",verdadeiro:"True",falso:"False",retorne:"return",retornar:"return"};

function tokenizar(fonte){
  const toks=[],linhas=fonte.replace(/\r/g,"").replace(/[“”]/g,'"').replace(/[‘’]/g,"'").replace(/\t/g,"    ").split("\n");
  const recuos=[0],abertos=[];
  linhas.forEach((s,n)=>{
    const ln=n+1;let i=0;
    if(!abertos.length){
      while(s[i]===" ")i++;
      if(i>=s.length||s[i]==="#")return;
      const topo=recuos[recuos.length-1];
      if(i>topo){recuos.push(i);toks.push({t:"INDENT",line:ln})}
      else if(i<topo){
        while(i<recuos[recuos.length-1]){recuos.pop();toks.push({t:"DEDENT",line:ln})}
        if(i!==recuos[recuos.length-1])throw new Erro("O recuo desta linha não combina com nenhum bloco acima.",ln,"Alinhe com o bloco a que ela pertence, usando múltiplos de 4 espaços.");
      }
    }
    while(i<s.length){
      const c=s[i];
      if(c===" "){i++;continue}
      if(c==="#")break;
      if(/[0-9]/.test(c)){let j=i;while(j<s.length&&/[0-9.]/.test(s[j]))j++;toks.push({t:"NUM",v:Number(s.slice(i,j)),line:ln});i=j;continue}
      if(/[\p{L}_]/u.test(c)){let j=i;while(j<s.length&&/[\p{L}\p{N}_]/u.test(s[j]))j++;const w=s.slice(i,j);toks.push({t:KW.has(w)?"KW":"NAME",v:w,line:ln});i=j;continue}
      if(c==='"'||c==="'"){
        let j=i+1,v="";
        while(j<s.length&&s[j]!==c){if(s[j]==="\\"&&j+1<s.length){const e=s[++j];v+=e==="n"?"\n":e==="t"?"\t":e}else v+=s[j];j++}
        if(j>=s.length)throw new Erro("Este texto abriu aspas e não fechou.",ln,`Coloque ${c} no fim do texto.`);
        toks.push({t:"STR",v,line:ln});i=j+1;continue;
      }
      const d=s.slice(i,i+2);
      if(["==","!=","<=",">=","+=","-=","*=","//"].includes(d)){toks.push({t:"OP",v:d,line:ln});i+=2;continue}
      if("+-*/%<>=()[],:.".includes(c)){
        if("([".includes(c))abertos.push({c,ln});
        if(")]".includes(c)){
          if(!abertos.length)throw new Erro(`Este “${c}” fecha algo que nunca abriu.`,ln);
          abertos.pop();
        }
        toks.push({t:"OP",v:c,line:ln});i++;continue;
      }
      throw new Erro(`Não entendi o símbolo “${c}”.`,ln);
    }
    if(!abertos.length)toks.push({t:"NL",line:ln});
  });
  if(abertos.length){const a=abertos[abertos.length-1];throw new Erro(`Este “${a.c}” abriu e nunca fechou.`,a.ln,`Feche com “${a.c==="("?")":"]"}”.`)}
  while(recuos.length>1){recuos.pop();toks.push({t:"DEDENT",line:linhas.length})}
  toks.push({t:"EOF",line:linhas.length});
  return toks;
}

function analisar(fonte){
  const T=tokenizar(fonte);let p=0;
  const eh=(t,v)=>T[p].t===t&&(v===undefined||T[p].v===v);
  const aceita=(t,v)=>eh(t,v)?T[p++]:null;
  const linha=()=>T[p].line;
  function bloco(cab){
    if(!aceita("OP",":"))throw new Erro(`Faltou “:” no fim da linha do ${cab}.`,linha(),"Todo if, else, while, for e def termina com dois-pontos.");
    if(!aceita("NL")){const s=simples();fimDeLinha();return[s]}
    if(!eh("INDENT"))throw new Erro(`A linha depois do ${cab} precisa de recuo.`,linha(),"Aperte Tab para colocar 4 espaços no começo da linha.");
    p++;const c=[];
    while(!eh("DEDENT")&&!eh("EOF"))c.push(comando());
    aceita("DEDENT");return c;
  }
  function cond(cab){
    const c=expr();
    if(eh("OP","="))throw new Erro("Um “=” guarda valor. Para comparar, use “==”.",linha(),`Troque por == nesta linha do ${cab}.`);
    return c;
  }
  function fimDeLinha(){
    if(aceita("NL")||eh("EOF"))return;
    throw new Erro("Sobrou algo no fim desta linha.",linha(),"Confira se faltou um parêntese, uma vírgula ou aspas.");
  }
  function comando(){
    const line=linha();
    if(eh("INDENT"))throw new Erro("Esta linha tem recuo sem motivo.",line,"Tire os espaços do começo, ou coloque um if, for, while ou def antes dela.");
    if(aceita("KW","if")){
      const ramos=[{c:cond("if"),line}];ramos[0].b=bloco("if");
      let senao=null;
      while(eh("KW","elif")){const l=linha();p++;const r={c:cond("elif"),line:l};r.b=bloco("elif");ramos.push(r)}
      if(aceita("KW","else"))senao=bloco("else");
      return{k:"if",ramos,senao,line};
    }
    if(aceita("KW","while")){const c=cond("while");return{k:"while",c,b:bloco("while"),line}}
    if(aceita("KW","for")){
      const n=aceita("NAME");
      if(!n)throw new Erro("Depois de for vem o nome de uma variável.",line,"Exemplo: for i in range(5):");
      if(!aceita("KW","in"))throw new Erro("Faltou “in” neste for.",line,"Exemplo: for i in range(5):");
      const lista=expr();return{k:"for",nome:n.v,lista,b:bloco("for"),line};
    }
    if(aceita("KW","def")){
      const n=aceita("NAME");
      if(!n)throw new Erro("Depois de def vem o nome da função.",line,"Exemplo: def golpe():");
      if(!aceita("OP","("))throw new Erro("Faltaram os parênteses depois do nome da função.",line,`Escreva: def ${n.v}():`);
      const params=[];
      while(!eh("OP",")")){
        const a=aceita("NAME");
        if(!a)throw new Erro("Os parâmetros de uma função são nomes separados por vírgula.",line);
        params.push(a.v);if(!aceita("OP",","))break;
      }
      if(!aceita("OP",")"))throw new Erro("Faltou fechar o parêntese do def.",line);
      return{k:"def",nome:n.v,params,b:bloco("def"),line};
    }
    if(eh("KW","else")||eh("KW","elif"))throw new Erro(`Este ${T[p].v} está sozinho.`,line,"Ele precisa vir logo depois de um bloco if, com o mesmo recuo do if.");
    const ini=T[p];
    const s=simples();
    if(ini.t==="NAME"&&PT_PY[ini.v.toLowerCase()]&&!eh("NL")&&!eh("EOF"))throw new Erro(`Em Python, “${ini.v}” se escreve ${PT_PY[ini.v.toLowerCase()]}.`,line);
    fimDeLinha();return s;
  }
  function simples(){
    const line=linha();
    if(aceita("KW","pass"))return{k:"pass",line};
    if(aceita("KW","break"))return{k:"break",line};
    if(aceita("KW","continue"))return{k:"continue",line};
    if(aceita("KW","return"))return{k:"return",v:(eh("NL")||eh("EOF"))?null:expr(),line};
    const e=expr();
    if(aceita("OP","=")){
      if(e.k!=="nome"&&e.k!=="indice")throw new Erro("Só dá para guardar valor em uma variável.",line,"À esquerda do = vem um nome, como: total = 0");
      return{k:"atrib",alvo:e,v:expr(),line};
    }
    for(const op of["+=","-=","*="])if(aceita("OP",op)){
      if(e.k!=="nome"&&e.k!=="indice")throw new Erro("Só dá para atualizar uma variável.",line);
      return{k:"atrib",alvo:e,v:{k:"bin",op:op[0],a:e,b:expr(),line},line};
    }
    return{k:"expr",e,line};
  }
  const expr=()=>ou();
  function ou(){let a=ee();while(eh("KW","or")){const line=T[p++].line;a={k:"log",op:"or",a,b:ee(),line}}return a}
  function ee(){let a=nao();while(eh("KW","and")){const line=T[p++].line;a={k:"log",op:"and",a,b:nao(),line}}return a}
  function nao(){if(eh("KW","not")&&!(T[p+1].t==="KW"&&T[p+1].v==="in")){const line=T[p++].line;return{k:"not",a:nao(),line}}return comp()}
  function comp(){
    let a=soma();
    for(;;){
      const line=linha();let op=null;
      if(T[p].t==="OP"&&["==","!=","<",">","<=",">="].includes(T[p].v))op=T[p++].v;
      else if(aceita("KW","in"))op="in";
      else if(eh("KW","not")&&T[p+1].t==="KW"&&T[p+1].v==="in"){p+=2;op="not in"}
      else break;
      a={k:"bin",op,a,b:soma(),line};
    }
    return a;
  }
  function soma(){let a=mult();while(eh("OP","+")||eh("OP","-")){const t=T[p++];a={k:"bin",op:t.v,a,b:mult(),line:t.line}}return a}
  function mult(){let a=un();while(eh("OP","*")||eh("OP","/")||eh("OP","//")||eh("OP","%")){const t=T[p++];a={k:"bin",op:t.v,a,b:un(),line:t.line}}return a}
  function un(){if(eh("OP","-")){const line=T[p++].line;return{k:"neg",a:un(),line}}return pos()}
  function pos(){
    let a=atomo();
    for(;;){
      const line=linha();
      if(aceita("OP","(")){
        const args=[];
        while(!eh("OP",")")){args.push(expr());if(!aceita("OP",","))break}
        if(!aceita("OP",")"))throw new Erro("Faltou uma vírgula ou um “)” nesta chamada.",line);
        a={k:"chama",f:a,args,line};
      }else if(aceita("OP","[")){
        const i=expr();
        if(!aceita("OP","]"))throw new Erro("Faltou fechar o “]”.",line);
        a={k:"indice",a,i,line};
      }else if(aceita("OP",".")){
        const n=aceita("NAME");
        if(!n)throw new Erro("Depois do ponto vem o nome de um método.",line,"Exemplo: lista.append(3)");
        a={k:"attr",a,nome:n.v,line};
      }else break;
    }
    return a;
  }
  function atomo(){
    const t=T[p],line=t.line;
    if(t.t==="NUM"||t.t==="STR"){p++;return{k:"lit",v:t.v,line}}
    if(t.t==="NAME"){p++;return{k:"nome",v:t.v,line}}
    if(t.t==="KW"&&(t.v==="True"||t.v==="False"||t.v==="None")){p++;return{k:"lit",v:t.v==="None"?null:t.v==="True",line}}
    if(aceita("OP","(")){const e=expr();if(!aceita("OP",")"))throw new Erro("Faltou fechar o “)”.",line);return e}
    if(aceita("OP","[")){
      const i=[];
      while(!eh("OP","]")){i.push(expr());if(!aceita("OP",","))break}
      if(!aceita("OP","]"))throw new Erro("Faltou uma vírgula ou um “]” nesta lista.",line);
      return{k:"lista",i,line};
    }
    if(t.t==="NL"||t.t==="EOF")throw new Erro("Esta linha acabou antes da hora.",line,"Parece faltar um valor no fim.");
    if(t.t==="OP"&&t.v==="=")throw new Erro("Faltou algo antes do “=”.",line);
    throw new Erro(`Não esperava “${t.v??"isto"}” aqui.`,line);
  }
  const prog=[];
  while(!eh("EOF")){if(aceita("NL"))continue;prog.push(comando())}
  return prog;
}

const tipoDe=x=>x===null?"None":typeof x==="string"?"texto":typeof x==="number"?"número":typeof x==="boolean"?"booleano":Array.isArray(x)?"lista":"função";
function paraTexto(v,dentro){
  if(v===null)return"None";
  if(v===true)return"True";
  if(v===false)return"False";
  if(typeof v==="string")return dentro?`"${v}"`:v;
  if(Array.isArray(v))return"["+v.map(x=>paraTexto(x,true)).join(", ")+"]";
  if(typeof v==="object")return`<função ${v.nome}>`;
  return String(v);
}
const verdade=v=>!(v===null||v===false||v===0||v===""||(Array.isArray(v)&&!v.length));
function igual(a,b){
  if(Array.isArray(a)&&Array.isArray(b))return a.length===b.length&&a.every((x,i)=>igual(x,b[i]));
  return a===b;
}
function opera(op,a,b,line){
  const n=x=>typeof x==="number"||typeof x==="boolean";
  switch(op){
    case"+":
      if(n(a)&&n(b))return a+b;
      if(typeof a==="string"&&typeof b==="string")return a+b;
      if(Array.isArray(a)&&Array.isArray(b))return a.concat(b);
      throw new Erro(`Não dá para somar ${tipoDe(a)} com ${tipoDe(b)}.`,line,"str(numero) vira texto, int(texto) vira número.");
    case"-":case"/":case"//":case"%":
      if(!n(a)||!n(b))throw new Erro(`A conta “${op}” só funciona com números, e aqui veio ${tipoDe(a)} e ${tipoDe(b)}.`,line);
      if(op==="-")return a-b;
      if(b==0)throw new Erro("Divisão por zero.",line,"Confira se o valor de baixo pode ser 0.");
      if(op==="/")return a/b;
      if(op==="//")return Math.floor(a/b);
      return((a%b)+b)%b;
    case"*":
      if(n(a)&&n(b))return a*b;
      if(typeof a==="string"&&typeof b==="number")return a.repeat(Math.max(0,Math.min(b,500)));
      if(Array.isArray(a)&&typeof b==="number"){let r=[];for(let i=0;i<Math.min(b,500);i++)r=r.concat(a);return r}
      throw new Erro(`Não dá para multiplicar ${tipoDe(a)} por ${tipoDe(b)}.`,line);
    case"==":return igual(a,b);
    case"!=":return!igual(a,b);
    case"<":case">":case"<=":case">=":
      if(!((n(a)&&n(b))||(typeof a==="string"&&typeof b==="string")))throw new Erro(`Não dá para comparar ${tipoDe(a)} com ${tipoDe(b)}.`,line);
      return op==="<"?a<b:op===">"?a>b:op==="<="?a<=b:a>=b;
    case"in":case"not in":{
      let r;
      if(Array.isArray(b))r=b.some(x=>igual(x,a));
      else if(typeof b==="string"&&typeof a==="string")r=b.includes(a);
      else throw new Erro(`“in” procura dentro de uma lista ou texto, e aqui veio ${tipoDe(b)}.`,line);
      return op==="in"?r:!r;
    }
  }
}
function distancia(a,b){
  const d=Array.from({length:a.length+1},(_,i)=>[i]);
  for(let j=1;j<=b.length;j++)d[0][j]=j;
  for(let i=1;i<=a.length;i++)for(let j=1;j<=b.length;j++)
    d[i][j]=Math.min(d[i-1][j]+1,d[i][j-1]+1,d[i-1][j-1]+(a[i-1]===b[j-1]?0:1));
  return d[a.length][b.length];
}

/* Um interpretador é um gerador: a cada linha ele entrega o controle ao jogo, que anima e decide o ritmo. */
function novoInterp(ctx,embutidas,bloqueadas){
  const I={passos:0,limite:60000,prof:0,glob:new Map(),bi:embutidas,ctx};
  const raiz={v:I.glob,pai:null};I.raiz=raiz;
  function erroNome(nome,line){
    const py=PT_PY[nome.toLowerCase()];
    if(py)return new Erro(`Em Python, “${nome}” se escreve ${py}.`,line);
    if(bloqueadas&&bloqueadas.has(nome))return new Erro(`“${nome}” existe, mas você ainda não destravou.`,line,"Ele aparece em uma missão mais à frente.");
    const nomes=[...I.bi.keys(),...I.glob.keys(),"print","range","len"];
    let m=null,md=3;
    for(const c of nomes){const d=distancia(nome.toLowerCase(),c.toLowerCase());if(d<md){md=d;m=c}}
    return new Erro(`Não conheço “${nome}”.`,line,m?`Você quis dizer “${m}”?`:`Se é um texto, coloque entre aspas: "${nome}".`);
  }
  function busca(nome,A,line){
    for(let e=A;e;e=e.pai)if(e.v.has(nome))return e.v.get(nome);
    if(I.bi.has(nome))return I.bi.get(nome);
    throw erroNome(nome,line);
  }
  function metodo(obj,nome,line){
    const f=(fn)=>({bi:true,nome,*fn(a){return fn(a)}});
    if(Array.isArray(obj)){
      if(nome==="append")return f(a=>{obj.push(a[0]);return null});
      if(nome==="pop")return f(()=>{if(!obj.length)throw new Erro("A lista está vazia.",line);return obj.pop()});
      if(nome==="reverse")return f(()=>{obj.reverse();return null});
    }
    if(typeof obj==="string"){
      if(nome==="upper")return f(()=>obj.toUpperCase());
      if(nome==="lower")return f(()=>obj.toLowerCase());
    }
    throw new Erro(`${tipoDe(obj)} não tem o método “${nome}”.`,line);
  }
  function posicao(lista,i,line){
    if(!Array.isArray(lista)&&typeof lista!=="string")throw new Erro(`Só dá para usar [ ] em lista ou texto, e aqui veio ${tipoDe(lista)}.`,line);
    if(typeof i!=="number"||i%1)throw new Erro("A posição dentro de [ ] precisa ser um número inteiro.",line);
    const k=i<0?lista.length+i:i;
    if(k<0||k>=lista.length)throw new Erro(`A posição ${i} não existe: o tamanho é ${lista.length}.`,line,"A contagem começa em 0.");
    return k;
  }
  function* aval(e,A){
    switch(e.k){
      case"lit":return e.v;
      case"nome":return busca(e.v,A,e.line);
      case"lista":{const r=[];for(const x of e.i)r.push(yield* aval(x,A));return r}
      case"neg":{const v=yield* aval(e.a,A);if(typeof v!=="number")throw new Erro("O sinal de menos só funciona com números.",e.line);return-v}
      case"not":return!verdade(yield* aval(e.a,A));
      case"log":{
        const a=yield* aval(e.a,A);
        if(e.op==="and")return verdade(a)?yield* aval(e.b,A):a;
        return verdade(a)?a:yield* aval(e.b,A);
      }
      case"bin":{const a=yield* aval(e.a,A),b=yield* aval(e.b,A);return opera(e.op,a,b,e.line)}
      case"indice":{const a=yield* aval(e.a,A),i=yield* aval(e.i,A);return a[posicao(a,i,e.line)]}
      case"attr":return metodo(yield* aval(e.a,A),e.nome,e.line);
      case"chama":{
        const f=yield* aval(e.f,A),args=[];
        for(const x of e.args)args.push(yield* aval(x,A));
        if(!f||typeof f!=="object"||Array.isArray(f)||!(f.bi||f.usr))throw new Erro(`Isto é ${tipoDe(f)}, não dá para chamar com ( ).`,e.line);
        return yield* chamar(f,args,e.line);
      }
    }
  }
  function* chamar(f,args,line){
    if(f.bi)return yield* f.fn(args,line,ctx);
    if(args.length!==f.params.length){
      const q=f.params.length;
      throw new Erro(`${f.nome}() espera ${q} ${q===1?"valor":"valores"} e recebeu ${args.length}.`,line,q?`Parâmetros: ${f.params.join(", ")}.`:"Deixe os parênteses vazios.");
    }
    if(++I.prof>150){I.prof=0;throw new Erro(`${f.nome}() chamou a si mesma vezes demais.`,line,"Falta uma condição de parada.")}
    const L={v:new Map(),pai:f.escopo};
    f.params.forEach((n,i)=>L.v.set(n,args[i]));
    try{yield* lista(f.corpo,L)}
    catch(s){if(s instanceof Retorno)return s.v;throw s}
    finally{I.prof--}
    return null;
  }
  function* lista(c,A){for(const s of c)yield* exec(s,A)}
  function conta(line){
    if(++I.passos>I.limite)throw new Erro("Este programa não para: parece um laço infinito.",line,"Confira se a condição do while algum dia fica falsa.");
  }
  function* exec(s,A){
    conta(s.line);
    if(s.k!=="def")yield{l:s.line,A};
    switch(s.k){
      case"pass":return;
      case"break":throw new Quebra();
      case"continue":throw new Segue();
      case"return":throw new Retorno(s.v?yield* aval(s.v,A):null);
      case"expr":{
        const v=yield* aval(s.e,A);
        if(v&&typeof v==="object"&&(v.bi||v.usr)&&s.e.k==="nome")throw new Erro(`“${s.e.v}” sem parênteses não faz nada.`,s.line,`Escreva ${s.e.v}() para executar.`);
        return;
      }
      case"atrib":{
        const v=yield* aval(s.v,A);
        if(s.alvo.k==="nome")A.v.set(s.alvo.v,v);
        else{const a=yield* aval(s.alvo.a,A),i=yield* aval(s.alvo.i,A);if(typeof a==="string")throw new Erro("Texto não muda letra por letra.",s.line);a[posicao(a,i,s.line)]=v}
        return;
      }
      case"if":
        for(const r of s.ramos)if(verdade(yield* aval(r.c,A))){yield* lista(r.b,A);return}
        if(s.senao)yield* lista(s.senao,A);
        return;
      case"while":
        while(verdade(yield* aval(s.c,A))){
          try{yield* lista(s.b,A)}catch(e){if(e instanceof Quebra)break;if(!(e instanceof Segue))throw e}
          conta(s.line);yield{l:s.line,A};
        }
        return;
      case"for":{
        let seq=yield* aval(s.lista,A);
        if(typeof seq==="string")seq=[...seq];
        if(!Array.isArray(seq))throw new Erro(`for percorre uma lista, um range ou um texto, e aqui veio ${tipoDe(seq)}.`,s.line,"Exemplo: for i in range(5):");
        for(const x of[...seq]){
          A.v.set(s.nome,x);
          try{yield* lista(s.b,A)}catch(e){if(e instanceof Quebra)break;if(!(e instanceof Segue))throw e}
          conta(s.line);yield{l:s.line,A};
        }
        return;
      }
      case"def":
        A.v.set(s.nome,{usr:true,nome:s.nome,params:s.params,corpo:s.b,escopo:raiz});
        return;
    }
  }
  I.rodar=function*(prog){
    try{yield* lista(prog,raiz)}
    catch(s){
      if(s instanceof Retorno)throw new Erro("return só funciona dentro de uma função.");
      if(s instanceof Quebra||s instanceof Segue)throw new Erro("break e continue só funcionam dentro de um laço.");
      throw s;
    }
  };
  I.chamar=chamar;
  return I;
}
function embutidasBase(){
  const m=new Map();
  const bi=(nome,fn)=>m.set(nome,{bi:true,nome,*fn(a,l,c){return fn(a,l,c)}});
  m.set("print",{bi:true,nome:"print",*fn(a,l,c){c.imprime(a.map(x=>paraTexto(x)).join(" "));yield{e:50}}});
  bi("len",(a,l)=>{if(typeof a[0]!=="string"&&!Array.isArray(a[0]))throw new Erro("len() mede lista ou texto.",l);return a[0].length});
  bi("range",(a,l)=>{
    if(!a.length||a.length>3||a.some(x=>typeof x!=="number"||x%1))throw new Erro("range() recebe números inteiros.",l,"Exemplo: range(5)");
    const[i,f,p]=a.length===1?[0,a[0],1]:[a[0],a[1],a[2]??1],r=[];
    if(!p)throw new Erro("O passo do range não pode ser 0.",l);
    for(let x=i;p>0?x<f:x>f;x+=p){r.push(x);if(r.length>20000)break}
    return r;
  });
  bi("str",a=>paraTexto(a[0]));
  bi("int",(a,l)=>{const v=Number(a[0]);if(Number.isNaN(v))throw new Erro(`Não consegui virar “${a[0]}” em número.`,l);return Math.trunc(v)});
  bi("abs",a=>Math.abs(a[0]));
  bi("round",a=>Math.round(a[0]));
  bi("min",a=>Math.min(...(Array.isArray(a[0])?a[0]:a)));
  bi("max",a=>Math.max(...(Array.isArray(a[0])?a[0]:a)));
  bi("sum",(a,l)=>{if(!Array.isArray(a[0]))throw new Erro("sum() soma uma lista.",l);return a[0].reduce((x,y)=>x+y,0)});
  return m;
}
if(typeof module!=="undefined")module.exports={analisar,novoInterp,embutidasBase,Erro,paraTexto};
