# slides

「APIdock を ECMAScript 仕様書に移植する」— この ecmarkup フォークについての
10分カジュアル発表用スライド(16:9、本編11枚+予備2枚)。

編集可能なキャンバスとして公開済み:
<https://claude.ai/code/artifact/3135b94d-f64c-4b1a-bf53-95c9b11f099b>
(PNG / PDF エクスポートもそこから)

## ファイル構成

- `generate.mjs` — スライドの単一ソース。全アートボード(`*.dc.html`)と
  `canvas.json`、発表用の `present.html` を生成する。
  **文言や色を変えるときはここを編集して再生成する**(生成物を直接編集しない):

  ```sh
  cd slides && node generate.mjs
  ```

- `Main.dc.html`, `02-*.dc.html` … `13-*.dc.html` — 生成されたアートボード
  (1枚 = 1スライド、1280×720)
- `present.html` — 発表用ビューア(生成物)。全スライドを 1 ファイルに埋め込んだ
  自己完結の HTML で、ブラウザで直接開いて使う。キャンバスエディタには
  スライドショー機能が無いため、本番の投影はこちらで行う:

  | キー | 動作 |
  | --- | --- |
  | `→` `↓` `PageDown` `Space` `Enter` | 次のスライド |
  | `←` `↑` `PageUp` `Shift+Space` | 前のスライド |
  | `Home` / `End` | 先頭 / 末尾 |
  | `f` | フルスクリーン切り替え |

  クリック(左 1/4 は前へ、それ以外は次へ)でも送れる。URL の `#5` が現在の
  ページ番号なので、リロードしても位置が保たれる。スライドは 1280×720 固定で、
  ウィンドウサイズに合わせて自動でスケールする。

- `canvas.json` — キャンバス上の配置・表示名・付箋メモ
- `apidock.png` — APIdock のスクリーンショット(スライド3・9で使用)

## デザイン

白地に、APIdock のダークレッド `#8B1A10` × TC39 オレンジ `#fc7c00` をアクセントとして最小限に。
フォントは仕様書本体と同じ IBM Plex(Sans JP / Mono)。ただし
`css/elements.css` が IBM Plex を `src: local(...)` のみで宣言しているのに倣い、
**Google Fonts は読み込まない** — ローカルに Plex があればそれを、無ければ
Hiragino Sans / Noto Sans JP などのシステムフォントにフォールバックする
(`present.html` はオフラインでも完全に自己完結する)。
装飾は置かない — 上部の帯もバージョンバーのモチーフも無く、フッターに出るのは
右下のページ番号だけ。

スライド7のコード断片は各エンジンの実ソースから採録:
V8 `bootstrapper.cc` / JSC `ArrayPrototype.cpp` / SpiderMonkey `Array.cpp` /
QuickJS `quickjs.c`(`Array.prototype.map` の実体は `js_array_every` + magic フラグ)。
