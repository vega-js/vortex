import type { Query, QueryData, QueryOptions } from '../../types';
import { createReactive } from '../create-reactive';
import type { ReactiveContext } from '../reactive-context';

const createInitial = () => ({
  isLoading: false,
  isSuccess: false,
  isError: false,
  error: null,
  data: undefined,
});

export const createQuery = <Data, TError, TOptions>(
  asyncFn: (options: TOptions) => Promise<Data>,
  context: ReactiveContext,
  options?: QueryOptions<Data, TError>,
): Query<Data, TError, TOptions> => {
  let lastOptions: TOptions;
  const { isAutorun = false, onError, onSuccess } = options || {};

  const state = createReactive<QueryData<Data, TError>>(
    createInitial(),
    context,
  );

  const setLoading = () =>
    state.set({
      ...state.get(),
      isLoading: true,
      isSuccess: false,
      isError: false,
      error: null,
    });
  const setSuccess = (data: Data) =>
    state.set({ ...state.get(), isLoading: false, isSuccess: true, data });
  const setError = (error: TError) =>
    state.set({
      ...state.get(),
      data: undefined,
      isLoading: false,
      isError: true,
      error,
    });

  const run = async (runOptions: TOptions) => {
    lastOptions = runOptions;
    setLoading();

    try {
      const result = await asyncFn(runOptions);

      setSuccess(result);
      onSuccess?.(result);
    } catch (err) {
      setError(err as TError);
      onError?.(err as TError);
    }
  };

  if (isAutorun) {
    run(undefined as TOptions);
  }

  const reset = () => {
    state.set(createInitial());
    lastOptions = undefined as TOptions;
  };
  const refetch = () => run(lastOptions);

  return {
    type: 'query',
    get: state.get,
    set: state.set,
    run,
    reset,
    refetch,
    subscribe: state.subscribe,
  };
};
