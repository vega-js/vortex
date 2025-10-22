export type RetryOptions = {
  retries?: number;
  delay?: number;
  factor?: number;
};

export function retry<T>(
  asyncFn: () => Promise<T>,
  options?: RetryOptions,
): Promise<T> {
  const { retries = 3, delay = 1000, factor = 2 } = options || {};

  return new Promise<T>((resolve, reject) => {
    const attempt = (remaining: number, currentDelay: number) => {
      asyncFn()
        .then(resolve)
        .catch((err) => {
          if (remaining > 0) {
            setTimeout(() => {
              attempt(remaining - 1, currentDelay * factor);
            }, currentDelay);
          } else {
            reject(err);
          }
        });
    };

    attempt(retries, delay);
  });
}
