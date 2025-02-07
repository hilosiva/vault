import { MomentumScroll, Loading, Toggle } from "vaultjs";

new Loading();
new MomentumScroll();
new Toggle('.js-button', {
  label: {
    open: "閉じる",
  }
});
