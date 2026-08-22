// Generates the 11 slide artboards (.dc.html) + canvas.json for the
// "APIdock を ECMAScript 仕様書に移植する" talk template.
// Shared visual system: APIdock dark red #8B1A10 + TC39 orange #fc7c00,
// warm paper background, IBM Plex Sans JP / IBM Plex Mono (the spec's own faces),
// and a "version bar" motif (diff segments) as the running footer decoration.
import { writeFileSync } from 'node:fs';

const C = {
  red: '#8B1A10',
  redDark: '#6e130b',
  orange: '#fc7c00',
  paper: '#f7f3ec',
  card: '#fffdf9',
  line: '#e3d9c8',
  ink: '#241d19',
  sub: '#6b5f54',
  green: '#3f9c35',
  codeBg: '#2a1712',
  codeFg: '#f3e6d8',
};

// The APIdock-style version bar: small segments, some carrying green "+" diff marks.
function versionBar(scale = 1, marks = [1, 3, 4, 7]) {
  const seg = Math.round(12 * scale);
  const cells = Array.from({ length: 10 }, (_, i) => {
    const marked = marks.includes(i);
    const plus = marked
      ? `<div style="font-size: ${Math.round(9 * scale)}px; line-height: 1; color: ${C.green}; text-align: center; font-weight: 700;">+</div>`
      : `<div style="height: ${Math.round(9 * scale)}px;"></div>`;
    const bg = i === 6 ? C.orange : marked ? '#bfe3b4' : '#ddd3c0';
    return `<div style="display: flex; flex-direction: column; gap: 2px; align-items: center;">${plus}<div style="width: ${seg}px; height: ${seg}px; background: ${bg}; border: 1px solid #c9bda6;"></div></div>`;
  }).join('');
  return `<div style="display: flex; gap: ${Math.round(3 * scale)}px; align-items: flex-end;">${cells}</div>`;
}

function kickerChip(text) {
  return `<div style="display: flex; align-items: center; gap: 10px;">
    <div style="background: ${C.red}; color: #fff; font-size: 15px; font-weight: 700; padding: 4px 12px; letter-spacing: 0.06em;">${text}</div>
    <div style="height: 2px; flex: 1; background: linear-gradient(to right, ${C.orange}, transparent);"></div>
  </div>`;
}

function frame(pageNo, bodyHtml, { kicker = null, title = null } = {}) {
  const head = [
    kicker ? kickerChip(kicker) : '',
    title
      ? `<h1 style="margin: 0; font-size: 44px; line-height: 1.25; font-weight: 700; color: ${C.ink};">${title}</h1>`
      : '',
  ].join('\n');
  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <script src="./support.js"></script>
</head>
<body>
<x-dc>
<helmet>
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+JP:wght@400;500;700&amp;family=IBM+Plex+Mono:wght@400;600&amp;display=swap">
  <style>
    body { margin: 0; font-family: 'IBM Plex Sans JP', 'Hiragino Sans', system-ui, sans-serif; }
    a { color: #8B1A10; text-decoration: underline; } a:hover { color: #fc7c00; }
  </style>
</helmet>
<div style="width: 1280px; height: 720px; position: relative; background: ${C.paper}; color: ${C.ink}; overflow: hidden; display: flex; flex-direction: column;">
  <div style="height: 10px; flex: none; background: ${C.red}; display: flex;">
    <div style="width: 180px; background: ${C.orange};"></div>
  </div>
  <div style="flex: 1; min-height: 0; padding: 36px 64px 20px 64px; display: flex; flex-direction: column; gap: 22px;">
    ${head}
    ${bodyHtml}
  </div>
  <div style="flex: none; display: flex; align-items: center; justify-content: space-between; padding: 0 64px 18px 64px;">
    ${versionBar(1)}
    <div style="font-size: 14px; color: ${C.sub};">APIdock → ECMAScript spec</div>
    <div style="font-size: 15px; font-weight: 700; color: ${C.red};">${pageNo} / 12</div>
  </div>
</div>
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
    <div style="transform: scale(1.6); transform-origin: left bottom; width: 200px;">${versionBar(1.4, [2, 5, 6, 8])}</div>
    <h1 style="margin: 0; font-size: 62px; line-height: 1.2; font-weight: 700;">APIdock を<br>ECMAScript 仕様書に移植する</h1>
    <div style="font-size: 26px; color: ${C.sub};">ecmarkup フォークで作る、非公式・全部盛り仕様書リーダー</div>
    <div style="display: flex; gap: 18px; align-items: center; margin-top: 12px;">
      <div style="background: ${C.orange}; color: #fff; font-weight: 700; font-size: 18px; padding: 6px 16px;">10 min</div>
      <div style="font-size: 20px; color: ${C.ink};">[発表者名] ・ [イベント名] ・ [日付]</div>
    </div>
  </div>`,
);

// ---- 2. APIdock を覚えていますか ------------------------------------------
files['02-apidock.dc.html'] = frame(
  2,
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
  { kicker: '1. つかみ', title: 'APIdock を覚えていますか' },
);

// ---- 3. 対応表 -------------------------------------------------------------
const mapRow = (a, b, last) => `
  <div style="display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); ${last ? '' : `border-bottom: 1px solid ${C.line};`}">
    <div style="padding: 22px 26px; font-size: 22px; font-weight: 700; color: ${C.redDark}; display: flex; align-items: center;">${a}</div>
    <div style="padding: 22px 26px; font-size: 20px; line-height: 1.5; border-left: 3px solid ${C.orange};">${b}</div>
  </div>`;
files['03-mapping.dc.html'] = frame(
  3,
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
  { kicker: '2. 妄想', title: 'これを ECMAScript 仕様書でやりたい' },
);

// ---- 4. ビルドフロー + vanilla JS ------------------------------------------
const buildBox = (title, body, accent) => `
  <div style="flex: 1; background: ${C.card}; border: 1px solid ${C.line}; ${accent ? `border-top: 4px solid ${C.orange};` : ''} padding: 16px 18px; display: flex; flex-direction: column; gap: 6px; justify-content: center;">
    <div style="font-size: 19px; font-weight: 700;">${title}</div>
    <div style="font-size: 16px; line-height: 1.5; color: ${C.sub};">${body}</div>
  </div>`;
files['04-build.dc.html'] = frame(
  4,
  `<div style="flex: 1; min-height: 0; display: flex; flex-direction: column; gap: 20px; justify-content: center;">
    <div style="display: flex; gap: 12px; align-items: stretch;">
      ${buildBox('spec.html', 'tc39/ecma262 リポジトリの<br>巨大な 1 ファイル(数万行の HTML)')}
      <div style="align-self: center; flex: none; display: flex; flex-direction: column; align-items: center; gap: 4px;">
        <div style="background: ${C.red}; color: #fff; font-weight: 700; font-size: 17px; padding: 6px 16px;">ecmarkup</div>
        <div style="font-size: 13px; color: ${C.sub};">TC39 公式ビルダー</div>
        <div style="color: ${C.orange}; font-weight: 700; font-size: 26px;">→</div>
      </div>
      ${buildBox('ビルド成果物', 'index.html(単一ページ)<br>multipage/*.html(章ごと)<br>assets/ … <span style="font-family: \'IBM Plex Mono\', monospace;">ecmarkup.js</span> + CSS', true)}
    </div>
    <div style="background: ${C.card}; border: 1px solid ${C.line}; padding: 18px 24px; display: flex; flex-direction: column; gap: 10px;">
      <div style="font-size: 23px; font-weight: 700; color: ${C.redDark};">クライアント側は、素朴な vanilla JS</div>
      <div style="font-size: 19px; line-height: 1.65;">
        <div>・フレームワークもバンドラも無し — <span style="font-family: 'IBM Plex Mono', monospace;">js/*.js</span> を連結して 1 本の <span style="font-family: 'IBM Plex Mono', monospace;">ecmarkup.js</span> に(メニュー・検索・ピン留め…)</div>
        <div>・使うのは fetch と DOM API だけ</div>
        <div>・ウィジェット追加 = <strong>js ファイルを 1 個足す+CSS を追記するだけ</strong></div>
      </div>
    </div>
    <div style="flex: none; background: ${C.orange}; color: #fff; padding: 12px 22px; font-size: 20px; font-weight: 700; text-align: center;">手を出しやすい足場 — だから気軽にフォークできた</div>
  </div>`,
  { kicker: '3. 足場', title: 'そもそも:仕様書はどうビルドされている?' },
);

// ---- 5. DEMO ---------------------------------------------------------------
files['05-demo.dc.html'] = frame(
  5,
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
  { kicker: '4. デモ' },
);

// ---- 5. 「ソース」が1つじゃない --------------------------------------------
const codeCard = (engine, code, note) => `
  <div style="background: ${C.codeBg}; color: ${C.codeFg}; padding: 14px 18px; display: flex; flex-direction: column; gap: 6px;">
    <div style="display: flex; justify-content: space-between; align-items: baseline;">
      <div style="font-size: 15px; font-weight: 700; color: ${C.orange};">${engine}</div>
      <div style="font-size: 13px; color: #c9a68e;">${note}</div>
    </div>
    <div style="font-family: 'IBM Plex Mono', monospace; font-size: 15px; white-space: nowrap; overflow: hidden;">${code}</div>
  </div>`;
files['06-engines.dc.html'] = frame(
  6,
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
  { kicker: '5. 移植して分かった違い ①', title: '「ソース」が 1 つじゃない' },
);

// ---- 6. merge-base ---------------------------------------------------------
files['07-mergebase.dc.html'] = frame(
  7,
  `<div style="flex: 1; min-height: 0; display: flex; flex-direction: column; gap: 14px; justify-content: center;">
    <div style="display: flex; gap: 28px; font-size: 19px; line-height: 1.55;">
      <div style="flex: 1; background: ${C.card}; border: 1px solid ${C.line}; padding: 14px 18px;"><strong style="color: ${C.redDark};">素朴な答え:</strong>「リリースタグのコミットでしょ」→ <strong>×</strong><br><span style="color: ${C.sub}; font-size: 17px;">diff ツールは main 系列のスナップショットで動く。タグはリリースブランチの先にある。</span></div>
      <div style="flex: 1; background: ${C.card}; border: 2px solid ${C.orange}; padding: 14px 18px;"><strong style="color: ${C.redDark};">解:</strong> <span style="font-family: 'IBM Plex Mono', monospace;">git merge-base &lt;tag&gt; main</span><br><span style="color: ${C.sub}; font-size: 17px;">「リリースブランチが main から分岐した点」を各版の代表ハッシュにする。</span></div>
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
  { kicker: '6. 移植して分かった違い ②', title: '「ES2021」はどのコミット?' },
);

// ---- 7. 腐る ---------------------------------------------------------------
files['08-decay.dc.html'] = frame(
  8,
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
  { kicker: '7. APIdock 最大の教訓', title: '非公式サービスは腐る' },
);

// ---- 8. 配管 ---------------------------------------------------------------
const flowBox = t =>
  `<div style="flex: 1; background: ${C.card}; border: 1px solid ${C.line}; border-top: 4px solid ${C.orange}; padding: 14px 12px; font-size: 17px; line-height: 1.45; text-align: center;">${t}</div>`;
files['09-pipeline.dc.html'] = frame(
  9,
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
  { kicker: '8. だから', title: '腐らせない配管を最初から' },
);

// ---- 9. まとめ -------------------------------------------------------------
files['10-matome.dc.html'] = frame(
  10,
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
  { kicker: '9. まとめ' },
);

// ---- 10. Q&A 予備 ----------------------------------------------------------
const qa = (q, a) => `
  <div style="background: ${C.card}; border: 1px solid ${C.line}; padding: 16px 20px; display: flex; flex-direction: column; gap: 8px;">
    <div style="font-size: 19px; font-weight: 700;"><span style="color: ${C.orange};">Q.</span> ${q}</div>
    <div style="font-size: 18px; line-height: 1.55; color: ${C.ink};"><span style="color: ${C.red}; font-weight: 700;">A.</span> ${a}</div>
  </div>`;
files['11-qa.dc.html'] = frame(
  11,
  `<div style="flex: 1; display: flex; flex-direction: column; gap: 14px; justify-content: center;">
    ${qa('Annex B やコンストラクタ本体は?', 'v1 のスコープ外。対象はメソッド+アクセサのみ。')}
    ${qa('リンク切れは起きない?', 'リリースタグ固定の permalink + CI がサンプル死活チェック。')}
    ${qa('本家 ecmarkup に提案しないの?', 'データが ecma262 固有で置き場所の議論が必要。まず自サイトで実績づくり。')}
  </div>`,
  { kicker: '予備', title: 'Q&amp;A で聞かれそうなこと' },
);

// ---- 11. 予備スクショ ------------------------------------------------------
const shot =
  label => `<div style="flex: 1; border: 2px dashed ${C.line}; background: #fff; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px; color: ${C.sub};">
  <div style="font-size: 16px;">[スクリーンショット]</div>
  <div style="font-size: 19px; font-weight: 700; color: ${C.ink};">${label}</div>
</div>`;
files['12-screens.dc.html'] = frame(
  12,
  `<div style="flex: 1; min-height: 0; display: flex; gap: 20px;">
    ${shot('version bar 展開')}
    ${shot('impl パネル')}
    ${shot('compare パネル')}
  </div>
  <div style="flex: none; font-size: 16px; color: ${C.sub}; text-align: center;">デモが動かないときはここへ飛ぶ(スライド番号を控えておく)</div>`,
  { kicker: '予備', title: 'デモ事故用スクリーンショット' },
);

for (const [name, html] of Object.entries(files)) writeFileSync(name, html);

// ---- canvas layout ---------------------------------------------------------
const order = [
  'Main.dc.html',
  '02-apidock.dc.html',
  '03-mapping.dc.html',
  '04-build.dc.html',
  '05-demo.dc.html',
  '06-engines.dc.html',
  '07-mergebase.dc.html',
  '08-decay.dc.html',
  '09-pipeline.dc.html',
  '10-matome.dc.html',
  '11-qa.dc.html',
  '12-screens.dc.html',
];
const titles = {
  'Main.dc.html': '1. タイトル',
  '02-apidock.dc.html': '2. APIdock',
  '03-mapping.dc.html': '3. 対応表',
  '04-build.dc.html': '4. ビルドと vanilla JS',
  '05-demo.dc.html': '5. デモ',
  '06-engines.dc.html': '6. ソースが4つ',
  '07-mergebase.dc.html': '7. merge-base',
  '08-decay.dc.html': '8. 腐る',
  '09-pipeline.dc.html': '9. 配管',
  '10-matome.dc.html': '10. まとめ',
  '11-qa.dc.html': '予備: Q&A',
  '12-screens.dc.html': '予備: スクショ',
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
      text: '本編はスライド 1〜10(約10分)。\n11・12 は予備。\n[ ] の部分は差し替えてください。',
    },
    {
      id: 'yobi',
      x: -320,
      y: 2640,
      w: 280,
      text: '時間が押したら削る順:\n9 の詳細 → 4 を1文に圧縮 → 7 の図の深掘り。\n2〜3 と 6 の APIdock 対応の骨格は削らない。',
    },
  ],
  launch: { view: 'canvas' },
};
writeFileSync('canvas.json', JSON.stringify(canvas, null, 2));
console.log('generated', Object.keys(files).length, 'artboards + canvas.json');
