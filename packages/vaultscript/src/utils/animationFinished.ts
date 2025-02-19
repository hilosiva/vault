export const animationFinished = (selector: string | HTMLElement): Promise<PromiseSettledResult<Animation>[]> => {
  const elem = typeof selector === 'string'
    ? document.querySelector<HTMLElement>(selector)
    : selector;

  if (!elem?.getAnimations()[0]) {
    return Promise.resolve([]);
  }

  return Promise.allSettled([...elem.getAnimations()].map((animation) => animation.finished));
};
