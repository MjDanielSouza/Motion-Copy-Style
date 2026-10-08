#!/usr/bin/env node
// Motion Copy Style — automated reference-video analysis (Node + ffmpeg, no npm deps).
//
//   node analyze.mjs <video> <outDir> [--fps N] [--threshold 0.3] [--sheet 36]
//   node analyze.mjs compare <reference> <render> <outDir> [--points 8]
//
// analyze → outDir/
//   analysis.json      metadata, scenes (start/end/duration), palette per scene, motion energy curve, audio info
//   analysis.md        the same in readable form
//   sheets/sheet_XX.jpg contact sheets (6x6, frames evenly spaced; timestamps in analysis.json)
//   scenes/scene_XX.jpg one keyframe at the middle of each scene
//   frames/f_XXXX.jpg  regular sampling (timestamp = (n-1)/fps)
//   audio.wav          16 kHz mono (if the video has audio)
// compare → outDir/compare_XX.jpg side by side (reference | render) at the same timestamps

import { spawnSync } from 'node:child_process';
import { mkdirSync, writeFileSync, readFileSync, existsSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';

const args = process.argv.slice(2);
const opt = (name, def) => {
  const i = args.indexOf(`--${name}`);
  if (i === -1) return def;
  const v = args[i + 1];
  args.splice(i, 2);
  return Number(v);
};

function run(cmd, cmdArgs, { cwd, binary = false } = {}) {
  const r = spawnSync(cmd, cmdArgs, { cwd, maxBuffer: 1 << 30, encoding: binary ? 'buffer' : 'utf8' });
  if (r.error) throw new Error(`${cmd} not found or failed: ${r.error.message}. Install ffmpeg (winget install Gyan.FFmpeg).`);
  if (r.status !== 0) throw new Error(`${cmd} ${cmdArgs.join(' ')}\n${r.stderr}`);
  return r.stdout;
}

function probe(video) {
  const j = JSON.parse(run('ffprobe', ['-v', 'error', '-show_entries',
    'format=duration:stream=codec_type,codec_name,width,height,r_frame_rate,sample_rate,channels',
    '-of', 'json', video]));
  const v = j.streams.find(s => s.codec_type === 'video');
  const a = j.streams.find(s => s.codec_type === 'audio');
  if (!v) throw new Error('No video stream found.');
  const [n, d] = v.r_frame_rate.split('/').map(Number);
  const g = (x, y) => (y ? g(y, x % y) : x);
  const k = g(v.width, v.height);
  return {
    duration: Number(Number(j.format.duration).toFixed(3)),
    width: v.width, height: v.height,
    aspect: `${v.width / k}:${v.height / k}`,
    fps: Number((n / (d || 1)).toFixed(3)),
    codec: v.codec_name,
    audio: a ? { codec: a.codec_name, sampleRate: Number(a.sample_rate), channels: a.channels } : null,
  };
}

const hex = c => '#' + c.map(x => Math.round(x).toString(16).padStart(2, '0')).join('').toUpperCase();

// Dominant colors of the frame at time t: 4-bit/channel histogram, merge near bins, top 6 by area.
function palette(video, t, w, h) {
  const W = 96, H = Math.max(2, Math.round((96 * h) / w / 2) * 2);
  const buf = run('ffmpeg', ['-v', 'error', '-ss', String(t), '-i', video, '-frames:v', '1',
    '-vf', `scale=${W}:${H}`, '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-'], { binary: true });
  const bins = new Map();
  for (let i = 0; i + 2 < buf.length; i += 3) {
    const key = ((buf[i] >> 4) << 8) | ((buf[i + 1] >> 4) << 4) | (buf[i + 2] >> 4);
    const b = bins.get(key) || { n: 0, r: 0, g: 0, b: 0 };
    b.n++; b.r += buf[i]; b.g += buf[i + 1]; b.b += buf[i + 2];
    bins.set(key, b);
  }
  const total = buf.length / 3;
  const merged = [];
  for (const b of [...bins.values()].sort((x, y) => y.n - x.n)) {
    const c = [b.r / b.n, b.g / b.n, b.b / b.n];
    const near = merged.find(m => Math.hypot(m.c[0] - c[0], m.c[1] - c[1], m.c[2] - c[2]) < 28);
    if (near) {
      const n = near.n + b.n;
      near.c = near.c.map((v, i) => (v * near.n + c[i] * b.n) / n);
      near.n = n;
    } else merged.push({ c, n: b.n });
  }
  return merged.sort((x, y) => y.n - x.n).slice(0, 6)
    .map(m => ({ hex: hex(m.c), pct: Number(((100 * m.n) / total).toFixed(1)) }))
    .filter(m => m.pct >= 0.5);
}

function analyze(video, outDir) {
  const fpsOverride = opt('fps', 0);
  const threshold = opt('threshold', 0.3);
  const perSheet = opt('sheet', 36);
  video = resolve(video); outDir = resolve(outDir);
  for (const d of ['frames', 'sheets', 'scenes']) mkdirSync(join(outDir, d), { recursive: true });

  const meta = probe(video);
  const D = meta.duration;
  const sampleFps = fpsOverride || (D <= 30 ? 2 : D <= 120 ? 1 : 0.5);

  // 1. Regular frame sampling
  run('ffmpeg', ['-v', 'error', '-y', '-i', video, '-vf', `fps=${sampleFps},scale=960:-2`, '-q:v', '3',
    join(outDir, 'frames', 'f_%04d.jpg')]);
  const frameCount = readdirSync(join(outDir, 'frames')).filter(f => f.endsWith('.jpg')).length;

  // 2. Per-frame scene-change score → cuts + motion energy
  run('ffmpeg', ['-v', 'error', '-i', video, '-an', '-vf',
    "scale=320:-2,select='gte(scene,0)',metadata=print:file=scores.txt", '-f', 'null', '-'], { cwd: outDir });
  const scores = [];
  let t = null;
  for (const line of readFileSync(join(outDir, 'scores.txt'), 'utf8').split(/\r?\n/)) {
    const mt = line.match(/pts_time:([\d.]+)/);
    if (mt) t = Number(mt[1]);
    const ms = line.match(/lavfi\.scene_score=([\d.]+)/);
    if (ms && t !== null) scores.push({ t, s: Number(ms[1]) });
  }
  const cuts = [];
  for (const { t, s } of scores) {
    if (s >= threshold && t > 0.1 && (!cuts.length || t - cuts[cuts.length - 1] >= 0.25)) cuts.push(Number(t.toFixed(3)));
  }
  const bounds = [0, ...cuts, D];
  const scenes = [];
  for (let i = 0; i < bounds.length - 1; i++) {
    const start = bounds[i], end = bounds[i + 1];
    if (end - start < 0.05) continue;
    const mid = Number(((start + end) / 2).toFixed(3));
    const idx = String(scenes.length + 1).padStart(2, '0');
    run('ffmpeg', ['-v', 'error', '-y', '-ss', String(mid), '-i', video, '-frames:v', '1',
      '-vf', 'scale=960:-2', '-q:v', '3', join(outDir, 'scenes', `scene_${idx}.jpg`)]);
    scenes.push({
      id: scenes.length + 1, start: Number(start.toFixed(3)), end: Number(end.toFixed(3)),
      duration: Number((end - start).toFixed(3)), keyframe: `scenes/scene_${idx}.jpg`,
      palette: palette(video, mid, meta.width, meta.height),
    });
  }

  // Motion energy per 0.5 s (mean scene score ×100): high = fast motion/transitions, ~0 = hold
  const energy = [];
  for (let b = 0; b < D; b += 0.5) {
    const win = scores.filter(x => x.t >= b && x.t < b + 0.5);
    const mean = win.length ? win.reduce((a, x) => a + x.s, 0) / win.length : 0;
    energy.push({ t: b, e: Number((mean * 100).toFixed(1)) });
  }
  const holds = energy.filter(x => x.e < 0.3).map(x => x.t);

  // 3. Contact sheets (6x6), evenly spaced
  const sheetFps = perSheet / D;
  run('ffmpeg', ['-v', 'error', '-y', '-i', video, '-vf',
    `fps=${sheetFps},scale=320:-2,tile=6x${Math.ceil(perSheet / 6)}:padding=4:color=white`, '-q:v', '3',
    join(outDir, 'sheets', 'sheet_%02d.jpg')]);
  const sheetTimes = Array.from({ length: perSheet }, (_, i) => Number(((i + 0.5) / sheetFps).toFixed(2)));

  // 4. Audio
  let audio = null;
  if (meta.audio) {
    run('ffmpeg', ['-v', 'error', '-y', '-i', video, '-vn', '-ac', '1', '-ar', '16000', join(outDir, 'audio.wav')]);
    audio = { file: 'audio.wav', ...meta.audio };
    // volumedetect reports on stderr
    const r = spawnSync('ffmpeg', ['-hide_banner', '-i', video, '-vn', '-af', 'volumedetect', '-f', 'null', '-'], { encoding: 'utf8' });
    const mean = r.stderr.match(/mean_volume: ([-\d.]+) dB/);
    const max = r.stderr.match(/max_volume: ([-\d.]+) dB/);
    if (mean) audio.meanVolumeDb = Number(mean[1]);
    if (max) audio.maxVolumeDb = Number(max[1]);
    if (audio.maxVolumeDb !== undefined && audio.maxVolumeDb < -50) audio.note = 'Audio track is (near) silent.';
  }

  const result = {
    video, ...meta,
    sampling: { fps: sampleFps, frames: frameCount, timestampOf: '(n-1)/fps', dir: 'frames/' },
    sceneThreshold: threshold, cutsPerSecond: Number((cuts.length / D).toFixed(2)),
    averageSceneLength: Number((D / scenes.length).toFixed(2)),
    scenes, energy, holdsAt: holds,
    sheets: { perSheet, frameTimes: sheetTimes, dir: 'sheets/' },
    audio,
  };
  writeFileSync(join(outDir, 'analysis.json'), JSON.stringify(result, null, 2));

  const md = [
    `# Analysis — ${video}`,
    `- Duration: ${D}s · ${meta.width}x${meta.height} (${meta.aspect}) · ${meta.fps} fps · ${meta.codec}`,
    `- Audio: ${audio ? `${audio.codec}, ${audio.channels}ch, mean ${audio.meanVolumeDb} dB, max ${audio.maxVolumeDb} dB${audio.note ? ' — ' + audio.note : ''}` : 'none'}`,
    `- Scenes detected: ${scenes.length} (threshold ${threshold}) · avg ${result.averageSceneLength}s · ${result.cutsPerSecond} cuts/s`,
    `- Sampled frames: ${frameCount} @ ${sampleFps} fps in frames/ (timestamp = (n-1)/${sampleFps})`,
    '', '## Scenes', '| # | start | end | dur | palette (area %) |', '|---|---|---|---|---|',
    ...scenes.map(s => `| ${s.id} | ${s.start} | ${s.end} | ${s.duration} | ${s.palette.map(p => `${p.hex} ${p.pct}%`).join(', ')} |`),
    '', '## Motion energy (per 0.5 s, 0 = static hold)',
    energy.map(x => `${x.t.toFixed(1)}s:${x.e}`).join('  '),
    '', `Contact sheets in sheets/ — ${perSheet} frames each, row-major, times: ${sheetTimes.join(', ')}`,
  ].join('\n');
  writeFileSync(join(outDir, 'analysis.md'), md);
  console.log(md);
}

function compare(ref, render, outDir) {
  const points = opt('points', 8);
  ref = resolve(ref); render = resolve(render); outDir = resolve(outDir);
  mkdirSync(outDir, { recursive: true });
  const a = probe(ref), b = probe(render);
  const H = 540;
  for (let i = 0; i < points; i++) {
    const f = (i + 0.5) / points;
    const ta = (a.duration * f).toFixed(3), tb = (b.duration * f).toFixed(3);
    const out = join(outDir, `compare_${String(i + 1).padStart(2, '0')}.jpg`);
    run('ffmpeg', ['-v', 'error', '-y', '-ss', ta, '-i', ref, '-ss', tb, '-i', render, '-filter_complex',
      `[0:v]scale=-2:${H},setsar=1[a];[1:v]scale=-2:${H},setsar=1[b];[a][b]hstack=inputs=2`, '-frames:v', '1', '-q:v', '3', out]);
    console.log(`compare_${String(i + 1).padStart(2, '0')}.jpg  ref ${ta}s | render ${tb}s`);
  }
  if (Math.abs(a.duration - b.duration) > 0.1) console.log(`Note: durations differ (ref ${a.duration}s, render ${b.duration}s); frames matched proportionally.`);
}

try {
  if (args[0] === 'compare') {
    if (args.length < 4) throw new Error('Usage: node analyze.mjs compare <reference> <render> <outDir> [--points 8]');
    compare(args[1], args[2], args[3]);
  } else {
    if (args.length < 2 || !existsSync(args[0])) throw new Error('Usage: node analyze.mjs <video> <outDir> [--fps N] [--threshold 0.3] [--sheet 36]');
    analyze(args[0], args[1]);
  }
} catch (e) {
  console.error(e.message);
  process.exit(1);
}
