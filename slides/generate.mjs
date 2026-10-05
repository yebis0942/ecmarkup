// Generates the 12 slide artboards (.dc.html) + canvas.json for the canvas
// editor, plus present.html — a standalone arrow-key presenter — for the
// "APIdock を ECMAScript 仕様書に移植する" talk template.
// Shared visual system: APIdock dark red #8B1A10 + TC39 orange #fc7c00 used
// only as accents on a plain white ground — no chrome, no background tint;
// the page number is the single running element. IBM Plex resolved locally
// (the spec's own faces; no webfont fetch, see FONT_SANS/FONT_MONO).
import { writeFileSync } from 'node:fs';

const TOTAL = 13;

const C = {
  red: '#8B1A10',
  redDark: '#6e130b',
  orange: '#fc7c00',
  paper: '#ffffff',
  card: '#ffffff',
  line: '#e3d9c8',
  ink: '#241d19',
  sub: '#6b5f54',
  green: '#3f9c35',
  codeBg: '#2a1712',
  codeFg: '#f3e6d8',
};

// No webfont fetch: mirror css/elements.css, which declares IBM Plex with
// `src: local(...)` only. Named first so a locally installed Plex is used,
// then the platform's own JP faces.
const FONT_SANS =
  "'IBM Plex Sans JP', 'IBM Plex Sans', 'Hiragino Sans', 'Noto Sans JP', 'Yu Gothic UI', system-ui, sans-serif";
const FONT_MONO = "'IBM Plex Mono', ui-monospace, SFMono-Regular, Menlo, Consolas, monospace";

const mono = t => `<span style="font-family: ${FONT_MONO};">${t}</span>`;

// The 1280x720 slide itself, with no host chrome — shared by the canvas
// artboards (.dc.html) and the standalone presenter (present.html).
function slideMarkup(pageNo, bodyHtml, { title = null } = {}) {
  const head = title
    ? `<h1 style="margin: 0; font-size: 44px; line-height: 1.25; font-weight: 700; color: ${C.ink};">${title}</h1>`
    : '';
  return `<div style="width: 1280px; height: 720px; position: relative; background: ${C.paper}; color: ${C.ink}; overflow: hidden; display: flex; flex-direction: column;">
  <div style="flex: 1; min-height: 0; padding: 36px 64px 20px 64px; display: flex; flex-direction: column; gap: 22px;">
    ${head}
    ${bodyHtml}
  </div>
  <div style="flex: none; display: flex; justify-content: flex-end; padding: 0 64px 18px 64px;">
    <div style="font-size: 15px; font-weight: 700; color: ${C.red};">${pageNo} / ${TOTAL}</div>
  </div>
</div>`;
}

// Every slide in page order, recorded as frame() builds the artboards.
const slideHtml = [];

function frame(pageNo, bodyHtml, opts = {}) {
  const markup = slideMarkup(pageNo, bodyHtml, opts);
  slideHtml[pageNo - 1] = markup;
  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <script src="./support.js"></script>
</head>
<body>
<x-dc>
<helmet>
  <style>
    body { margin: 0; font-family: ${FONT_SANS}; }
    a { color: #8B1A10; text-decoration: underline; } a:hover { color: #fc7c00; }
  </style>
</helmet>
${markup}
</x-dc>
<script data-dc-script data-props='{"$preview": {"width": 1280, "height": 720}}'>
class Component extends DCLogic {
  renderVals() {
    return {};
  }
}
</script>
</body>
</html>
`;
}

const files = {};

// ---- 1. Title -------------------------------------------------------------
files['Main.dc.html'] = frame(
  1,
  `<div style="flex: 1; display: flex; flex-direction: column; justify-content: center; gap: 30px;">
    <h1 style="margin: 0; font-size: 62px; line-height: 1.2; font-weight: 700;">APIdock を<br>ECMAScript 仕様書に移植する</h1>
    <div style="font-size: 20px; color: ${C.ink}; margin-top: 12px;">yebis0942 ・ Kyoto.なんか #8 ・ 2026/08/22</div>
  </div>`,
);

// ---- 2. 読んでいますか ------------------------------------------------------
files['02-read.dc.html'] = frame(
  2,
  `<div style="flex: 1; display: flex; flex-direction: column; justify-content: center; gap: 20px;">
    <div style="font-size: 30px; line-height: 1.5;"><a href="https://tc39.es/ecma262/">ECMAScript仕様書</a></div>
  </div>`,
  { title: '読んでいますか ECMAScript仕様書' },
);

// ---- 3. APIdock を覚えていますか ------------------------------------------
files['03-apidock.dc.html'] = frame(
  3,
  `<div style="flex: 1; min-height: 0; display: flex; gap: 40px;">
    <div style="flex: none; width: 430px; display: flex; flex-direction: column; gap: 8px;">
      <div style="border: 1px solid ${C.line}; background: #fff; box-shadow: 4px 4px 0 ${C.line}; overflow: hidden; height: 430px;">
        <img src="apidock.png" style="width: 430px; display: block;">
      </div>
      <div style="font-size: 13px; color: ${C.sub};">apidock.com/rails(2000年代〜)</div>
    </div>
    <div style="flex: 1; display: flex; flex-direction: column; gap: 18px; justify-content: center;">
      <div style="background: ${C.card}; border: 1px solid ${C.line}; padding: 18px 22px; display: flex; gap: 14px;">
        <div style="flex: none; width: 34px; height: 34px; background: ${C.red}; color: #fff; font-weight: 700; font-size: 18px; display: flex; align-items: center; justify-content: center;">1</div>
        <div style="font-size: 21px; line-height: 1.5;"><strong>バージョンバー</strong><br><span style="color: ${C.sub}; font-size: 18px;">Rails の版ごとに diff 量が <span style="color: ${C.green}; font-weight: 700;">+</span> / − で見える</span></div>
      </div>
      <div style="background: ${C.card}; border: 1px solid ${C.line}; padding: 18px 22px; display: flex; gap: 14px;">
        <div style="flex: none; width: 34px; height: 34px; background: ${C.red}; color: #fff; font-weight: 700; font-size: 18px; display: flex; align-items: center; justify-content: center;">2</div>
        <div style="font-size: 21px; line-height: 1.5;"><strong>ソースのインライン表示</strong><br><span style="color: ${C.sub}; font-size: 18px;">メソッドの実装コードをドキュメント内で読める(今も健在)</span></div>
      </div>
      <div style="background: ${C.red}; color: #fff; padding: 18px 22px; font-size: 21px; line-height: 1.55; font-weight: 500;">公式ドキュメントを非公式に成形し、<br>公式がやらない付加価値を足すサービス</div>
    </div>
  </div>`,
  { title: 'APIdock を覚えていますか' },
);

// ---- 4. 対応表 -------------------------------------------------------------
const mapRow = (a, b, last) => `
  <div style="display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); ${last ? '' : `border-bottom: 1px solid ${C.line};`}">
    <div style="padding: 22px 26px; font-size: 22px; font-weight: 700; color: ${C.redDark}; display: flex; align-items: center;">${a}</div>
    <div style="padding: 22px 26px; font-size: 20px; line-height: 1.5; border-left: 3px solid ${C.orange};">${b}</div>
  </div>`;
files['04-mapping.dc.html'] = frame(
  4,
  `<div style="flex: 1; display: flex; flex-direction: column; justify-content: center; gap: 18px;">
    <div style="display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); background: ${C.red}; color: #fff; font-size: 17px; font-weight: 700;">
      <div style="padding: 10px 26px;">APIdock</div>
      <div style="padding: 10px 26px;">今回作ったもの</div>
    </div>
    <div style="background: ${C.card}; border: 1px solid ${C.line}; margin-top: -18px;">
      ${mapRow('バージョンバー', '<strong>version bar</strong> — ES2015〜24 のセグメント+過去版の本文をインライン表示')}
      ${mapRow('版間 diff', '<strong>version compare</strong> — ecma262-compare への 1 クリック導線')}
      ${mapRow('ソースのインライン表示', '<strong>impl links</strong> — V8 / JSC / SpiderMonkey / QuickJS への permalink', true)}
    </div>
    <div style="font-size: 17px; color: ${C.sub};">実装:ecmarkup(公式の仕様書ビルドツール)のフォークとして全部盛り</div>
  </div>`,
  { title: 'これを ECMAScript 仕様書でやりたい' },
);

// ---- 5. ビルドフロー + vanilla JS ------------------------------------------
const buildBox = (title, body, accent) => `
  <div style="flex: 1; background: ${C.card}; border: 1px solid ${C.line}; ${accent ? `border-top: 4px solid ${C.orange};` : ''} padding: 16px 18px; display: flex; flex-direction: column; gap: 6px; justify-content: center;">
    <div style="font-size: 19px; font-weight: 700;">${title}</div>
    <div style="font-size: 16px; line-height: 1.5; color: ${C.sub};">${body}</div>
  </div>`;
files['05-build.dc.html'] = frame(
  5,
  `<div style="flex: 1; min-height: 0; display: flex; flex-direction: column; gap: 20px; justify-content: center;">
    <div style="display: flex; gap: 12px; align-items: stretch;">
      ${buildBox('spec.html', 'tc39/ecma262 リポジトリの巨大な 1 ファイル<br>HTML + <strong>ecmarkdown</strong> 記法のハイブリッド')}
      <div style="align-self: center; flex: none; display: flex; flex-direction: column; align-items: center; gap: 4px;">
        <div style="background: ${C.red}; color: #fff; font-weight: 700; font-size: 17px; padding: 6px 16px;">ecmarkup</div>
        <div style="font-size: 13px; color: ${C.sub};">TC39 公式ビルダー</div>
        <div style="color: ${C.orange}; font-weight: 700; font-size: 26px;">→</div>
      </div>
      ${buildBox('ビルド成果物', `index.html(単一ページ)<br>multipage/*.html(章ごと)<br>assets/ … ${mono('ecmarkup.js')} + CSS`, true)}
    </div>
    <div style="font-size: 16px; line-height: 1.55; color: ${C.sub};">アルゴリズム手順などは markdown 風の <strong>ecmarkdown</strong> 記法 — ${mono('1. Let _len_ be ? LengthOfArrayLike(_O_).')} — で書かれ、ecmarkup がビルド中に tc39/ecmarkdown を呼んで HTML へ変換する</div>
    <div style="background: ${C.card}; border: 1px solid ${C.line}; padding: 18px 24px; display: flex; flex-direction: column; gap: 10px;">
      <div style="font-size: 23px; font-weight: 700; color: ${C.redDark};">クライアント側は、素朴な vanilla JS</div>
      <div style="font-size: 19px; line-height: 1.65;">
        <div>・フレームワークもバンドラも無し — ${mono('js/*.js')} を連結して 1 本の ${mono('ecmarkup.js')} に(メニュー・検索・ピン留め…)</div>
        <div>・使うのは fetch と DOM API だけ</div>
        <div>・ウィジェット追加 = <strong>js ファイルを 1 個足す+CSS を追記するだけ</strong></div>
      </div>
    </div>
    <div style="flex: none; background: ${C.orange}; color: #fff; padding: 12px 22px; font-size: 20px; font-weight: 700; text-align: center;">手を出しやすい足場 — だから気軽にフォークできた</div>
  </div>`,
  { title: 'そもそも:仕様書はどうビルドされている?' },
);

// ---- 6. DEMO ---------------------------------------------------------------
files['06-demo.dc.html'] = frame(
  6,
  `<div style="flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 34px;">
    <div style="font-size: 110px; font-weight: 700; letter-spacing: 0.08em; color: ${C.red}; text-shadow: 6px 6px 0 rgba(252, 124, 0, 0.35);">DEMO</div>
    <div style="display: flex; gap: 16px; align-items: center; font-size: 22px;">
      <div style="background: ${C.card}; border: 1px solid ${C.line}; padding: 10px 20px;">version bar</div>
      <div style="color: ${C.orange}; font-weight: 700; font-size: 26px;">→</div>
      <div style="background: ${C.card}; border: 1px solid ${C.line}; padding: 10px 20px;">impl links</div>
      <div style="color: ${C.orange}; font-weight: 700; font-size: 26px;">→</div>
      <div style="background: ${C.card}; border: 1px solid ${C.line}; padding: 10px 20px;">compare</div>
    </div>
    <div style="font-size: 18px; color: ${C.sub};">対応表の順に、Map.prototype.get のセクションで</div>
  </div>`,
);

// ---- 7. 「ソース」が1つじゃない --------------------------------------------
const codeCard = (engine, code, note) => `
  <div style="background: ${C.codeBg}; color: ${C.codeFg}; padding: 14px 18px; display: flex; flex-direction: column; gap: 6px;">
    <div style="display: flex; justify-content: space-between; align-items: baseline;">
      <div style="font-size: 15px; font-weight: 700; color: ${C.orange};">${engine}</div>
      <div style="font-size: 13px; color: #c9a68e;">${note}</div>
    </div>
    <div style="font-family: ${FONT_MONO}; font-size: 15px; white-space: nowrap; overflow: hidden;">${code}</div>
  </div>`;
files['07-engines.dc.html'] = frame(
  7,
  `<div style="flex: 1; min-height: 0; display: flex; gap: 40px; align-items: center;">
    <div style="flex: none; width: 360px; display: flex; flex-direction: column; gap: 16px; font-size: 21px; line-height: 1.6;">
      <div>Rails なら gem のソースを出せば終わり。</div>
      <div style="font-weight: 700;">ECMAScript 仕様に「実装」は無い。<br>あるのは<span style="color: ${C.red};">エンジンが4つ</span>。</div>
      <div style="color: ${C.sub}; font-size: 18px;">それぞれ組み込み関数の登録規約が全部違う →</div>
    </div>
    <div style="flex: 1; display: flex; flex-direction: column; gap: 12px;">
      ${codeCard('V8', 'SimpleInstallFunction(proto, "map", Builtin::kArrayMap)', 'Builtin 名から復元/実装は Torque')}
      ${codeCard('JavaScriptCore', 'JSC_BUILTIN_FUNCTION…(mapPublicName(), arrayPrototypeMapCodeGenerator)', '実装は ArrayPrototype.js')}
      ${codeCard('SpiderMonkey', 'JS_SELF_HOSTED_FN("map", "ArrayMap", 1, 0)', '実装が JS!')}
      ${codeCard('QuickJS', 'JS_CFUNC_MAGIC_DEF("map", 1, js_array_every, special_map)', 'map の実体は every + magic フラグ')}
    </div>
  </div>
  <div style="flex: none; background: ${C.orange}; color: #fff; padding: 12px 22px; font-size: 20px; font-weight: 700; text-align: center;">規約ベースで抽出 → 仕様の clause ID と突き合わせ = 493 セクション</div>`,
  { title: '「ソース」が 1 つじゃない' },
);

// ---- 8. merge-base ---------------------------------------------------------
files['08-mergebase.dc.html'] = frame(
  8,
  `<div style="flex: 1; min-height: 0; display: flex; flex-direction: column; gap: 14px; justify-content: center;">
    <div style="display: flex; gap: 28px; font-size: 19px; line-height: 1.55;">
      <div style="flex: 1; background: ${C.card}; border: 1px solid ${C.line}; padding: 14px 18px;"><strong style="color: ${C.redDark};">素朴な答え:</strong>「リリースタグのコミットでしょ」→ <strong>×</strong><br><span style="color: ${C.sub}; font-size: 17px;">diff ツールは main 系列のスナップショットで動く。タグはリリースブランチの先にある。</span></div>
      <div style="flex: 1; background: ${C.card}; border: 2px solid ${C.orange}; padding: 14px 18px;"><strong style="color: ${C.redDark};">解:</strong> ${mono('git merge-base &lt;tag&gt; main')}<br><span style="color: ${C.sub}; font-size: 17px;">「リリースブランチが main から分岐した点」を各版の代表ハッシュにする。</span></div>
    </div>
    <svg viewBox="0 0 1100 240" style="width: 100%; height: 240px;">
      <line x1="40" y1="150" x2="1060" y2="150" stroke="${C.ink}" stroke-width="5"></line>
      <text x="1010" y="185" font-size="20" fill="${C.ink}" font-weight="700">main</text>
      <circle cx="180" cy="150" r="8" fill="${C.ink}"></circle>
      <circle cx="420" cy="150" r="8" fill="${C.ink}"></circle>
      <circle cx="700" cy="150" r="8" fill="${C.ink}"></circle>
      <line x1="420" y1="150" x2="560" y2="60" stroke="${C.red}" stroke-width="4"></line>
      <line x1="560" y1="60" x2="660" y2="60" stroke="${C.red}" stroke-width="4"></line>
      <circle cx="660" cy="60" r="9" fill="${C.red}"></circle>
      <text x="680" y="66" font-size="19" fill="${C.red}" font-weight="700">tag: es2021 (リリースブランチ)</text>
      <path d="M 420 150 l -14 26 l 28 0 z" fill="${C.orange}"></path>
      <text x="300" y="205" font-size="20" fill="${C.orange}" font-weight="700">★ merge-base = 「ES2021」</text>
    </svg>
    <div style="font-size: 16px; color: ${C.sub};">例外:ES2016 のみ、スナップショットの収録範囲より古いため実リリースコミットをそのまま使用 —「歴史データには必ず例外が 1 個いる」</div>
  </div>`,
  { title: '「ES2021」はどのコミット?' },
);

// ---- 9. 腐る ---------------------------------------------------------------
files['09-decay.dc.html'] = frame(
  9,
  `<div style="flex: 1; min-height: 0; display: flex; gap: 40px; align-items: center;">
    <div style="flex: none; width: 470px;">
      <div style="border: 3px solid ${C.red}; background: #fff; overflow: hidden; height: 300px; position: relative;">
        <img src="apidock.png" style="width: 470px; display: block; margin-top: -170px;">
        <div style="position: absolute; top: 140px; left: 8px; right: 8px; height: 64px; border: 3px solid ${C.red};"></div>
      </div>
      <div style="font-size: 13px; color: ${C.sub}; margin-top: 6px;">Latest events に並ぶ「Error on version import」</div>
    </div>
    <div style="flex: 1; display: flex; flex-direction: column; gap: 14px; font-size: 21px; line-height: 1.6;">
      <div style="display: flex; gap: 10px;"><div style="color: ${C.red}; font-weight: 700;">×</div><div>diff 量の表示は消えた</div></div>
      <div style="display: flex; gap: 10px;"><div style="color: ${C.red}; font-weight: 700;">×</div><div>データ更新は事実上停止(Rails 5 前後で)</div></div>
      <div style="display: flex; gap: 10px;"><div style="color: ${C.green}; font-weight: 700;">○</div><div>インラインソース表示は今も生きている</div></div>
      <div style="background: ${C.red}; color: #fff; padding: 16px 22px; font-size: 22px; font-weight: 700; margin-top: 10px;">人手のメンテに依存した部分から死ぬ</div>
    </div>
  </div>`,
  { title: '非公式サービスは腐る' },
);

// ---- 10. 配管 --------------------------------------------------------------
const flowBox = t =>
  `<div style="flex: 1; background: ${C.card}; border: 1px solid ${C.line}; border-top: 4px solid ${C.orange}; padding: 14px 12px; font-size: 17px; line-height: 1.45; text-align: center;">${t}</div>`;
files['10-pipeline.dc.html'] = frame(
  10,
  `<div style="flex: 1; min-height: 0; display: flex; flex-direction: column; gap: 20px; justify-content: center;">
    <div style="display: flex; gap: 10px; align-items: stretch;">
      ${flowBox('<strong>週次 CI</strong><br>自動起動')}
      <div style="align-self: center; color: ${C.orange}; font-weight: 700; font-size: 24px;">→</div>
      ${flowBox('<strong>変化検知</strong><br>エンジンの新タグ /<br>仕様の更新')}
      <div style="align-self: center; color: ${C.orange}; font-weight: 700; font-size: 24px;">→</div>
      ${flowBox('<strong>再生成+検証</strong><br>抽出をやり直し<br>リンク死活チェック')}
      <div style="align-self: center; color: ${C.orange}; font-weight: 700; font-size: 24px;">→</div>
      ${flowBox('<strong>自動 PR</strong><br>エンジン別 stats 表つき')}
    </div>
    <div style="display: flex; gap: 20px;">
      <div style="flex: 1; background: ${C.card}; border: 1px solid ${C.line}; padding: 14px 18px; font-size: 18px; line-height: 1.55;"><strong style="color: ${C.redDark};">ガード①</strong> マッチ数が前回の 80% を切ったら「抽出器が壊れた」として fail</div>
      <div style="flex: 1; background: ${C.card}; border: 1px solid ${C.line}; padding: 14px 18px; font-size: 18px; line-height: 1.55;"><strong style="color: ${C.redDark};">ガード②</strong> 生成リンクを実 fetch して死活をサンプル検査</div>
    </div>
    <div style="display: flex; gap: 20px; align-items: center;">
      <div style="flex: none; width: 330px; height: 110px; border: 2px dashed ${C.line}; background: #fff; display: flex; align-items: center; justify-content: center; color: ${C.sub}; font-size: 15px;">[自動 PR のスクリーンショット]</div>
      <div style="font-size: 19px; line-height: 1.6;">convention 依存の抽出は<strong>必ずいつか壊れる</strong>。<br>壊れた日に気づける設計にしておく。</div>
    </div>
  </div>`,
  { title: '腐らせない配管を最初から' },
);

// ---- 11. まとめ ------------------------------------------------------------
files['11-matome.dc.html'] = frame(
  11,
  `<div style="flex: 1; display: flex; flex-direction: column; justify-content: center; gap: 18px;">
    <div style="font-size: 34px; font-weight: 700; color: ${C.red};">20 年前の良い UI は、今でも良い UI</div>
    <div style="font-size: 21px; line-height: 1.7;">
      <div>・発明したのは APIdock。自分がやったのは<strong>移植</strong>と、<strong>腐らせないための配管</strong></div>
      <div>・今後:サイト公開予定/未移植の APIdock 機能 = ユーザー注釈(posted note)</div>
    </div>
    <div style="background: ${C.orange}; color: #fff; padding: 20px 26px; font-size: 24px; font-weight: 700; line-height: 1.5;">あなたの分野の「公式ドキュメント」にも、<br>APIdock 的な付加価値の余地、ありませんか?</div>
    <div style="display: flex; gap: 24px; font-size: 17px; color: ${C.sub};">
      <div>[GitHub / 連絡先]</div>
      <div>[リポジトリ URL]</div>
    </div>
  </div>`,
);

// ---- 12. Q&A 予備 ----------------------------------------------------------
const qa = (q, a) => `
  <div style="background: ${C.card}; border: 1px solid ${C.line}; padding: 16px 20px; display: flex; flex-direction: column; gap: 8px;">
    <div style="font-size: 19px; font-weight: 700;"><span style="color: ${C.orange};">Q.</span> ${q}</div>
    <div style="font-size: 18px; line-height: 1.55; color: ${C.ink};"><span style="color: ${C.red}; font-weight: 700;">A.</span> ${a}</div>
  </div>`;
files['12-qa.dc.html'] = frame(
  12,
  `<div style="flex: 1; display: flex; flex-direction: column; gap: 14px; justify-content: center;">
    ${qa('Annex B やコンストラクタ本体は?', 'v1 のスコープ外。対象はメソッド+アクセサのみ。')}
    ${qa('リンク切れは起きない?', 'リリースタグ固定の permalink + CI がサンプル死活チェック。')}
    ${qa('本家 ecmarkup に提案しないの?', 'データが ecma262 固有で置き場所の議論が必要。まず自サイトで実績づくり。')}
  </div>`,
  { title: 'Q&amp;A で聞かれそうなこと' },
);

// ---- 13. 予備スクショ ------------------------------------------------------
const shot =
  label => `<div style="flex: 1; border: 2px dashed ${C.line}; background: #fff; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px; color: ${C.sub};">
  <div style="font-size: 16px;">[スクリーンショット]</div>
  <div style="font-size: 19px; font-weight: 700; color: ${C.ink};">${label}</div>
</div>`;
files['13-screens.dc.html'] = frame(
  13,
  `<div style="flex: 1; min-height: 0; display: flex; gap: 20px;">
    ${shot('version bar 展開')}
    ${shot('impl パネル')}
    ${shot('compare パネル')}
  </div>
  <div style="flex: none; font-size: 16px; color: ${C.sub}; text-align: center;">デモが動かないときはここへ飛ぶ(スライド番号を控えておく)</div>`,
  { title: 'デモ事故用スクリーンショット' },
);

for (const [name, html] of Object.entries(files)) writeFileSync(name, html);

// ---- canvas layout ---------------------------------------------------------
const order = [
  'Main.dc.html',
  '02-read.dc.html',
  '03-apidock.dc.html',
  '04-mapping.dc.html',
  '05-build.dc.html',
  '06-demo.dc.html',
  '07-engines.dc.html',
  '08-mergebase.dc.html',
  '09-decay.dc.html',
  '10-pipeline.dc.html',
  '11-matome.dc.html',
  '12-qa.dc.html',
  '13-screens.dc.html',
];
const titles = {
  'Main.dc.html': '1. タイトル',
  '02-read.dc.html': '2. 読んでいますか',
  '03-apidock.dc.html': '3. APIdock',
  '04-mapping.dc.html': '4. 対応表',
  '05-build.dc.html': '5. ビルドと vanilla JS',
  '06-demo.dc.html': '6. デモ',
  '07-engines.dc.html': '7. ソースが4つ',
  '08-mergebase.dc.html': '8. merge-base',
  '09-decay.dc.html': '9. 腐る',
  '10-pipeline.dc.html': '10. 配管',
  '11-matome.dc.html': '11. まとめ',
  '12-qa.dc.html': '予備: Q&A',
  '13-screens.dc.html': '予備: スクショ',
};
const artboards = order.map((file, i) => ({
  file,
  title: titles[file],
  x: (i % 3) * 1400,
  y: Math.floor(i / 3) * 880,
  w: 1280,
  h: 720,
}));
const canvas = {
  artboards,
  annotations: [
    {
      id: 'howto',
      x: -320,
      y: 0,
      w: 280,
      text: '本編はスライド 1〜11(約10分)。\n12・13 は予備。\n[ ] の部分は差し替えてください。',
    },
    {
      id: 'yobi',
      x: -320,
      y: 2640,
      w: 280,
      text: '時間が押したら削る順:\n10 の詳細 → 5 を1文に圧縮 → 8 の図の深掘り。\n3〜4 と 7 の APIdock 対応の骨格は削らない。',
    },
  ],
  launch: { view: 'canvas' },
};
writeFileSync('canvas.json', JSON.stringify(canvas, null, 2));

// ---- standalone presenter --------------------------------------------------
// The canvas editor has no slideshow mode, so the same slide markup is also
// emitted as one self-contained file you open in a browser and drive with the
// arrow keys. Not a Design Component: no <x-dc>, no support.js.
const sections = slideHtml
  .map((markup, i) => `<section class="slide"${i === 0 ? '' : ' hidden'}>\n${markup}\n</section>`)
  .join('\n');

const present = `<!doctype html>
<html lang="ja">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>APIdock を ECMAScript 仕様書に移植する</title>
<style>
  html, body { margin: 0; height: 100%; overflow: hidden; background: #17110e; }
  body { font-family: ${FONT_SANS}; display: flex; align-items: center; justify-content: center; }
  #stage { flex: none; width: 1280px; height: 720px; transform-origin: center center; }
  .slide[hidden] { display: none; }
  a { color: ${C.red}; text-decoration: underline; }
  a:hover { color: ${C.orange}; }
</style>
</head>
<body>
<div id="stage">
${sections}
</div>
<script>
(function () {
  var stage = document.getElementById('stage');
  var slides = Array.prototype.slice.call(stage.querySelectorAll('.slide'));
  var current = 0;

  // The slides are a fixed 1280x720; scale the stage to whatever the window
  // (or the projector, once fullscreen) actually gives us.
  function fit() {
    stage.style.transform = 'scale(' + Math.min(innerWidth / 1280, innerHeight / 720) + ')';
  }

  function show(i, writeHash) {
    i = Math.max(0, Math.min(slides.length - 1, i));
    slides[current].hidden = true;
    slides[i].hidden = false;
    current = i;
    if (writeHash !== false) location.hash = '#' + (i + 1);
  }

  // #5 in the URL means "start on slide 5" — survives a reload mid-talk.
  function fromHash() {
    var n = parseInt(location.hash.slice(1), 10);
    return isFinite(n) ? n - 1 : 0;
  }

  document.addEventListener('keydown', function (e) {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    var k = e.key;
    var handled = true;
    if (k === 'ArrowRight' || k === 'ArrowDown' || k === 'PageDown' || k === 'Enter' || (k === ' ' && !e.shiftKey)) {
      show(current + 1);
    } else if (k === 'ArrowLeft' || k === 'ArrowUp' || k === 'PageUp' || (k === ' ' && e.shiftKey)) {
      show(current - 1);
    } else if (k === 'Home') {
      show(0);
    } else if (k === 'End') {
      show(slides.length - 1);
    } else if (k === 'f' || k === 'F') {
      if (document.fullscreenElement) document.exitFullscreen();
      else document.documentElement.requestFullscreen();
    } else {
      handled = false;
    }
    if (handled) e.preventDefault();
  });

  // Click/tap: left quarter goes back, anywhere else goes forward.
  document.addEventListener('click', function (e) {
    if (e.target.closest('a')) return;
    show(e.clientX < innerWidth / 4 ? current - 1 : current + 1);
  });

  addEventListener('hashchange', function () { show(fromHash(), false); });
  addEventListener('resize', fit);
  document.addEventListener('fullscreenchange', fit);

  fit();
  show(fromHash(), false);
})();
</script>
</body>
</html>
`;
writeFileSync('present.html', present);

console.log(
  'generated',
  Object.keys(files).length,
  'artboards + canvas.json + present.html (' + slideHtml.length + ' slides)',
);
