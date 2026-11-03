const {analisar,novoInterp,embutidasBase,Erro}=require("./01-interpretador.js");
function roda(fonte){
  const saida=[],ctx={imprime:t=>saida.push(t)};
  const I=novoInterp(ctx,embutidasBase());
  const g=I.rodar(analisar(fonte));
  let r=g.next();while(!r.done)r=g.next();
  return{saida,I};
}
let ok=0,falha=0;
function t(nome,fonte,esperado){
  try{const s=roda(fonte).saida.join("|");if(s===esperado)ok++;else{falha++;console.log("FALHOU",nome,"->",s,"esperava",esperado)}}
  catch(e){falha++;console.log("ERRO",nome,e.message,e.stack)}
}
function e(nome,fonte,trecho,linha){
  try{roda(fonte);falha++;console.log("NÃO DEU ERRO",nome)}
  catch(x){
    const bom=x instanceof Erro&&(x.message+" "+(x.dica||"")).includes(trecho)&&(linha===undefined||x.line===linha);
    if(bom)ok++;else{falha++;console.log("ERRO ERRADO",nome,"->",x.message,"|",x.dica,"| linha",x.line)}
  }
}
t("print","print(\"oi\", 1+2)","oi 3");
t("aspas curvas","print(“oi”)","oi");
t("for","for i in range(3):\n    print(i)","0|1|2");
t("while","n=0\nwhile n<3:\n    n+=1\nprint(n)","3");
t("if elif else","x=5\nif x<3:\n    print(1)\nelif x<6:\n    print(2)\nelse:\n    print(3)","2");
t("def return","def dobro(n):\n    return n*2\nprint(dobro(4))","8");
t("escopo","x=1\ndef f():\n    x=2\n    return x\nprint(f(),x)","2 1");
t("lista","a=[1,2]\na.append(3)\nfor v in a:\n    print(v)\nprint(len(a),a[0],a[-1])","1|2|3|3 1 3");
t("str lista","print([\"a\",1,True,None])","[\"a\", 1, True, None]");
t("break continue","for i in range(5):\n    if i==1:\n        continue\n    if i==3:\n        break\n    print(i)","0|2");
t("logica","print(1<2 and not 3>4, 0 or \"x\")","True x");
t("in","print(\"a\" in [\"a\"], 2 not in [1])","True True");
t("recursao","def f(n):\n    if n<=1:\n        return 1\n    return n*f(n-1)\nprint(f(5))","120");
t("comentario e branco","# oi\n\nprint(1) # fim\n\n","1");
t("divisao","print(7//2,7%3,-7%3,7/2)","3 1 2 3.5");
t("if inline","if True: print(1)","1");
t("texto + str","print(\"a\"+str(1))","a1");
t("parenteses multilinha","print(1,\n      2)","1 2");
t("lista multilinha","a=[1,\n   2]\nprint(a)","[1, 2]");
t("else apos for no bloco","for i in range(2):\n    if i==0:\n        print(\"z\")\n    else:\n        print(\"u\")\nprint(\"fim\")","z|u|fim");
e("sem dois pontos","if True\n    print(1)","Faltou “:”",1);
e("sem recuo","for i in range(2):\nprint(i)","precisa de recuo",2);
e("recuo sobrando","print(1)\n    print(2)","recuo sem motivo",2);
e("recuo torto","if True:\n        print(1)\n    print(2)","não combina",3);
e("igual simples","x=1\nif x = 1:\n    print(x)","Para comparar",2);
e("aspas abertas","print(\"oi)","não fechou",1);
e("paren aberto","print(1","nunca fechou",1);
e("nome errado","direta()","Não conheço",1);
e("maiuscula","Print(1)","print",1);
e("portugues","se 1 > 0:\n    print(1)","if",1);
e("sem parenteses","print","sem parênteses",1);
e("infinito","while True:\n    pass","laço infinito");
e("soma tipos","print(\"a\"+1)","somar");
e("zero","print(1/0)","zero");
e("indice","a=[1]\nprint(a[3])","não existe",2);
e("aridade","def f(a):\n    pass\nf()","espera 1 valor",3);
e("else sozinho","else:\n    print(1)","sozinho",1);
e("return fora","return 1","só funciona dentro");
console.log(`${ok} passaram, ${falha} falharam`);
process.exit(falha?1:0);
