import Lenis, { type LenisOptions } from "lenis";

export default class MomentumScroll {
  lenis: Lenis | null;
  linkEls: NodeListOf<HTMLElement>;
  options: LenisOptions;
  mediaQuery: MediaQueryList;

  constructor(options?: LenisOptions) {
    const defaultOptions: LenisOptions = {
      autoRaf: true,
    };

    this.lenis = null;

    this.options = Object.assign(defaultOptions, options);
    this.mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    this.linkEls = document.querySelectorAll('a[href^="#"]');
    this.mediaQuery.addEventListener("change", this._init.bind(this));

    if (this.linkEls) {
      for (let i = 0; i < this.linkEls.length; i++) {
        this.linkEls[i].addEventListener("click", this._pageLink.bind(this));
      }
    }

    this._init();
  }

  private _init() {
    if (this.mediaQuery.matches) {
      this.destroy();
    } else {
      this.run();
    }
  }

  private _pageLink(e: Event) {
    if (!(e.currentTarget instanceof HTMLElement)) {
      console.error(`${e.currentTarget}がHTMLElementではありません`);
      return;
    }

    const anchor = e.currentTarget?.getAttribute("href");
    if (anchor) this.lenis?.scrollTo(anchor);
  }

  run() {
    this.lenis = new Lenis(this.options);
  }

  stop() {
    this.lenis?.stop();
  }

  start() {
    this.lenis?.start();
  }

  destroy() {
    this.lenis?.destroy();
  }

  scrollTo(anchor: string | number | HTMLElement) {
    this.lenis?.scrollTo(anchor);
  }

  scroll() {
    return this.lenis?.scroll;
  }
}
