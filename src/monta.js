// Junta os arquivos de src/ em uma página só. Uso: node src/monta.js
const fs=require("fs"),path=require("path");
const dir=__dirname,raiz=path.dirname(dir);
const js=["02-arte.js","01-interpretador.js","03-mundo.js","04-render.js","05-jogo.js"]
  .map(f=>fs.readFileSync(path.join(dir,f),"utf8").replace(/^if\(typeof module.*$/m,""))
  .join("\n");
const html=fs.readFileSync(path.join(dir,"pagina.html"),"utf8").replace("/*JS*/",()=>js);
fs.writeFileSync(path.join(raiz,"compilandia.html"),html);
fs.mkdirSync(path.join(raiz,"teste"),{recursive:true});
const teste=fs.readFileSync(path.join(dir,"testa-missoes.js"),"utf8");
fs.writeFileSync(path.join(raiz,"teste","index.html"),"<!doctype html><html lang=\"pt-BR\"><head><meta charset=\"utf-8\"><meta name=\"viewport\" content=\"width=device-width,initial-scale=1,viewport-fit=cover\"></head><body style=\"margin:0\">"+html+"<script type=\"text/plain\" id=\"testeScript\">"+teste+"</script></body></html>");
fs.writeFileSync(path.join(raiz,"teste","jogo.js"),js);
// Versão independente para qualquer site: fora do Claude, o esqueleto da página precisa estar no próprio arquivo.
const corte=html.indexOf('<div id="app">');
const cabeca=html.slice(0,corte).replace(/<meta name="claude:viewport-fit-sides"[^>]*>\n?/,"");
const icone="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'><rect width='16' height='16' fill='%23100a03'/><rect x='5' y='3' width='6' height='10' fill='%2328e6d0'/><rect x='6' y='6' width='1' height='2' fill='%230a0612'/><rect x='9' y='6' width='1' height='2' fill='%230a0612'/></svg>";
fs.writeFileSync(path.join(raiz,"index.html"),`<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="description" content="Aprenda Python escrevendo o código que faz o próprio jogo evoluir, do teletipo de 1963 ao 3D.">
<meta name="theme-color" content="#100a03">
<link rel="icon" href="${icone}">
${cabeca}<style>:root{padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}body{margin:0}</style>
</head>
<body>
${html.slice(corte)}
</body>
</html>
`);
console.log("compilandia.html:",Math.round(html.length/1024),"KB");
