import { MomentumScroll, Loading, Toggle } from "vaultscript";

new Loading();
new MomentumScroll();
new Toggle('.js-button', {
  label: {
    open: "閉じる",
  }
});
