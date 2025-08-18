import {debounce} from "../utils/debounce";


declare global {
  interface Window {
    isReduceMotion: boolean;
    isLoaded: boolean;
    isEnabledScript: boolean | undefined;
    isIos: boolean | undefined;
  }
}

export type AnimateFunction = () => Promise<boolean>;

export interface Options {
  isJS: boolean,
  isLoad: boolean,
  isIos: boolean,
  isResize: boolean,
  isReduceMotion: boolean,
  once: boolean,
  viewport: number,
  targetSelector: string,
  eventType: 'load' | 'astro:page-load',
  loadingAnimation: AnimateFunction | false,
  loadingOutAnimation: AnimateFunction| false,
  pageTransitionOut: AnimateFunction | false,
  pageTransitionIn: AnimateFunction | false,
}


export default class Loading {

  private resizeTimeoutId: NodeJS.Timeout | undefined;
  private isResizing: boolean = false;
  private loadedEvent: Event | null = null;
  private isAnimated: boolean = false;
  public isLoaded: boolean = false;
  public isVisited: boolean = false;
  private target: HTMLElement | null;
  private metaElem: HTMLMetaElement | null = null;
  private options: Options;

  constructor(options?: Partial<Options>) {

    const defaultOptions: Options = {
      isJS: true,
      isLoad: true,
      isIos: true,
      isResize: true,
      isReduceMotion: true,
      once: true,
      viewport: 375,
      targetSelector: "html",
      eventType: "load",
      loadingAnimation: false,
      loadingOutAnimation: false,
      pageTransitionOut: false,
      pageTransitionIn: false,
    };

    this.options = Object.assign(defaultOptions, options);
    this.target = document.querySelector<HTMLElement>(this.options.targetSelector);

    this._init();
  }


  private async _init() {
    if (!this.target) return;


    if (this.options.isJS) {
      window.isEnabledScript = true;
      this.target.removeAttribute("data-script-disabled");
    }

    if (this.options.viewport) {
      this.metaElem = document.querySelector('meta[name="viewport"]');

      const debouncedResize = debounce(this._setViewport);
      this._setViewport();
      window.addEventListener("resize", debouncedResize.bind(this), false);
    }

    if (this.options.once) {
      // 訪問状況を確認
      this._getVisited();
    }

    if (this.options.isLoad) {
      if (this.options.eventType === "astro:page-load") {
        document.addEventListener("astro:page-load", this._loading.bind(this));
      } else {
        window.addEventListener("load", this._loading.bind(this));
      }
    }


    // prefersReducedMotion
    if (this.options.isReduceMotion) {
      const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

      window.isReduceMotion = mediaQuery.matches;

      mediaQuery.addEventListener("change", () => {
        window.isReduceMotion = mediaQuery.matches;
      });
    }

    // IOS
    if (this.options.isIos) {
      this._checkIos();
    }

    // Resize
    if (!window.isIos && this.options.isResize) {
      window.addEventListener("resize", this._resize.bind(this), { passive: true });
    }

    // ローディング
    this.isAnimated =
      this.options.loadingAnimation && (!this.options.once || !this.isVisited)
        ? await this.options.loadingAnimation()
        : true;

    this._checkLoaded();
  }


  // Viewportを設定
   private _setViewport() {
    const value =
      window.outerWidth > this.options.viewport
        ? "width=device-width, initial-scale=1.0"
        : `width=${this.options.viewport}`;

     this.metaElem?.setAttribute("content", value);
   }

  private _setVisited() {
    try {
      sessionStorage.setItem("isVisited", "true");
    } catch (error) {
      console.warn('Could not access sessionStorage:', error);
    }
    this._getVisited();
  }

  private _getVisited() {
    try {
      this.isVisited = !!sessionStorage.getItem("isVisited");
    } catch (error) {
      console.warn('Could not access sessionStorage:', error);
      this.isVisited = false;
    }
  }


  private async _loading() {
    this.isLoaded = true;
    this.loadedEvent = new CustomEvent("vault:ready");
    await this._checkLoaded();
  }

  private async _checkLoaded() {
    if (this.isAnimated && this.isLoaded) {
      if (this.options.loadingOutAnimation && (!this.options.once || !this.isVisited))
        await this.options.loadingOutAnimation();
      if (this.options.once && !this.isVisited) this._setVisited();

      this.run();
    }
  }

  async run() {
    this.target?.setAttribute("data-loaded", "");
    this.target?.removeAttribute("data-loading");
    // イベントの発火
    if (this.loadedEvent) {
      document.dispatchEvent(this.loadedEvent);
    }

    if (this.options.pageTransitionIn) await this.options.pageTransitionIn();

  }

  private _checkIos() {
    window.isIos =
      /iP(hone|(o|a)d)/.test(navigator.userAgent) ||
      (/iPad|Macintosh/i.test(navigator.userAgent) && "ontouchend" in document);

    if (window.isIos) {
      this.target?.setAttribute("data-ios", "");
    }
  }

  private _resize() {
    if (!this.isResizing) {
      this.isResizing = true;
      this.target?.setAttribute("data-resize", "");
    }
    
    clearTimeout(this.resizeTimeoutId);

    this.resizeTimeoutId = setTimeout(() => {
      this.isResizing = false;
      this.target?.removeAttribute("data-resize");
    }, 500);
  }
}
