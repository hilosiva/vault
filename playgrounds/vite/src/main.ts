import { MomentumScroll, Loading, Toggle, createModal, invokerPolyfill } from "vaultscript";

invokerPolyfill.init();

new Loading();
new MomentumScroll({
  lerp: 0.05,
  duration: 0.6,
});
new Toggle(".js-button", {
  label: {
    open: "閉じる",
  },
});

createModal();
