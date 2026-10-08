---
name: motion-copy-style
description: Motion Copy Style — analisa um vídeo de referência (motion graphics, animação, vinheta, product demo, explainer SaaS) quadro a quadro com medições automáticas (cortes, paleta em hex, ritmo, áudio), gera breakdown shot-by-shot e um Style Bible reutilizável, e entrega (a) prompt pronto para o Google Omni Flash, (b) recriação em HyperFrames (HTML + GSAP) renderizada em MP4 e/ou (c) projeto nativo do After Effects (comps, shapes, texto, keyframes com easing medido) montado via ExtendScript. Dois modos — replicar o vídeo ou aplicar o estilo dele a um conteúdo/roteiro novo. Use quando o usuário pedir para analisar/decupar/destrinchar um vídeo de referência, copiar ou recriar o estilo de um vídeo, "transformar este vídeo em prompt", gerar prompt para Omni Flash, refazer uma referência no HyperFrames ou no After Effects, ou fazer shot-by-shot breakdown de motion. Aceita overrides (marca/logo, paleta, textos, duração, tom, elementos, formatos).
---

# Motion Copy Style

Você atua como **diretor de motion graphics e prompt engineer**. A partir de um vídeo de referência, você mede, decupa e destila o estilo, e então o reproduz.

Arquivos desta skill (`~/.claude/skills/motion-copy-style/`):
- `scripts/analyze.mjs` — análise automática (Node + ffmpeg, sem dependências) e comparação lado a lado
- `references/style-bible.md` — template do Style Bible
- `references/omni-flash.md` — regras e template do prompt Omni Flash
- `references/hyperframes.md` — build brief, entrega técnica e validação HyperFrames
- `references/after-effects.md` — build brief, easing medido → AE, render e validação After Effects (usa a skill `after-effects`)

## Passo 0 — Briefing

Colete do pedido (pergunte só o que faltar e for decisivo, tudo de uma vez):

| Item | Opções / padrão |
|---|---|
| **Referência** | caminho local (obrigatório) ou URL. URL: baixe com `yt-dlp` (se ausente: `winget install yt-dlp`) só para análise. Várias referências: analise cada uma e funda os estilos, dizendo de qual veio cada traço. |
| **Modo** | `replicar` (padrão) — mesma estrutura e beats · `estilo` — aplicar o estilo a conteúdo novo (roteiro, copy, lista de cenas ou tema do usuário) |
| **Destino** | um ou mais de: `omni` (padrão) · `hyperframes` · `aftereffects` · `todos`. Menção a HyperFrames, render web/"fazer aqui" → `hyperframes`; After Effects, AE, .aep, projeto editável para a equipe → `aftereffects`. |
| **Overrides** | marca/logo, paleta, textos/copy, duração, tom/estilo, elementos a adicionar/remover. Se existir um `DNA.md` de marca (skill `human-dna`) no projeto, use-o como fonte de overrides. |
| **Formatos** | aspect ratios de saída (16:9, 9:16, 1:1) e entrega (redes, broadcast, overlay com alpha) — ver `references/hyperframes.md` / `references/after-effects.md` |
| **Pasta** | pasta de projeto do usuário. Se estiver numa pasta temporária, sugira mover antes de construir. |

Tudo que não for especificado segue fiel à referência.

**Direitos autorais:** copie estilo, ritmo e estrutura — nunca logos, marcas, personagens, ilustrações proprietárias ou textos do original na saída final. Substitua por equivalentes genéricos ou pelos overrides.

## Passo 1 — Medição automática

```bash
node ~/.claude/skills/motion-copy-style/scripts/analyze.mjs "<video>" "<projeto>/analysis"
```
Gera `analysis.json`/`analysis.md` com: metadados (duração, resolução, aspect, fps, áudio), **cenas com início/fim exatos**, **paleta dominante em hex por cena** (com % de área), **curva de energia de movimento** a cada 0,5 s (0 = hold), cortes/s; além de `sheets/` (contact sheets 6×6), `scenes/` (keyframe do meio de cada cena), `frames/` (amostragem regular) e `audio.wav`.

Ajustes: `--threshold 0.2` se cortes suaves/dissolves não forem detectados (ou 0.4 se houver cortes falsos em movimentos rápidos); `--fps N` para mais densidade. Se `ffmpeg` faltar: `winget install Gyan.FFmpeg`.

Use os números medidos como verdade; o olho entra para o que a máquina não mede.

## Passo 2 — Inspeção visual (vídeo INTEIRO)

1. Leia todos os contact sheets primeiro (visão geral, início ao fim).
2. Leia o keyframe de cada cena.
3. Para cada transição e animação relevante, extraia frames densos (10–30 fps) no trecho e meça o movimento:
   ```bash
   ffmpeg -v error -ss <ini> -to <fim> -i "<video>" -vf "fps=24,scale=960:-2" "<projeto>/analysis/zoom/t_%03d.jpg"
   ```
   Conte frames para medir **duração** de cada animação; observe onde a posição muda mais rápido para inferir o **easing** (rápido no início e assentando = `out`; overshoot visível = `back`; constante = linear) e o **stagger** entre elementos.
4. **Tipografia:** classifique (sans geométrica/grotesca/humanista, serif, mono, display), peso, caixa, tracking, e sugira 1–2 equivalentes no Google Fonts. Não afirme o nome exato da fonte sem certeza — marque `≈`.
5. **Áudio:** descreva mood, instrumentação, BPM aproximado e SFX com timestamps. Para batidas use o `beats` da CLI do HyperFrames; para narração, `transcribe` (skill `hyperframes-cli`). Se não der para ouvir/transcrever, diga isso — nunca invente áudio.

## Passo 3 — Breakdown shot-by-shot

Salve em `<projeto>/reference-breakdown.md`.

**Resumo no topo:** duração, resolução, aspect, fps · estilo visual em uma linha · pacing (cenas, cortes/s, holds) · motivo recorrente.

**Por cena/beat:**
| Campo | O que descrever |
|---|---|
| Timestamp | `00:00.0–00:02.4` (do `analysis.json`) |
| Composição e câmera | enquadramento, movimento, profundidade de campo, ponto focal |
| Elementos | cada objeto/ícone/ilustração/3D: forma, estilo, posição (grid/terços), tamanho relativo |
| Texto e tipografia | texto exato, fonte (≈), peso, hierarquia, cor, animação |
| Paleta | hex medidos + gradientes |
| Luz, sombra, textura | glow, soft shadow, grain, glass, bevel… |
| Ícones e UI | cards, botões, cursores, gráficos, estados |
| Movimento e transição | duração medida, easing, overshoot, stagger, e como entra no próximo beat |
| Áudio | mood, SFX sincronizados, voz |

Marque estimativas com `≈` e incertezas com `(?)`.

## Passo 4 — Style Bible

Destile o estilo em `<projeto>/style-bible.md` seguindo `references/style-bible.md`: tokens de cor, tipografia, linguagem de movimento (durações, easings, stagger, câmera, ritmo), catálogo de transições, elementos recorrentes, som, composição e **anti-padrões**. É o documento que permite reaplicar o estilo em qualquer vídeo futuro.

**Modo `estilo`:** mapeie o conteúdo novo para a estrutura da referência — cada mensagem nova ocupa o "papel" de um beat equivalente (abertura/hook, desenvolvimento, prova/feature, CTA, assinatura), respeitando durações típicas, transições do catálogo e hierarquia tipográfica. Monte uma tabela "beat de referência → beat novo" antes de gerar as saídas.

## Passo 5 — Overrides

Aplique todos os overrides em **toda** a saída (breakdown adaptado, Style Bible, prompt, build brief) de forma consistente. Se um override conflitar com um anti-padrão do estilo (ex.: paleta de marca sem contraste no fundo da referência), resolva com a menor adaptação possível e avise.

## Passo 6 — Saídas

- **Omni Flash** (`omni`): siga `references/omni-flash.md` — bloco único em inglês, compressão para 10 s ou sequência de clipes com continuidade. Salve em `omni-prompt.txt`.
- **HyperFrames** (`hyperframes`): siga `references/hyperframes.md` — build brief, construção via skill `hyperframes`, entrega técnica (redes / broadcast 29,97 / ProRes 4444 alpha) e validação com `analyze.mjs compare`.
- **After Effects** (`aftereffects`): siga `references/after-effects.md` — build brief, construção por etapas via skill `after-effects` (comps por cena, `STYLE_CTRL` com as cores, easing medido em `KeyframeEase`, markers nos beats, referência como guide layer), render pela Render Queue e validação com `analyze.mjs compare`.

## Passo 7 — Checklist antes de entregar

- [ ] Analisei o vídeo do início ao fim (todos os contact sheets lidos)
- [ ] Todas as cenas do `analysis.json` aparecem no breakdown, com timestamps batendo
- [ ] Cores em hex medidas, não chutadas
- [ ] Durações e easings das animações principais foram medidos em frames densos
- [ ] Nenhum logo/marca/personagem/texto protegido da referência na saída final
- [ ] Overrides aplicados em todas as seções; o resto fiel à referência
- [ ] Omni: bloco único, sem perguntas/comentários, timeline somando a duração declarada
- [ ] HyperFrames / After Effects: render validado lado a lado; diferenças restantes listadas
- [ ] After Effects: projeto salvo como arquivo novo, fontes substituídas listadas, scripts `.jsx` salvos em `ae/scripts/`

## Estrutura do projeto

```
<projeto>/
  analysis/            saída do analyze.mjs (json, md, sheets, scenes, frames, zoom, audio.wav)
  reference-breakdown.md
  style-bible.md
  omni-prompt.txt      (ou omni-prompt-01.txt, -02…)
  <projeto HyperFrames>/  + compare/
  ae/                  <nome>_v001.aep, scripts/*.jsx, renders  + compare_ae/
```

## Entrega no chat

1. **Resumo geral**
2. **Breakdown shot-by-shot** (ou link para `reference-breakdown.md` se for longo)
3. **Style Bible** resumido (cores, tipografia, movimento em poucas linhas)
4. **Prompt Omni Flash** em bloco de código — se `omni`
5. **HyperFrames** — caminho do MP4 e diferenças restantes em relação à referência — se `hyperframes`
6. **After Effects** — caminho do `.aep`, comps criadas, fontes substituídas, renders e diferenças restantes — se `aftereffects`
