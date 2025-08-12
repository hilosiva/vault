/**
 * Invoker Commands API のポリフィル
 *
 * 対応機能:
 * - commandfor属性 + command属性による宣言的な制御
 *   - Dialog要素: show-modal, close, request-close
 *   - Popover要素: show-popover, hide-popover, toggle-popover
 *   - カスタムコマンド: --で始まるコマンド
 * - closedby属性による背景クリック・ESCキー制御（Dialog要素のみ）
 * - 既存のHTMLを変更せずに動作
 */

interface InvokerPolyfillOptions {
  debug?: boolean;
  autoInit?: boolean;
  observeChanges?: boolean;
}

interface SupportStatus {
  command: boolean;
  closedBy: boolean;
}

type CommandType = "show-modal" | "close" | "request-close" | "show-popover" | "hide-popover" | "toggle-popover" | string;

type ClosedByType = "any" | "closerequest" | "none";

type CommandHandler = (target: Element, sourceButton: HTMLButtonElement) => void;

type CommandHandlers = {
  [key in CommandType]?: CommandHandler;
};

interface ExtendedElement extends Element {
  _polyfillClickHandler?: (event: Event) => void;
  _polyfillLightDismissHandler?: (event: MouseEvent) => void;
  _polyfillEscapeHandler?: (event: KeyboardEvent) => void;
}

interface PopoverElement extends Element {
  showPopover?: () => void;
  hidePopover?: () => void;
  togglePopover?: () => void;
}

class InvokerPolyfill {
  private options: Required<InvokerPolyfillOptions>;
  private support: SupportStatus;
  private appliedButtons: WeakSet<HTMLButtonElement>;
  private appliedDialogs: WeakSet<HTMLDialogElement>;
  private observer: MutationObserver | null;

  constructor(options: InvokerPolyfillOptions = {}) {
    this.options = {
      debug: options.debug || false,
      autoInit: options.autoInit !== false, // デフォルトはtrue
      observeChanges: options.observeChanges !== false, // デフォルトはtrue
      ...options,
    };

    // サポート状況の検出
    this.support = {
      command: "commandForElement" in HTMLButtonElement.prototype,
      closedBy: "closedBy" in HTMLDialogElement.prototype,
    };

    // 管理用のWeakMapとSet
    this.appliedButtons = new WeakSet();
    this.appliedDialogs = new WeakSet();
    this.observer = null;

    this.log("InvokerPolyfill initialized with options:", this.options);
    this.log("Browser support:", this.support);

    if (this.options.autoInit) {
      this.init();
    }
  }

  /**
   * デバッグログ出力
   */
  private log(...args: unknown[]): void {
    if (this.options.debug) {
      console.log("[InvokerPolyfill]", ...args);
    }
  }

  /**
   * 警告ログ出力
   */
  private warn(...args: unknown[]): void {
    console.warn("[InvokerPolyfill]", ...args);
  }

  /**
   * エラーログ出力
   */
  private error(...args: unknown[]): void {
    console.error("[InvokerPolyfill]", ...args);
  }

  /**
   * 初期化
   */
  public init(): void {
    this.log("Initializing...");

    // defer属性で読み込まれることを想定し、即座に実行
    this.applyPolyfills();
    if (this.options.observeChanges) {
      this.startObserving();
    }
  }

  /**
   * すべてのポリフィルを適用
   */
  private applyPolyfills(): void {
    this.polyfillCommandAttributes();
    this.polyfillClosedByAttribute();
  }

  /**
   * commandfor/command属性のポリフィル
   */
  private polyfillCommandAttributes(): void {
    if (this.support.command) {
      this.log("✅ Command attributes are natively supported");
      return;
    }

    this.log("🔄 Applying command attributes polyfill...");

    const commandButtons = document.querySelectorAll<HTMLButtonElement>("button[commandfor][command]");
    let appliedCount = 0;

    commandButtons.forEach((button: HTMLButtonElement) => {
      if (this.appliedButtons.has(button)) {
        return; // 既に適用済み
      }

      const targetId = button.getAttribute("commandfor");
      const command = button.getAttribute("command");
      if (!targetId || !command) return;

      const target = document.getElementById(targetId);

      if (!target) {
        this.warn(`Target element with id="${targetId}" not found for button:`, button);
        return;
      }

      // イベントリスナーを追加
      const clickHandler = (event: Event): void => {
        if (event.defaultPrevented) {
          return; // 既にpreventDefaultが呼ばれていたら実行しない
        }
        event.preventDefault();
        this.executeCommand(target, command, button);
      };

      button.addEventListener("click", clickHandler);

      // 管理用にボタンを記録
      this.appliedButtons.add(button);

      // クリーンアップ用にハンドラーを保存
      (button as ExtendedElement)._polyfillClickHandler = clickHandler;

      appliedCount++;
      this.log(`✅ Command polyfill applied: ${command} for #${targetId}`);
    });

    this.log(`Applied command polyfill to ${appliedCount} buttons`);
  }

  /**
   * closedby属性のポリフィル
   */
  private polyfillClosedByAttribute(): void {
    if (this.support.closedBy) {
      this.log("✅ ClosedBy attribute is natively supported");
      return;
    }

    this.log("🔄 Applying closedBy attribute polyfill...");

    const dialogsWithClosedBy = document.querySelectorAll<HTMLDialogElement>("dialog[closedby]");
    let appliedCount = 0;

    dialogsWithClosedBy.forEach((dialog: HTMLDialogElement) => {
      if (this.appliedDialogs.has(dialog)) {
        return; // 既に適用済み
      }

      const closedBy = dialog.getAttribute("closedby") as ClosedByType | null;
      if (!closedBy) return;

      switch (closedBy) {
        case "any":
          this.setupLightDismiss(dialog);
          this.setupEscapeKeyClose(dialog);
          break;

        case "closerequest":
          this.setupEscapeKeyClose(dialog);
          break;

        case "none":
          // 何もしない（明示的な閉じるボタンのみ）
          break;

        default:
          this.warn(`Unknown closedby value: ${closedBy}`);
          return; // continueの代わりにreturnを使用
      }

      this.appliedDialogs.add(dialog);
      appliedCount++;
      this.log(`✅ ClosedBy polyfill applied: ${closedBy} for #${dialog.id}`);
    });

    this.log(`Applied closedBy polyfill to ${appliedCount} dialogs`);
  }

  /**
   * コマンドの実行
   */
  private executeCommand(target: Element, command: CommandType, sourceButton: HTMLButtonElement): void {
    try {
      const commandHandler = this.getCommandHandler(command);
      if (commandHandler) {
        commandHandler.call(this, target, sourceButton);
      } else {
        this.handleCustomCommand(target, command, sourceButton);
      }
    } catch (error) {
      this.error(`Error executing command "${command}":`, error);
    }
  }

  /**
   * 組み込みコマンドハンドラーを取得
   */
  private getCommandHandler(command: CommandType): CommandHandler | undefined {
    const handlers: CommandHandlers = {
      "show-modal": this.handleShowModal,
      close: this.handleClose,
      "request-close": this.handleRequestClose,
      "show-popover": this.handleShowPopover,
      "hide-popover": this.handleHidePopover,
      "toggle-popover": this.handleTogglePopover,
    };

    return handlers[command];
  }

  /**
   * show-modalコマンドハンドラー
   */
  private handleShowModal = (target: Element, _sourceButton: HTMLButtonElement): void => {
    if (target.tagName === "DIALOG") {
      (target as HTMLDialogElement).showModal();
      this.log(`📖 Dialog #${target.id} opened as modal`);
    }
  };

  /**
   * closeコマンドハンドラー
   */
  private handleClose = (target: Element, _sourceButton: HTMLButtonElement): void => {
    if (target.tagName === "DIALOG") {
      (target as HTMLDialogElement).close();
      this.log(`📕 Dialog #${target.id} closed`);
    }
  };

  /**
   * request-closeコマンドハンドラー
   */
  private handleRequestClose = (target: Element, _sourceButton: HTMLButtonElement): void => {
    if (target.tagName === "DIALOG") {
      const dialogTarget = target as HTMLDialogElement;
      // close eventを発火してからclose()を実行
      const closeEvent = new Event("close", { bubbles: false, cancelable: false });
      dialogTarget.dispatchEvent(closeEvent);
      dialogTarget.close();
      this.log(`📕 Dialog #${target.id} close requested and closed`);
    }
  };

  /**
   * show-popoverコマンドハンドラー
   */
  private handleShowPopover = (target: Element, _sourceButton: HTMLButtonElement): void => {
    const popoverTarget = target as PopoverElement;
    if (target.hasAttribute("popover") && typeof popoverTarget.showPopover === "function") {
      popoverTarget.showPopover();
      this.log(`🎈 Popover #${target.id} shown`);
    }
  };

  /**
   * hide-popoverコマンドハンドラー
   */
  private handleHidePopover = (target: Element, _sourceButton: HTMLButtonElement): void => {
    const popoverTarget = target as PopoverElement;
    if (target.hasAttribute("popover") && typeof popoverTarget.hidePopover === "function") {
      popoverTarget.hidePopover();
      this.log(`🎈 Popover #${target.id} hidden`);
    }
  };

  /**
   * toggle-popoverコマンドハンドラー
   */
  private handleTogglePopover = (target: Element, _sourceButton: HTMLButtonElement): void => {
    const popoverTarget = target as PopoverElement;
    if (target.hasAttribute("popover") && typeof popoverTarget.togglePopover === "function") {
      popoverTarget.togglePopover();
      this.log(`🎈 Popover #${target.id} toggled`);
    }
  };

  /**
   * カスタムコマンドの処理
   */
  private handleCustomCommand(target: Element, command: CommandType, sourceButton: HTMLButtonElement): void {
    if (command.startsWith("--")) {
      const commandEvent = new CustomEvent("command", {
        detail: {
          command: command,
          source: sourceButton,
        },
        bubbles: true,
        cancelable: true,
      });
      target.dispatchEvent(commandEvent);
      this.log(`🎯 Custom command "${command}" dispatched to #${target.id}`);
    } else {
      this.warn(`Unknown command: ${command}`);
    }
  }

  /**
   * ライトディスミス（背景クリックで閉じる）機能を設定
   */
  private setupLightDismiss(dialog: HTMLDialogElement): void {
    const clickHandler = (event: MouseEvent): void => {
      // ダイアログがモーダルでない場合は動作しない
      if (!dialog.open || !dialog.hasAttribute("open")) return;

      const rect = dialog.getBoundingClientRect();
      const clickX = event.clientX;
      const clickY = event.clientY;

      // クリック位置がダイアログの範囲外かどうかを判定
      const isOutside = clickX < rect.left || clickX > rect.right || clickY < rect.top || clickY > rect.bottom;

      if (isOutside) {
        dialog.close();
        this.log(`📕 Dialog #${dialog.id} closed by light dismiss`);
      }
    };

    dialog.addEventListener("click", clickHandler);

    // クリーンアップ用にハンドラーを保存
    (dialog as ExtendedElement)._polyfillLightDismissHandler = clickHandler;
  }

  /**
   * ESCキーで閉じる機能を設定
   */
  private setupEscapeKeyClose(dialog: HTMLDialogElement): void {
    const keydownHandler = (event: KeyboardEvent): void => {
      if (event.key === "Escape" && dialog.open) {
        // モーダルダイアログかどうかを判定
        const isModal = dialog.matches(":modal");

        if (!isModal) {
          dialog.close();
          this.log(`📕 Dialog #${dialog.id} closed by escape key`);
        }
      }
    };

    document.addEventListener("keydown", keydownHandler);

    // クリーンアップ用にハンドラーを保存
    (dialog as ExtendedElement)._polyfillEscapeHandler = keydownHandler;
  }

  /**
   * MutationObserverを開始
   */
  private startObserving(): void {
    if (this.observer) {
      return; // 既に監視中
    }

    this.observer = new MutationObserver((mutations: MutationRecord[]) => {
      let shouldReapply = false;

      mutations.forEach((mutation) => {
        // 新しいノードが追加された場合
        mutation.addedNodes.forEach((node: Node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            const element = node as Element;
            if (
              element.matches("button[commandfor][command]") ||
              element.querySelector("button[commandfor][command]") ||
              element.matches("dialog[closedby]") ||
              element.querySelector("dialog[closedby]")
            ) {
              shouldReapply = true;
            }
          }
        });

        // 属性が変更された場合
        if (mutation.type === "attributes") {
          const target = mutation.target as Element;
          if (
            (target.tagName === "BUTTON" && (mutation.attributeName === "commandfor" || mutation.attributeName === "command")) ||
            (target.tagName === "DIALOG" && mutation.attributeName === "closedby")
          ) {
            shouldReapply = true;
          }
        }
      });

      if (shouldReapply) {
        // 少し遅延させて重複実行を防ぐ
        setTimeout(() => {
          this.applyPolyfills();
        }, 0);
      }
    });

    this.observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["commandfor", "command", "closedby"],
    });

    this.log("Started observing DOM changes");
  }

  /**
   * MutationObserverを停止
   */
  private stopObserving(): void {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
      this.log("Stopped observing DOM changes");
    }
  }

  /**
   * ポリフィルを手動で再適用
   */
  public reapply(): void {
    this.log("🔄 Manually reapplying polyfills...");
    this.applyPolyfills();
  }

  /**
   * 特定の要素にのみポリフィルを適用
   */
  public applyToElement(element: Element): void {
    this.log("🔄 Applying polyfill to specific element:", element);

    // commandfor属性を持つボタンの場合
    if (element.matches("button[commandfor][command]")) {
      const buttonElement = element as HTMLButtonElement;
      if (!this.support.command && !this.appliedButtons.has(buttonElement)) {
        const targetId = buttonElement.getAttribute("commandfor");
        const command = buttonElement.getAttribute("command");
        if (!targetId || !command) return;

        const target = document.getElementById(targetId);

        if (target) {
          const clickHandler = (event: Event): void => {
            if (event.defaultPrevented) {
              return; // 既にpreventDefaultが呼ばれていたら実行しない
            }
            event.preventDefault();
            this.executeCommand(target, command, buttonElement);
          };

          buttonElement.addEventListener("click", clickHandler);
          this.appliedButtons.add(buttonElement);
          (buttonElement as ExtendedElement)._polyfillClickHandler = clickHandler;

          this.log(`✅ Command polyfill applied to specific element: ${command} for #${targetId}`);
        }
      }
    }

    // closedby属性を持つダイアログの場合
    if (element.matches("dialog[closedby]")) {
      const dialogElement = element as HTMLDialogElement;
      if (!this.support.closedBy && !this.appliedDialogs.has(dialogElement)) {
        const closedBy = dialogElement.getAttribute("closedby") as ClosedByType | null;
        if (!closedBy) return;

        switch (closedBy) {
          case "any":
            this.setupLightDismiss(dialogElement);
            this.setupEscapeKeyClose(dialogElement);
            break;
          case "closerequest":
            this.setupEscapeKeyClose(dialogElement);
            break;
        }

        this.appliedDialogs.add(dialogElement);
        this.log(`✅ ClosedBy polyfill applied to specific element: ${closedBy} for #${dialogElement.id}`);
      }
    }

    // 子要素もチェック
    const childButtons = element.querySelectorAll<HTMLButtonElement>("button[commandfor][command]");
    const childDialogs = element.querySelectorAll<HTMLDialogElement>("dialog[closedby]");

    childButtons.forEach((button: HTMLButtonElement) => this.applyToElement(button));
    childDialogs.forEach((dialog: HTMLDialogElement) => this.applyToElement(dialog));
  }

  /**
   * ポリフィルをクリーンアップ
   */
  public cleanup(): void {
    this.log("🧹 Cleaning up polyfill...");

    this.stopObserving();

    // ボタンのイベントリスナーをクリーンアップ
    document.querySelectorAll<HTMLButtonElement>("button[commandfor][command]").forEach((button: HTMLButtonElement) => {
      const extendedButton = button as ExtendedElement;
      if (extendedButton._polyfillClickHandler) {
        button.removeEventListener("click", extendedButton._polyfillClickHandler);
        delete extendedButton._polyfillClickHandler;
      }
    });

    // ダイアログのイベントリスナーをクリーンアップ
    document.querySelectorAll<HTMLDialogElement>("dialog[closedby]").forEach((dialog: HTMLDialogElement) => {
      const extendedDialog = dialog as ExtendedElement;
      if (extendedDialog._polyfillLightDismissHandler) {
        dialog.removeEventListener("click", extendedDialog._polyfillLightDismissHandler);
        delete extendedDialog._polyfillLightDismissHandler;
      }
      if (extendedDialog._polyfillEscapeHandler) {
        document.removeEventListener("keydown", extendedDialog._polyfillEscapeHandler);
        delete extendedDialog._polyfillEscapeHandler;
      }
    });

    // WeakSetをクリア
    this.appliedButtons = new WeakSet();
    this.appliedDialogs = new WeakSet();

    this.log("✅ Cleanup completed");
  }

  /**
   * カスタムコマンドハンドラーを追加
   */
  public addCommandHandler(command: CommandType, handler: CommandHandler): void {
    if (typeof handler !== "function") {
      throw new Error("Command handler must be a function");
    }

    // 既存のgetCommandHandlerをオーバーライド
    const originalGetCommandHandler = this.getCommandHandler;
    this.getCommandHandler = function (cmd: CommandType): CommandHandler | undefined {
      if (cmd === command) {
        return handler;
      }
      return originalGetCommandHandler.call(this, cmd);
    };

    this.log(`✅ Custom command handler added: ${command}`);
  }

  /**
   * サポート状況を取得
   */
  public getSupport(): SupportStatus {
    return { ...this.support };
  }

  /**
   * バージョン情報
   */
  public static get version(): string {
    return "2.0.0";
  }
}

// デフォルトインスタンスを作成（自動初期化はしない）
const invokerPolyfill = new InvokerPolyfill({ autoInit: false });

// ESモジュールとしてのエクスポート
export default invokerPolyfill;
export { InvokerPolyfill, type InvokerPolyfillOptions, type SupportStatus, type CommandType, type ClosedByType, type CommandHandler, type CommandHandlers };

/**
 * 使用方法:
 *
 * === NPMパッケージとして使用 ===
 *
 * 1. シンプルな使用（推奨）:
 * ```typescript
 * import invokerPolyfill from 'invoker-polyfill';
 * invokerPolyfill.init();
 * ```
 *
 * 2. カスタム設定で使用:
 * ```typescript
 * import { InvokerPolyfill } from 'invoker-polyfill';
 * const polyfill = new InvokerPolyfill({
 *   debug: true,
 *   autoInit: false,
 *   observeChanges: true
 * });
 * polyfill.init();
 * ```
 *
 * 3. 型定義を使用:
 * ```typescript
 * import invokerPolyfill, { InvokerPolyfillOptions } from 'invoker-polyfill';
 * const options: InvokerPolyfillOptions = { debug: true };
 * const polyfill = new InvokerPolyfill(options);
 * ```
 *
 * === HTMLでの使用例 ===
 * ```html
 * <button commandfor="dialog" command="show-modal">Open Dialog</button>
 * <dialog id="dialog" closedby="any">Dialog Content</dialog>
 *
 * <button commandfor="popover" command="toggle-popover">Toggle Popover</button>
 * <div id="popover" popover>Popover Content</div>
 * ```
 *
 *
 * === 高度な使用方法 ===
 * ```typescript
 * import invokerPolyfill from 'invoker-polyfill';
 *
 * // 特定要素への適用
 * invokerPolyfill.applyToElement(document.getElementById('my-dialog'));
 *
 * // カスタムコマンドの追加
 * invokerPolyfill.addCommandHandler('--my-custom-command', (target, sourceButton) => {
 *   console.log('Custom command executed on:', target);
 * });
 *
 * // 手動再適用
 * invokerPolyfill.reapply();
 *
 * // クリーンアップ
 * invokerPolyfill.cleanup();
 * ```
 *
 * 対応要素:
 * - Dialog要素: <dialog> with closedby attribute
 * - Popover要素: <div popover> / <section popover> etc.
 * - 任意の要素: カスタムコマンドで制御可能
 */
