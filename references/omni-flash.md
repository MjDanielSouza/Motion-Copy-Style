# Saída Omni Flash

Bloco único, em inglês, direto e sem ambiguidade. **Sem perguntas nem comentários dentro do bloco.**

## Regras
- Recrie **estilo, ritmo e estrutura** — nunca logos, marcas, personagens ou textos protegidos do original (troque por genéricos ou pelos overrides).
- O Omni Flash gera **10 s nativos**. Duas estratégias para referências mais longas:
  - **Comprimir (padrão):** um único clipe de 10 s; cada beat mantém sua proporção relativa da duração original (`novo = original × 10 / duração_total`), com beats < 0,6 s fundidos ao vizinho.
  - **Sequência (`--clips` / quando o usuário quiser a duração real):** divida em N clipes de ≤ 10 s, cortando em limites de cena. Cada clipe é um bloco completo (STYLE e TYPOGRAPHY idênticos em todos) e o FINAL FRAME do clipe N é descrito como o primeiro frame do clipe N+1 (`CONTINUITY IN:`), para emendar na edição.
- Override de duração prevalece sobre as duas.
- Cores sempre em hex; formas com geometria explícita (ex.: "rounded rectangle 4:3, 24px radius, 1px #FFFFFF22 stroke"); tipografia descrita por estilo, não só por nome.
- Texto na tela: curto e exato, entre aspas. Modelos de vídeo erram texto longo — limite a ~5 palavras por cartela e avise no chat se a copy for maior.
- Inclua a linha `AVOID:` com o que quebraria o estilo (tirado dos anti-padrões do Style Bible).

## Template

```
STYLE: <uma frase densa: mood, iluminação, color grading, câmera, acabamento/qualidade>

TECH SPECS: <resolução>, <aspect ratio>, <fps>, <duração>s

TIMELINE:
0.0–X.Xs — <beat 1: composição, elementos com geometria, cores hex, texto exato + animação, movimento de câmera, transição para o próximo>
X.X–Y.Ys — <beat 2 ...>

TYPOGRAPHY (LOCKED): <família/estilo, pesos, hierarquia de tamanhos, cores, tracking, animação — igual em todo o vídeo>

SOUND DESIGN: <música/mood/BPM; SFX cronometrados aos beats, ex.: "whoosh at 2.1s, soft click at 4.0s"; voiceover se houver>

FINAL FRAME: <último frame congelado: composição, elementos, texto, cores, duração do hold>

AVOID: <o que quebra o estilo>
```

Salve também em `omni-prompt.txt` (ou `omni-prompt-01.txt`, `-02`… no modo sequência).
