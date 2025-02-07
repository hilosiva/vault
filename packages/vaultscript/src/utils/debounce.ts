export function debounce<T extends (...args: any[]) => void>(
  func: T,
  timeout: number = 300
): (this: ThisParameterType<T>, ...args: Parameters<T>) => void {
  let timer: ReturnType<typeof setTimeout>;

  return function (this: ThisParameterType<T>, ...args: Parameters<T>) {
    clearTimeout(timer);
    timer = setTimeout(() => {
      func.apply(this, args);
    }, timeout);
  };
}
