const el = document.querySelector("[data-loader]");

export const loadingAnimation = async () => {
  return await new Promise((resolve) => {
    el?.setAttribute("data-loading", "");

    setTimeout(() => {
      resolve(true);
    }, 1000);
  });
};

export const loadingOutAnimation = async () => {
  return await new Promise((resolve) => {
    el?.removeAttribute("data-loading");
    resolve(true);
  });
};
