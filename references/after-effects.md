# Saída After Effects

Reconstrói a referência como **projeto nativo do After Effects** (comps, shape layers, texto, keyframes com easing medido), editável pela equipe e renderizável pela Render Queue. Depende da skill `after-effects` (ExtendScript executado no AE aberto via `scripts/runner.ps1`) — **carregue-a e siga o fluxo dela** (contexto → rules → script com undo group → executar/confirmar). AE precisa estar aberto com "Allow Scripts to Write Files and Access Network" ativado.

## 1. Build brief (igual ao HyperFrames, adaptado ao AE)
Acrescente ao `reference-breakdown.md` a seção `## After Effects build brief`:

- **Projeto**: arquivo novo `<projeto>/ae/<nome>_v001.aep` — nunca altere um projeto existente do usuário sem confirmação.
- **Comp principal** `MCS_MAIN` com resolução, fps e duração (original, ou override). Broadcast: 1920×1080, 29,97 fps; um comp por formato pedido (`MCS_MAIN_9x16`, `MCS_MAIN_1x1`) reposicionando pela safe area.
- **Uma precomp por cena** `SC01_<nome>`, `SC02_…` com início/fim do `analysis.json`; transições como camadas próprias (`TR_01_wipe`) na comp principal.
- **Pastas**: `01_COMPS`, `02_PRECOMPS`, `03_ASSETS`, `04_REF`.
- **Controle de estilo**: um null `STYLE_CTRL` na comp principal com Color Controls (`bg`, `surface`, `accent`, `text`) — todas as cores das camadas ligadas por expressão a ele, para trocar a paleta inteira em um lugar.
- **Texto**: text layers com texto exato, fonte, tamanho, tracking e cor; animação por Text Animator (range selector por palavra/linha) quando a referência anima por partes.
- **Formas/ícones/UI**: shape layers (retângulos com roundness, elipses, paths); ícones complexos como SVG importado → "Create Shapes from Vector Layer" (ou desenhados em path).
- **Câmera**: push-in/pan em um null pai de todas as camadas da cena, ou camera layer 3D se houver parallax real.
- **Efeitos**: glow, grain (Add Grain/Noise), blur, gradiente (Gradient Ramp / 4-Color) — use os nativos do AE; plugins de terceiros só se o usuário confirmar que tem.
- **Áudio**: trilha e SFX como camadas posicionadas nos timestamps; **markers** na comp principal em cada beat/corte (`comment` = nome do beat), para facilitar ajuste de sync.
- **Referência**: importe o vídeo original em `04_REF` e coloque na comp principal como **guide layer** desligado (não renderiza), para comparar com o olho no próprio AE.

## 2. Easing medido → AE
GSAP/descrição → `KeyframeEase(speed, influence)`. Em cada par de keyframes, `out` do primeiro e `in` do segundo (valores aproximados):

| Easing observado | outgoing do key A | incoming do key B |
|---|---|---|
| linear | interpolação LINEAR | LINEAR |
| sine.inOut / Easy Ease | 33% | 33% |
| power2.out | 10% | 75% |
| power3.out / expo.out | 5% | 90% |
| power2.in | 75% | 10% |
| power3.inOut | 80% | 80% |
| back.out (overshoot) | key extra passando ≈ 5–10% do valor final e assentando em ≈ 0,15 s; ou expressão de overshoot | |
| elastic | expressão de inertial bounce no property | |

```jsx
// speed 0 = parte/chega parada; influence em %
var easeA = new KeyframeEase(0, 5), easeB = new KeyframeEase(0, 90);
prop.setTemporalEaseAtKey(1, [easeA], [easeA]);
prop.setTemporalEaseAtKey(2, [easeB], [easeB]);
// Propriedades multidimensionais (Scale, Position separada) precisam de um KeyframeEase por dimensão.
```
Stagger: escalone os keyframes por camada (`layer-stagger.jsx` da skill `after-effects` faz isso em lote). Para replicar um ease já ajustado em várias camadas, `copy-ease.jsx`.

## 3. Fontes
Antes de criar o texto, verifique se a fonte (ou o equivalente sugerido) está instalada — consulte `app.fonts` (exemplo em `ae-fontcheck.jsx` da skill `after-effects`). Se não estiver, use o equivalente instalado mais próximo e liste as substituições na entrega.

## 4. Execução
1. Gere **um script de construção por etapa** (estrutura/pastas/comps → cena a cena → transições/áudio/markers → render queue), cada um em `app.beginUndoGroup`, salvando via `incremental-save.jsx` ao final de cada etapa. Scripts grandes demais em uma única chamada travam e são difíceis de depurar.
2. Salve os `.jsx` gerados em `<projeto>/ae/scripts/` para o usuário poder reexecutar.
3. Depois de cada etapa, confira com `comp-detail.jsx` (camadas, tempos) e `expression-errors.jsx`.

## 5. Render
Render Queue com `MCS_MAIN` (e variantes de formato):
- **Redes**: H.264 MP4 (template do AE ou via Media Encoder).
- **Broadcast**: ProRes 422 HQ, 29,97 fps.
- **Overlay com alpha**: ProRes 4444 com canal **RGB + Alpha**, sem camada de fundo sólido.
Confirme com o usuário antes de disparar o render (pode ser longo). Liste os templates disponíveis antes de aplicar um (`om.templates`), pois os nomes variam por versão.

## 6. Validação contra a referência
```bash
node ~/.claude/skills/motion-copy-style/scripts/analyze.mjs compare "<referencia>" "<render>" "<projeto>/compare_ae" --points 10
```
Leia os `compare_XX.jpg`, rode `analyze.mjs` no render e compare tempos de corte e curva de energia. Ajuste keyframes/eases, renderize de novo — no máximo 3 rodadas antes de mostrar ao usuário — e relate as diferenças restantes.
