# Motion Copy Style

Skill para o [Claude Code](https://claude.com/claude-code) que **copia o estilo de um vídeo de motion graphics**: mede e decupa a referência quadro a quadro, destila um *Style Bible* reutilizável e reproduz o vídeo — ou aplica o estilo a um conteúdo novo — em três destinos:

| Destino | Saída |
|---|---|
| **Google Omni Flash** | prompt único pronto para colar (10 s comprimidos ou sequência de clipes com continuidade) |
| **HyperFrames** | composição HTML + GSAP renderizada em MP4 |
| **After Effects** | projeto `.aep` nativo (comps por cena, shapes, texto, keyframes com easing medido, controle central de cores) montado via ExtendScript |

## Como funciona

1. **Medição automática** (`scripts/analyze.mjs`, Node + ffmpeg, sem dependências): cortes de cena com tempo exato, paleta em hex por cena, curva de energia de movimento, contact sheets, keyframes por cena e áudio.
2. **Inspeção visual** do vídeo inteiro, com frames densos nas transições para medir duração, easing e stagger.
3. **Breakdown shot-by-shot** (`reference-breakdown.md`).
4. **Style Bible** (`style-bible.md`): cores, tipografia, linguagem de movimento, catálogo de transições, som e anti-padrões.
5. **Overrides**: marca/logo, paleta, textos, duração, tom, elementos, formatos (16:9, 9:16, 1:1, broadcast 29,97, ProRes 4444 com alpha).
6. **Saídas** no(s) destino(s) escolhido(s).
7. **Validação**: render comparado lado a lado com a referência (`analyze.mjs compare`).

Modos: **replicar** (mesma estrutura) ou **estilo** (estilo da referência aplicado a um roteiro novo).

## Instalação

```bash
git clone https://github.com/MjDanielSouza/Motion-Copy-Style.git ~/.claude/skills/motion-copy-style
```

Requisitos:
- [ffmpeg](https://ffmpeg.org/) e Node.js 18+ no PATH (`winget install Gyan.FFmpeg`)
- Opcional: `yt-dlp` para referências por URL
- Destino HyperFrames: skills do HyperFrames (`npx skills add heygen-com/hyperframes`)
- Destino After Effects: Adobe After Effects + uma skill `after-effects` de automação via ExtendScript, com *Allow Scripts to Write Files and Access Network* ativado

## Uso

No Claude Code:

```
/motion-copy-style analise referencia.mp4 e gere o prompt do Omni Flash
/motion-copy-style recrie referencia.mp4 no After Effects em 1920x1080 29,97, marca RIC, paleta #E30613 e #FFFFFF
/motion-copy-style use o estilo de referencia.mp4 para este roteiro: ... — destino hyperframes, 9:16
```

### Script de análise isolado

```bash
node scripts/analyze.mjs video.mp4 saida/ [--fps N] [--threshold 0.3] [--sheet 36]
node scripts/analyze.mjs compare referencia.mp4 render.mp4 comparacao/ [--points 8]
```

## Estrutura

```
SKILL.md                     instruções da skill
scripts/analyze.mjs          medição automática e comparação lado a lado
references/style-bible.md    template do Style Bible
references/omni-flash.md     regras e template do prompt Omni Flash
references/hyperframes.md    build brief e validação HyperFrames
references/after-effects.md  build brief, easing → AE, render e validação After Effects
```

## Direitos autorais

A skill copia **estilo, ritmo e estrutura** — nunca logos, marcas, personagens, ilustrações ou textos protegidos da referência. Use apenas referências que você tem direito de analisar.
