import { MomentumScroll, Loading, Toggle, createModal, invokerPolyfill } from "vaultscript";

invokerPolyfill.init();

new Loading();
new MomentumScroll();
new Toggle(".js-button", {
  label: {
    open: "閉じる",
  },
});

createModal();
