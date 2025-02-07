export const spanWrap = (el: HTMLElement): void => {
  const nodes = Array.from(el.childNodes); // NodeListを配列に変換
  let spanWrapText = "";

  nodes.forEach((node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      // テキストの場合
      const text = (node.textContent ?? "").replace(/\r?\n/g, ""); // null対策
      // spanで囲んで連結
      spanWrapText += text.split("").reduce((acc, v) => acc + `<span>${v}</span>`, "");
    } else if (node instanceof Element) {
      // <br>などの要素
      spanWrapText += node.outerHTML;
    }
  });

  el.innerHTML = spanWrapText;
};
