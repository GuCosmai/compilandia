# Compilândia

Uma aventura em que você aprende Python escrevendo o código que faz o próprio jogo evoluir, do teletipo de 1963 ao 3D.

**[Jogar agora](https://gucosmai.github.io/compilandia/)**

O mundo foi apagado por um bug e só sobrou um terminal. Cada programa que funciona abre um baú, e cada baú traz uma evolução: teclado, pixels, som, cor, rolagem de tela, luz e sombra, música e, no final, 3D. A interface e o editor mudam de época junto com o jogo.

## O que você aprende

| Missão | Conceito | Evolução |
|---|---|---|
| Olá, mundo | Comandos | Mundo em ASCII |
| Primeiros passos | Sequência | Teclado |
| O corredor de 13 passos | `for` | Pixels em 1 bit e números de linha |
| A escada | Blocos e recuo | 4 tons, som e cores no código |
| Quem é você? | Variáveis | Nome, cor e velocidade do herói |
| O cofre de moedas | Acumular valores | Placar |
| Chão traiçoeiro | `if` | 8 bits |
| Distância desconhecida | `while` | Rolagem de tela |
| Seu próprio golpe | `def` | A tecla Espaço roda a função que você escreveu |
| Três rios | Parâmetros | 16 bits |
| A porta que canta | Listas | Sua melodia vira a música do jogo |
| O código do Bug | Depuração | Execução passo a passo |
| O Grande Bug | Tudo junto e `return` | 3D e Modo Criador |

Os recursos da linguagem usados no jogo são Python de verdade. Comandos como `direita()` e `atacar()` existem só aqui.

## Como jogar

Abra o link acima no navegador do computador ou do celular. Não é preciso instalar nada, e o progresso fica salvo no próprio navegador.

- **Setas ou WASD:** andar
- **Ctrl+Enter:** executar o programa
- **Esc:** sair do editor e voltar a andar
- **Espaço:** usar o seu `golpe()`
- **Q e E:** girar a câmera na era 3D

## Desenvolvimento

O jogo é uma página única, feita sem bibliotecas. Tudo fica em `src/`:

- `01-interpretador.js`: interpretador de um subconjunto de Python, com mensagens de erro em português
- `02-arte.js`: pixel art e filtros de cada era
- `03-mundo.js`: salas e missões
- `04-render.js`: desenho em ASCII, 2D e 3D
- `05-jogo.js`: regras do jogo, editor e interface
- `pagina.html`: marcação e estilos

Para gerar o `index.html` e rodar os testes do interpretador, é preciso ter o [Node.js](https://nodejs.org):

```bash
node src/monta.js
```

```bash
node src/testa-interp.js
```
