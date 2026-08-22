# slides

「APIdock を ECMAScript 仕様書に移植する」— この ecmarkup フォークについての
10分カジュアル発表用スライド(16:9、本編10枚+予備2枚)。

編集可能なキャンバスとして公開済み:
<https://claude.ai/code/artifact/3135b94d-f64c-4b1a-bf53-95c9b11f099b>
(PNG / PDF エクスポートもそこから)

## ファイル構成

- `generate.mjs` — スライドの単一ソース。全アートボード(`*.dc.html`)と
  `canvas.json` を生成する。**文言や色を変えるときはここを編集して再生成する**
  (生成物を直接編集しない):

  ```sh
  cd slides && node generate.mjs
  ```

- `Main.dc.html`, `02-*.dc.html` … `12-*.dc.html` — 生成されたアートボード
  (1枚 = 1スライド、1280×720)
- `canvas.json` — キャンバス上の配置・表示名・付箋メモ
- `apidock.png` — APIdock のスクリーンショット(スライド2・8で使用)

## デザイン

APIdock のダークレッド `#8B1A10` × TC39 オレンジ `#fc7c00`。
フォントは仕様書本体と同じ IBM Plex(Sans JP / Mono)。
各スライドのフッターに APIdock のバージョンバー(+付きセグメント)のモチーフ。

スライド6のコード断片は各エンジンの実ソースから採録:
V8 `bootstrapper.cc` / JSC `ArrayPrototype.cpp` / SpiderMonkey `Array.cpp` /
QuickJS `quickjs.c`(`Array.prototype.map` の実体は `js_array_every` + magic フラグ)。
