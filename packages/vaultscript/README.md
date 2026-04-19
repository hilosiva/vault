# vaultscript

> Unlock the Power of JavaScript

A collection of UI utilities and components for modern web development.

```bash
npm install vaultscript
# or
pnpm add vaultscript
```

## Requirements

- **Node.js**: 20.19.0 以上（22.12.0 以上推奨）

---

## Libs

### `Loading`

Page lifecycle manager. Handles loading animations, viewport settings, iOS detection, reduced motion, and page transitions. Supports both standard `load` events and Astro's `astro:page-load`.

```ts
import { Loading } from "vaultscript";

const loading = new Loading({
  loadingAnimation: async () => {
    // ローディングアニメーション
    return true;
  },
  loadingOutAnimation: async () => {
    // フェードアウトアニメーション
    return true;
  },
});
```

**Options**

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `isJS` | `boolean` | `true` | JS有効時に `data-script-disabled` を除去 |
| `isLoad` | `boolean` | `true` | ロードイベントを待つ |
| `isIos` | `boolean` | `true` | iOS検出・`data-ios` 属性付与 |
| `isResize` | `boolean` | `true` | リサイズ中に `data-resize` 属性付与 |
| `isReduceMotion` | `boolean` | `true` | `window.isReduceMotion` をセット |
| `once` | `boolean` | `true` | 初回訪問時のみアニメーション実行 |
| `viewport` | `number` | `375` | 最小ビューポート幅 |
| `eventType` | `"load" \| "astro:page-load"` | `"load"` | 待機するイベント |
| `loadingAnimation` | `AnimateFunction \| false` | `false` | ローディング演出 |
| `loadingOutAnimation` | `AnimateFunction \| false` | `false` | ローディング終了演出 |
| `pageTransitionIn` | `AnimateFunction \| false` | `false` | ページイン演出 |
| `pageTransitionOut` | `AnimateFunction \| false` | `false` | ページアウト演出 |

**Events**

- `vault:loaded` — ローディング完了時に `document` へ発火

---

### `MomentumScroll`

[Lenis](https://lenis.darkroom.engineering/) を薄くラップした慣性スクロール。`prefers-reduced-motion` を自動検出し、動き軽減設定時は無効化する。ページ内アンカーリンクにも自動対応。

```ts
import { MomentumScroll } from "vaultscript";

const scroll = new MomentumScroll({
  duration: 1.2,
});

// スクロール停止・再開
scroll.stop();
scroll.start();

// 任意の位置へスクロール
scroll.scrollTo("#section");
scroll.scrollTo(500);
```

---

### `Toggle` / `ToggleButton`

`aria-expanded` ベースのアクセシブルなトグル。ボタンラベルの切り替えにも対応。

```ts
import { Toggle } from "vaultscript";

// セレクターで複数ボタンをまとめて初期化
const toggle = new Toggle("[data-toggle]", {
  label: {
    open: "メニューを開く",
    close: "メニューを閉じる",
  },
});
```

```html
<button aria-controls="menu" aria-expanded="false" data-toggle>メニューを開く</button>
<nav id="menu">...</nav>
```

**Options**

| Option | Type | Description |
|--------|------|-------------|
| `label.open` | `string` | 開いている時のラベル |
| `label.close` | `string` | 閉じている時のラベル |
| `label.el` | `string` | ラベルを変えるセレクター（省略時はボタン自身） |

**Callback**

```ts
new Toggle("[data-toggle]", {}, (button, isOpen) => {
  console.log(isOpen ? "opened" : "closed");
});
```

---

### `ModalDialog`

モーダルダイアログの Web Component。CSS アニメーションの完了を待ってから `close()` を実行するため、閉じるアニメーションが確実に動く。

```ts
import { createModal } from "vaultscript";

createModal(); // <modal-dialog> カスタム要素を登録
```

```html
<modal-dialog>
  <button>開く</button>
  <dialog>
    <p>ダイアログの内容</p>
  </dialog>
</modal-dialog>
```

---

### `invokerPolyfill`

[Invoker Commands API](https://developer.mozilla.org/en-US/docs/Web/API/Invoker_Commands_API) のポリフィル。`commandfor` / `command` 属性と `closedby` 属性をネイティブ未対応ブラウザで動作させる。MutationObserver で動的追加要素にも自動対応。

```ts
import { invokerPolyfill } from "vaultscript";

invokerPolyfill.init();
```

```html
<!-- Dialog -->
<button commandfor="my-dialog" command="show-modal">開く</button>
<dialog id="my-dialog" closedby="any">
  <button commandfor="my-dialog" command="close">閉じる</button>
</dialog>

<!-- Popover -->
<button commandfor="my-popover" command="toggle-popover">トグル</button>
<div id="my-popover" popover>Popover</div>
```

**対応コマンド**

| command | 対象 | 動作 |
|---------|------|------|
| `show-modal` | `<dialog>` | モーダルとして開く |
| `close` | `<dialog>` | 閉じる |
| `request-close` | `<dialog>` | close イベントを発火してから閉じる |
| `show-popover` | `[popover]` | 表示 |
| `hide-popover` | `[popover]` | 非表示 |
| `toggle-popover` | `[popover]` | トグル |
| `--custom-*` | 任意 | `command` イベントとして発火 |

**`closedby` 属性**

| 値 | 動作 |
|----|------|
| `any` | 背景クリック・ESC キーで閉じる |
| `closerequest` | ESC キーのみで閉じる |
| `none` | 明示的なボタンのみで閉じる |

---

## Utils

### `animationFinished`

要素の CSS アニメーションが完了するまで待つ。`animationFinished` が解決した後に処理を続けることで、アニメーション途中での DOM 操作を防ぐ。

```ts
import { animationFinished } from "vaultscript";

await animationFinished(element);
// または
await animationFinished("#my-element");
```

---

### `debounce`

関数の呼び出しを間引く。resize・input・scroll イベントなどで使用。

```ts
import { debounce } from "vaultscript";

window.addEventListener("resize", debounce(() => {
  console.log("resized");
}, 300));
```

---

### `deepMerge`

オブジェクトをディープマージする。ネストされたオプションのマージに使用。

```ts
import { deepMerge } from "vaultscript";

const result = deepMerge({ a: { b: 1 } }, { a: { c: 2 } });
// → { a: { b: 1, c: 2 } }
```

---

### `spanWrap`

テキストノードの各文字を `<span>` で囲む。1文字ずつアニメーションさせる際に使用。

```ts
import { spanWrap } from "vaultscript";

const el = document.querySelector(".title");
spanWrap(el);
// "Hello" → <span>H</span><span>e</span><span>l</span>...
```

---

### `sanitizeHtml`

[DOMPurify](https://github.com/cure53/DOMPurify) を使った HTML サニタイズ。SSR 環境（Node.js）でも JSDOM 経由で動作する。

```ts
import { sanitizeHtml } from "vaultscript";

// 許可タグ付きでサニタイズ
const clean = sanitizeHtml('<p>Hello <script>alert(1)</script></p>');
// → "<p>Hello </p>"

// 全タグを除去
const plainText = sanitizeHtml("<b>Hello</b>", true);
// → "Hello"
```

---

## License

MIT © Shibata Hironori
