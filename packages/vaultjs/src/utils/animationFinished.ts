export const animationFinished = (selector: string): Promise<PromiseSettledResult<Animation>[]> => {
  const elem = document.querySelector<HTMLElement>(selector);

  if (!elem?.getAnimations()[0]) {
    return Promise.resolve([]);
  }

  return Promise.allSettled([...elem.getAnimations()].map((animation) => animation.finished));
};
