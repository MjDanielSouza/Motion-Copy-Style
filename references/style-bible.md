# Style Bible — template

O Style Bible é o "DNA de movimento" extraído da referência. É ele que permite **copiar o estilo** para um conteúdo novo (modo `estilo`), e não só replicar o vídeo. Salve como `style-bible.md` no projeto. Valores medidos vêm de `analysis.json`; valores estimados levam `≈`.

```markdown
# Style Bible — <nome do estilo>
Fonte: <arquivo/URL> · <duração>s · <res> · <fps>

## Em uma linha
<estilo visual em uma frase>

## Cor
| token | hex | uso | área típica |
|---|---|---|---|
| --bg | #...... | fundo dominante | 60–80% |
| --surface | #...... | cards/painéis | |
| --accent | #...... | destaque, CTA, highlights | <10% |
| --text | #...... | texto principal | |
Gradientes: <tipo, ângulo, stops em hex>
Regra de contraste/uso: <ex.: acento só em 1 elemento por cena>

## Tipografia
- Display: <família ou equivalente Google Fonts>, peso, caixa, tracking
- Texto: <...>
- Hierarquia: H1 ≈ X% da altura do frame, H2 ≈ Y%, legenda ≈ Z%
- Animação de texto padrão: <ex.: mask reveal por linha, 0.5s, power3.out, stagger 0.06s por palavra>

## Linguagem de movimento
- Duração típica de entrada: ≈ X s · de saída: ≈ Y s
- Easing dominante: <ex.: entrada power3.out / expo.out; saída power2.in; overshoot back.out(1.4) em ícones>
- Stagger: <s entre itens>
- Câmera: <estática / push-in lento X% em Ys / parallax em N camadas>
- Ritmo: <cenas de ≈ Xs, cortes/s, holds de ≈ Ys antes de cada corte>
- Movimento secundário: <float idle, glow pulsando, partículas…>

## Transições (catálogo)
| nome | descrição | duração | quando |
|---|---|---|---|
| ex.: wipe diagonal | barra --accent 45° varre da esquerda | 0.4s | entre seções |

## Elementos gráficos recorrentes
<formas, ícones (estilo: outline 2px, cantos arredondados…), UI, texturas, grain, sombras>

## Som
<mood, BPM ≈, instrumentação, SFX por tipo de evento (whoosh nas transições, click nos UI taps), voz>

## Composição
<grid, margens/safe area, alinhamento, posição recorrente de logo/texto>

## Anti-padrões (o que quebra o estilo)
<ex.: nada de sombras duras; nunca mais de 2 cores de acento; sem easing linear>
```
