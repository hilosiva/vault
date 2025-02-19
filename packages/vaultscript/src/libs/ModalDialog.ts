import { animationFinished } from "../utils/animationFinished";

export class ModalDialog extends HTMLElement {

  dialog: HTMLDialogElement | null = null;
  button: HTMLButtonElement | null = null;
  isTransition: boolean = false;

  constructor() {
    super();

  }

  connectedCallback() {
    this.dialog = this.querySelector<HTMLDialogElement>(':scope > dialog');
    this.button = this.querySelector<HTMLButtonElement>(':scope > button');

    if (!this.dialog || !this.button) return;

    this.button.addEventListener("click", this.toggle.bind(this), { passive: true });
    this.dialog.addEventListener("click", this.backdropClose.bind(this));
    document.addEventListener("keydown", this.escapeClose.bind(this));
  }

  disconnectedCallback() {
    if (this.button) {
      this.button.removeEventListener("click", this.toggle.bind(this));
    }

    if (this.dialog) {
      this.dialog.removeEventListener("click", this.backdropClose.bind(this));
    }

    document.removeEventListener("keydown", this.escapeClose.bind(this));
  }

  toggle() {
    if (!this.dialog) return;
    this.dialog.open ? this.closeDialog() : this.openDialog();
  }

  escapeClose(e: KeyboardEvent) {
    if (!this.dialog?.open) return;
    if (e.key === "Escape") {
      e.preventDefault()
      this.closeDialog();
    }
  }

  backdropClose(e: MouseEvent) {
    if (!this.dialog?.open) return;
    if (e.target === this.dialog && e.target !== this.dialog?.firstChild) {
      this.closeDialog();
    }
  }

  openDialog() {
    if ( this.isTransition) return;
    this.isTransition = true;

    this.dialog?.showModal();

    requestAnimationFrame(async () => {
      if (!this.dialog ) return;
      this.dialog?.setAttribute("data-open", "");
      await animationFinished(this.dialog);
      this.isTransition = false;
    });
  }

  async closeDialog() {
    if (!this.dialog || this.isTransition) return;
    this.isTransition = true;
    this.dialog?.removeAttribute("data-open");
    await animationFinished(this.dialog);
    this.dialog?.close();
    this.isTransition = false;
  }

}




export const createModal = () => {
  customElements.define("modal-dialog", ModalDialog);
}
