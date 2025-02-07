import DOMPurify from "dompurify";
import { JSDOM } from "jsdom";

export function sanitizeHtml(input: string, isAllSanitize?: boolean): string {
  // JSDOM を使って仮想的な DOM を作成
  const window = new JSDOM("").window;

  // サーバーサイドの DOMPurify インスタンスを生成
  const purify = DOMPurify(window);

  // 許可するタグの指定
  const allowedTags = isAllSanitize
    ? []
    : ["br", "wbr", "ul", "ol", "li", "p", "em", "strong", "time", "a", "i", "u", "b", "ins"];

  return purify.sanitize(input, {
    ALLOWED_TAGS: allowedTags, // 許可するタグのみ指定
    ALLOWED_ATTR: [], // 属性を完全無効化（必要に応じて変更可能）
  });
}
