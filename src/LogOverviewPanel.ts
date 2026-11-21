'use strict';

import * as path from 'path';
import * as vscode from 'vscode';
import { FoldingMode } from './LogFolding';
import { computeHistogram } from './LogHistogram';
import { AllLogLevels, LogLevel, logLevelName } from './LogLevelParser';
import { FoldingModeNames, LogOverview } from './LogOverview';

/** Messages from the webview. */
type Message =
    | { type: 'ready' }
    | { type: 'toggleLevel'; level: LogLevel }
    | { type: 'addText'; text: string }
    | { type: 'removeText'; text: string }
    | { type: 'setFolding'; mode: FoldingMode }
    | { type: 'goToLine'; line: number }
    | { type: 'next'; level: LogLevel }
    | { type: 'showAll' };

/**
 * The Log Overview panel next to the terminal (#75, #99): a summary of the current log, a chart of its entries
 * over time, and controls to hide levels and text and to fold the log. It's a webview, styled with the theme's
 * colors, that gets its data in messages.
 */
export class LogOverviewPanel implements vscode.WebviewViewProvider, vscode.Disposable {

    private view: vscode.WebviewView | undefined;
    private readonly disposables: vscode.Disposable[] = [];
    private updateTimer: NodeJS.Timeout | undefined;

    constructor(private readonly overview: LogOverview) {
        this.disposables.push(
            vscode.window.registerWebviewViewProvider('logFileHighlighter.overviewPanel', this),
            overview.onDidChange(() => this.scheduleUpdate()),
            vscode.window.onDidChangeTextEditorVisibleRanges((e) => {
                if (e.textEditor.document === this.overview.currentLog()) {
                    this.postViewport(e.textEditor);
                }
            }),
        );
    }

    public dispose() {
        clearTimeout(this.updateTimer);
        this.disposables.forEach((d) => d.dispose());
    }

    public resolveWebviewView(view: vscode.WebviewView): void {
        this.view = view;
        view.webview.options = { enableScripts: true };
        view.webview.html = this.html();
        view.webview.onDidReceiveMessage((m: Message) => this.onMessage(m));
        view.onDidChangeVisibility(() => this.scheduleUpdate());
        view.onDidDispose(() => { this.view = undefined; });
    }

    private async onMessage(message: Message) {
        const document = this.overview.currentLog();
        if (message.type === 'ready') {
            this.update();
            return;
        }
        if (!document) {
            return;
        }
        switch (message.type) {
            case 'toggleLevel':
                await this.overview.updateState(document, (s) => {
                    if (s.hiddenLevels.has(message.level)) {
                        s.hiddenLevels.delete(message.level);
                    } else {
                        s.hiddenLevels.add(message.level);
                    }
                });
                break;
            case 'addText':
                if (message.text) {
                    await this.overview.updateState(document, (s) => {
                        if (!s.hiddenTexts.includes(message.text)) {
                            s.hiddenTexts.push(message.text);
                        }
                    });
                }
                break;
            case 'removeText':
                await this.overview.updateState(document, (s) => { s.hiddenTexts = s.hiddenTexts.filter((t) => t !== message.text); });
                break;
            case 'setFolding':
                await this.overview.updateState(document, (s) => { s.foldingMode = message.mode; });
                break;
            case 'showAll':
                await this.overview.updateState(document, (s) => { s.hiddenLevels.clear(); s.hiddenTexts = []; });
                break;
            case 'goToLine':
                await this.overview.goToLine(document.uri, message.line);
                break;
            case 'next':
                await this.overview.goToNext(message.level);
                break;
        }
    }

    /** Updates the panel soon, once for many changes, e.g. while a log grows in tail mode. */
    private scheduleUpdate() {
        clearTimeout(this.updateTimer);
        this.updateTimer = setTimeout(() => this.update(), 150);
    }

    private update() {
        if (!this.view?.visible) {
            return;
        }
        const document = this.overview.currentLog();
        if (!document) {
            this.view.webview.postMessage({ type: 'empty' });
            return;
        }
        const summary = this.overview.getSummary(document);
        const { analysis } = this.overview.getInfo(document);
        const histogram = computeHistogram(analysis, (line) => document.lineAt(line).text);
        const state = summary.state;
        this.view.description = path.basename(document.fileName);
        this.view.webview.postMessage({
            type: 'update',
            fileName: path.basename(document.fileName),
            lineCount: summary.lineCount,
            hiddenLineCount: summary.hiddenLineCount,
            from: summary.from,
            to: summary.to,
            timeSpan: summary.timeSpan,
            levels: AllLogLevels
                .filter((level) => summary.entryCounts[level] > 0 || (level >= LogLevel.Debug && level <= LogLevel.Error))
                .map((level) => ({ level, name: logLevelName(level), count: summary.entryCounts[level], shown: !state.hiddenLevels.has(level) })),
            hiddenTexts: state.hiddenTexts,
            foldingMode: state.foldingMode,
            foldingModes: Object.keys(FoldingModeNames).map((mode) => ({ mode, name: FoldingModeNames[mode] })),
            histogram: histogram && {
                bucketSize: histogram.bucketSize,
                hasDates: histogram.hasDates,
                buckets: histogram.buckets.map((b) => ({ start: b.start, counts: b.counts, firstLine: b.firstLine, lastLine: b.lastLine })),
            },
        });
        const editor = vscode.window.visibleTextEditors.find((e) => e.document === document);
        if (editor) {
            this.postViewport(editor);
        }
    }

    private postViewport(editor: vscode.TextEditor) {
        const ranges = editor.visibleRanges;
        if (this.view?.visible && ranges.length > 0) {
            this.view.webview.postMessage({ type: 'viewport', firstLine: ranges[0].start.line, lastLine: ranges[ranges.length - 1].end.line });
        }
    }

    private html(): string {
        const nonce = Array.from({ length: 32 }, () => Math.floor(Math.random() * 36).toString(36)).join('');
        return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'nonce-${nonce}'; script-src 'nonce-${nonce}';">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Log Overview</title>
<style nonce="${nonce}">${panelCss}</style>
</head>
<body>
<p id="empty" class="muted">Open a log file to see a summary of it, and to show or hide its log levels.</p>
<main id="main" hidden>
  <section class="stats" aria-label="Summary">
    <div class="stat"><span class="k">LINES</span><span class="v" id="lines"></span><span class="muted" id="hidden"></span></div>
    <div class="stat" id="spanStat"><span class="k">TIME SPAN</span><span class="v" id="span"></span><span class="muted" id="fromTo"></span></div>
    <div class="row">
      <button class="stat link" id="errors" title="Go to the next error"><span class="k">ERRORS</span><span class="v err" id="errorCount"></span></button>
      <button class="stat link" id="warnings" title="Go to the next warning"><span class="k">WARNINGS</span><span class="v warn" id="warningCount"></span></button>
    </div>
  </section>
  <section class="chart" aria-label="Entries over time">
    <div class="charthead"><span id="chartTitle"></span><span class="legend" id="legend"></span></div>
    <div class="bars" id="bars"></div>
    <div class="axis" id="axis"></div>
  </section>
  <section class="controls" aria-label="Show and hide">
    <span class="k">SHOW LEVELS</span>
    <div class="toggles" id="toggles"></div>
    <label class="k" for="hideText">HIDE ENTRIES CONTAINING</label>
    <input id="hideText" type="text" placeholder="Text, then Enter">
    <div class="toggles" id="texts"></div>
    <label class="k" for="folding">FOLD</label>
    <select id="folding"></select>
    <button class="linkbtn" id="showAll">Show all lines</button>
  </section>
</main>
<script nonce="${nonce}">${panelScript}</script>
</body>
</html>`;
    }
}

const panelCss = `
body { padding: 6px 12px 10px; color: var(--vscode-foreground); font-family: var(--vscode-font-family); font-size: var(--vscode-font-size); }
.muted { color: var(--vscode-descriptionForeground); font-size: 12px; }
main { display: flex; flex-wrap: wrap; gap: 16px 28px; }
.stats { flex: 0 0 180px; display: flex; flex-direction: column; gap: 10px; }
.stat { display: flex; flex-direction: column; gap: 2px; text-align: left; }
.row { display: flex; gap: 24px; }
.k { font-size: 11px; letter-spacing: .04em; color: var(--vscode-descriptionForeground); }
.v { font-size: 18px; font-weight: 500; }
.err { color: var(--vscode-errorForeground); }
.warn { color: var(--vscode-editorWarning-foreground); }
button.link { background: none; border: 0; padding: 0; color: inherit; font: inherit; cursor: pointer; }
button.link:hover .v, button.link:focus-visible .v { text-decoration: underline; }
.chart { flex: 1 1 360px; min-width: 0; display: flex; flex-direction: column; gap: 6px; }
.charthead { display: flex; justify-content: space-between; flex-wrap: wrap; gap: 8px; font-size: 12px; color: var(--vscode-descriptionForeground); }
.legend { display: flex; gap: 12px; }
.legend span { display: flex; align-items: center; gap: 5px; }
.sw { width: 9px; height: 9px; border-radius: 2px; display: inline-block; }
.bars { height: 150px; display: flex; align-items: flex-end; gap: 2px; border-bottom: 1px solid var(--vscode-panel-border); position: relative; }
.bar { flex: 1 1 0; min-width: 2px; height: 100%; display: flex; flex-direction: column-reverse; background: none; border: 0; padding: 0; cursor: pointer; }
.bar:hover, .bar:focus-visible { outline: 1px solid var(--vscode-focusBorder); }
.bar.inview { background: var(--vscode-editor-selectionHighlightBackground, rgba(55,148,255,.15)); }
.seg { display: block; width: 100%; }
.c5 { background: var(--vscode-errorForeground); }
.c4 { background: var(--vscode-editorWarning-foreground); }
.c3 { background: var(--vscode-charts-green, #89d185); }
.c2, .c1, .c0 { background: var(--vscode-descriptionForeground); opacity: .55; }
.hiddenseg { background: repeating-linear-gradient(45deg, var(--vscode-descriptionForeground) 0 2px, transparent 2px 5px); opacity: .5; }
.axis { display: flex; justify-content: space-between; font-size: 11px; color: var(--vscode-descriptionForeground); }
.controls { flex: 0 1 280px; display: flex; flex-direction: column; gap: 8px; }
.toggles { display: flex; flex-wrap: wrap; gap: 6px; }
.tog { font-family: var(--vscode-editor-font-family); font-size: 12px; min-height: 26px; padding: 0 10px; border-radius: 13px; cursor: pointer;
       border: 1px solid var(--vscode-button-secondaryBackground, #555); background: var(--vscode-button-secondaryBackground); color: var(--vscode-button-secondaryForeground); }
.tog[aria-pressed="true"] { border-color: var(--vscode-focusBorder); background: var(--vscode-button-background); color: var(--vscode-button-foreground); }
.tog[aria-pressed="false"] { text-decoration: line-through; opacity: .8; }
input, select { height: 26px; box-sizing: border-box; width: 100%; font: inherit; padding: 0 6px;
                background: var(--vscode-input-background); color: var(--vscode-input-foreground); border: 1px solid var(--vscode-input-border, transparent); }
select { background: var(--vscode-dropdown-background); color: var(--vscode-dropdown-foreground); border-color: var(--vscode-dropdown-border); }
input:focus, select:focus { outline: 1px solid var(--vscode-focusBorder); }
.linkbtn { align-self: flex-start; background: none; border: 0; padding: 0; font: inherit; color: var(--vscode-textLink-foreground); cursor: pointer; }
.linkbtn:hover { text-decoration: underline; }
`;

// Runs in the webview. Builds the panel from the messages the extension posts.
const panelScript = `
const vscode = acquireVsCodeApi();
const $ = (id) => document.getElementById(id);
const post = (m) => vscode.postMessage(m);
const fmt = (n) => n.toLocaleString('en-US');
let data;

$('errors').onclick = () => post({ type: 'next', level: 5 });
$('warnings').onclick = () => post({ type: 'next', level: 4 });
$('showAll').onclick = () => post({ type: 'showAll' });
$('folding').onchange = (e) => post({ type: 'setFolding', mode: e.target.value });
$('hideText').onkeydown = (e) => {
  if (e.key === 'Enter' && e.target.value.trim()) { post({ type: 'addText', text: e.target.value }); e.target.value = ''; }
};

function el(tag, props, children) {
  const e = document.createElement(tag);
  Object.assign(e, props || {});
  (children || []).forEach((c) => e.append(c));
  return e;
}

function label(time, size, hasDates, multiDay) {
  const d = new Date(time);
  const p = (n) => String(n).padStart(2, '0');
  const hm = p(d.getUTCHours()) + ':' + p(d.getUTCMinutes()) + (size < 60000 ? ':' + p(d.getUTCSeconds()) : '');
  return hasDates && multiDay ? (d.getUTCMonth() + 1) + '/' + d.getUTCDate() + ' ' + hm : hm;
}

function sizeName(ms) {
  return ms >= 86400000 ? (ms / 86400000) + ' day' : ms >= 3600000 ? (ms / 3600000) + ' h' : ms >= 60000 ? (ms / 60000) + ' min' : (ms / 1000) + ' s';
}

function render() {
  $('empty').hidden = !!data;
  $('main').hidden = !data;
  if (!data) { return; }
  $('lines').textContent = fmt(data.lineCount);
  $('hidden').textContent = data.hiddenLineCount > 0 ? fmt(data.hiddenLineCount) + ' hidden' : data.fileName;
  $('spanStat').hidden = !data.timeSpan;
  $('span').textContent = data.timeSpan || '';
  $('fromTo').textContent = data.from ? data.from + ' – ' + data.to : '';
  const count = (level) => (data.levels.find((l) => l.level === level) || { count: 0 }).count;
  $('errorCount').textContent = fmt(count(5));
  $('warningCount').textContent = fmt(count(4));

  $('toggles').replaceChildren(...data.levels.map((l) => {
    const b = el('button', { className: 'tog', textContent: l.name + ' ' + fmt(l.count), title: (l.shown ? 'Hide ' : 'Show ') + l.name });
    b.setAttribute('aria-pressed', String(l.shown));
    b.onclick = () => post({ type: 'toggleLevel', level: l.level });
    return b;
  }));
  $('texts').replaceChildren(...data.hiddenTexts.map((t) => {
    const b = el('button', { className: 'tog', textContent: '"' + t + '" ×', title: 'Show the entries with "' + t + '" again' });
    b.onclick = () => post({ type: 'removeText', text: t });
    return b;
  }));
  $('folding').replaceChildren(...data.foldingModes.map((m) => el('option', { value: m.mode, textContent: m.name, selected: m.mode === data.foldingMode })));

  const h = data.histogram;
  if (!h) {
    $('chartTitle').textContent = 'No timestamps to chart';
    $('bars').replaceChildren(); $('axis').replaceChildren(); $('legend').replaceChildren();
    return;
  }
  const shown = new Set(data.levels.filter((l) => l.shown).map((l) => l.level));
  $('chartTitle').textContent = 'Entries per ' + sizeName(h.bucketSize) + ' · click a bar to go there';
  $('legend').replaceChildren(...[[5, 'ERROR'], [4, 'WARN'], [3, 'INFO'], [2, 'DEBUG']].map(([lvl, name]) =>
    el('span', {}, [el('i', { className: 'sw ' + (shown.has(lvl) ? 'c' + lvl : 'hiddenseg') }), name])));
  const totals = h.buckets.map((b) => b.counts.reduce((a, c) => a + c, 0));
  const max = Math.max(1, ...totals);
  $('bars').replaceChildren(...h.buckets.map((b, i) => {
    const bar = el('button', { className: 'bar' });
    bar.dataset.first = b.firstLine; bar.dataset.last = b.lastLine;
    bar.setAttribute('aria-label', label(b.start, h.bucketSize, h.hasDates, true) + ': ' + b.counts[5] + ' errors, ' + b.counts[4] + ' warnings, ' + totals[i] + ' entries');
    bar.title = bar.getAttribute('aria-label');
    // The bars stack from the bottom, so errors and warnings end up on top. They're at least 3 px high, so a
    // single one in a busy bucket still shows.
    [0, 1, 2, 3, 4, 5].forEach((lvl) => {
      const n = b.counts[lvl];
      if (n === 0) { return; }
      const px = Math.max(lvl >= 4 ? 3 : 1, Math.round(n / max * 146));
      const seg = el('span', { className: 'seg ' + (shown.has(lvl) ? 'c' + lvl : 'hiddenseg') });
      seg.style.height = px + 'px';
      bar.append(seg);
    });
    if (b.firstLine >= 0) { bar.onclick = () => post({ type: 'goToLine', line: b.firstLine }); }
    return bar;
  }));
  const first = h.buckets[0].start, last = h.buckets[h.buckets.length - 1].start;
  const multiDay = last - first >= 86400000;
  const ticks = 6;
  $('axis').replaceChildren(...Array.from({ length: ticks }, (_, i) =>
    el('span', { textContent: label(first + (last - first) * i / (ticks - 1), h.bucketSize, h.hasDates, multiDay) })));
}

function showViewport(firstLine, lastLine) {
  document.querySelectorAll('.bar').forEach((bar) => {
    const f = +bar.dataset.first, l = +bar.dataset.last;
    bar.classList.toggle('inview', f >= 0 && l >= firstLine && f <= lastLine);
  });
}

window.addEventListener('message', (e) => {
  const m = e.data;
  if (m.type === 'update') { data = m; render(); }
  else if (m.type === 'empty') { data = undefined; render(); }
  else if (m.type === 'viewport') { showViewport(m.firstLine, m.lastLine); }
});
post({ type: 'ready' });
`;
