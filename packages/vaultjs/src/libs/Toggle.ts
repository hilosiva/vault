export interface Label {
  open: string;
  close?: string;
  el?: string;
}

export interface ToggleOptions {
  label?: Label | false;
}


export interface buttonOptions {
  label?: Label | false;
}


export type CallbackFunction = (button: HTMLElement | null, isOpen: boolean) => void;


export class ToggleButton {
  private labelTarget: HTMLElement | null = null;
  private initialLabel: string | null = null;
  private options: ToggleOptions;
  private callback?: CallbackFunction;
  private defaultOptions: buttonOptions = {
    label: false,
  };

  button: HTMLElement;
  target: HTMLElement | null;
  isExpanded: boolean;
  isAriaLabel: boolean = false;

  constructor(button: HTMLElement, options: buttonOptions = {}, callback?: CallbackFunction ) {
    this.button = button;

    this.isExpanded = this.getExpanded();
    this.target = document.querySelector<HTMLElement>(`#${button.getAttribute("aria-controls")}`);
    this.options = Object.assign({}, this.defaultOptions, options);
    this.callback = callback;

    this._init();
  }


  private _init() {
    if (!this.target) return;

    if ( this.options.label) {
      this.labelTarget = this.options.label.el ? this.button.querySelector<HTMLElement>(this.options.label.el) : this.button;

      this.isAriaLabel = this.hasAriaLabel();
      this.initialLabel = this.getLabel();
    }


     this.button.addEventListener("click", this.toggle.bind(this), { passive: true });
  }

  hasExpanded() {
    return this.button.hasAttribute("aria-expanded");
  }

  getExpanded() {
    return this.button.getAttribute("aria-expanded") !== "false";
  }

  setExpanded(isExpanded: boolean) {
    this.isExpanded = isExpanded;
    if(this.hasExpanded()) this.button.setAttribute("aria-expanded", `${isExpanded}`);
  }

  hasAriaLabel() {
    return this.labelTarget?.hasAttribute("aria-label") || false;
  }


  getLabel() {
    if (!this.labelTarget) return null;
    return this.isAriaLabel ? this.labelTarget.getAttribute('aria-label') : this.labelTarget.innerText;
  }


  setLabel(label: string) {
    if (!this.labelTarget) return;
    if (this.isAriaLabel) {
      this.labelTarget.setAttribute("aria-label", label);
    } else {
      this.labelTarget.innerText = label;
    }
  }

  changeLabel() {
    if (!this.initialLabel || !this.options.label) return;

    if (this.isExpanded) {
      this.setLabel(this.options.label.open || this.initialLabel);
    } else {
      this.setLabel(this.options.label.close || this.initialLabel);
    }
  }



  open() {
    if (this.target?.hasAttribute("aria-hidden")) {
      this.target?.setAttribute("aria-hidden", "false");
    }

    this.target?.setAttribute("data-open", "");

    // callback
    if (this.callback) {
      this.callback(this.button, true);
    }
  }

  close() {
    if (this.target?.hasAttribute("aria-hidden")) {
      this.target?.setAttribute("aria-hidden", "true");
    }

    this.target?.removeAttribute("data-open");


    // callback
    if (this.callback) {
      this.callback(this.button, false);
    }

  }

  toggle() {
    this.isExpanded = this.getExpanded();


    if (!this.isExpanded) {
      this.open();
    } else {
      this.close();
    }
  }
}


export default class Toggle {
  private buttons: NodeListOf<HTMLElement> | null;
  private options: ToggleOptions;
  private callback?: CallbackFunction;

  private defaultOptions: ToggleOptions = {
    label: false,
  };


  constructor(selector: string, options: ToggleOptions = {}, callback?: CallbackFunction) {
    this.buttons = document.querySelectorAll(selector);
    this.options = Object.assign({}, this.defaultOptions, options);
    this.callback = callback;

    this._init();
  }

  private _init() {
    if (this.buttons) {
      this.buttons.forEach((button) => {
        const toggleButton = new ToggleButton(button, { label: this.options.label }, this.callback)
        this.observeButtonState(toggleButton);
      });
    }
  }



  private isOpen(target: HTMLElement) {
    return target.getAttribute("aria-hidden") === "false" || (target.hasAttribute("data-open") && target.getAttribute("data-open") !== "false") ;
  }

  private updateButton(button: ToggleButton) {
    if (!button.target) return;

    button.setExpanded(this.isOpen(button.target));
    button.changeLabel();
  }


  private observeButtonState(button: ToggleButton) {

    if (!button.target) return;


    // 初回実行
    this.updateButton(button);

    // MutationObserver のセットアップ
    const observer = new MutationObserver(() => {


       this.updateButton(button);
    });

    observer.observe(button.target, {
      attributes: true,
      attributeFilter: ["data-open", "aria-hidden"],
    });

    return observer; // 必要なら後で停止できるように返す
  };

}
