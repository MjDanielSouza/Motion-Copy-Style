# Saída HyperFrames

Aqui o vídeo é reconstruído em código (HTML + GSAP), não gerado por IA — a fidelidade pode ser bem maior que no Omni Flash.

## 1. Build brief
Acrescente ao `reference-breakdown.md` a seção `## HyperFrames build brief`:

- **Canvas**: resolução, fps e **duração original** (não comprimir para 10 s; só muda com override). Uma composição por formato pedido (16:9, 9:16, 1:1) — no reenquadramento, reposicione elementos pela safe area, não apenas corte.
- **Design tokens**: do Style Bible (cores, gradientes, fontes com equivalentes Google Fonts, raios, sombras, grain/glow).
- **Cenas**: uma sub-composição por cena, com início/fim em segundos (de `analysis.json`), camadas em z-order, texto exato, e a coreografia: propriedade, de/para, duração, easing, stagger, transição para a próxima.
- **Câmera**: push-in/pan/zoom como transformações do container da cena (ver `hyperframes-keyframes`).
- **Assets**: o que é desenhado em HTML/CSS/SVG (formas, ícones, UI, gráficos — prefira sempre) vs. o que precisa ser buscado/gerado (fotos, logos, texturas, música, SFX, voz → `media-use`). Efeitos nomeados (glitch, grain, CRT, confetti, gráfico…) → procurar antes no `hyperframes-registry`.
- **Áudio**: trilha (mood/BPM) e SFX com timestamps sincronizados aos beats. Para alinhar a cortes musicais use o `beats` da CLI (`hyperframes-cli`); para narração, `transcribe`.
- **Frame final**: composição e duração do hold.

## 2. Construção
Invoque a skill `hyperframes` (ponto de entrada obrigatório) passando o caminho do `reference-breakdown.md` e do `style-bible.md`, pedindo para recriar fielmente a partir do build brief. Ela carrega as demais (`hyperframes-core`, `hyperframes-animation`, `hyperframes-keyframes`, `hyperframes-registry`, `media-use`, `hyperframes-cli`).

## 3. Entrega técnica
Pergunte (ou siga o pedido) o formato final:
- **Redes**: MP4 H.264, 30 fps, nos aspect ratios pedidos.
- **Broadcast / TV**: 1920×1080, 29,97 fps (ou 59,94), respeitando title-safe (90%) e action-safe (93%).
- **Overlay com transparência** (lower thirds, vinhetas, GCs para editar por cima): MOV ProRes 4444 com alpha, fundo transparente.

## 4. Validação contra a referência
Depois do render:
```bash
node ~/.claude/skills/motion-copy-style/scripts/analyze.mjs compare "<referencia>" "<render.mp4>" "<projeto>/compare" --points 10
```
Leia cada `compare_XX.jpg` (referência à esquerda, render à direita) e confira layout, cores, tipografia e timing. Rode também `analyze.mjs` no render e compare os tempos de corte e a curva de energia com os da referência (diferenças > 0,2 s em cortes = ajustar). Corrija, renderize de novo e relate o que ainda difere e por quê. Máximo de 3 rodadas antes de mostrar ao usuário.
