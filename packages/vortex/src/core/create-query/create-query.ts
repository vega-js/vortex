import type { Query, QueryData, QueryOptions } from '../../types';
import { ReactiveValue } from '../create-reactive';
import type { ReactiveContext } from '../reactive-context';

const createInitial = <Data, TError>() => ({
  isLoading: false,
  isSuccess: false,
  isError: false,
  error: null as TError | null,
  data: undefined as Data | undefined,
});

export class QueryHandler<Data, TError, TOptions>
  implements Query<Data, TError, TOptions>
{
  public type = 'query' as const;

  #lastOptions: TOptions | undefined;

  readonly #onError?: (error: TError) => void;

  readonly #onSuccess?: (data: Data) => void;

  readonly #state: ReactiveValue<QueryData<Data, TError>>;

  constructor(
    private readonly asyncFn: (options: TOptions) => Promise<Data>,
    private readonly context: ReactiveContext,
    private readonly options?: QueryOptions<Data, TError>,
  ) {
    this.#state = new ReactiveValue(
      createInitial<Data, TError>(),
      this.context,
    );

    this.#lastOptions = undefined;
    this.#onError = this.options?.onError;
    this.#onSuccess = this.options?.onSuccess;

    if (options?.isAutorun) {
      this.run(undefined as TOptions);
    }
  }

  public get value() {
    return this.#state.value;
  }

  public set = (
    value:
      | QueryData<Data, TError>
      | ((prevValue: QueryData<Data, TError>) => QueryData<Data, TError>),
  ) => this.#state.set(value);

  public subscribe = (callback: (value: QueryData<Data, TError>) => void) =>
    this.#state.subscribe(callback);

  public run = async (runOptions: TOptions) => {
    this.#lastOptions = runOptions;
    this.setLoading();

    try {
      const result = await this.asyncFn(runOptions);

      this.setSuccess(result);
      this.#onSuccess?.(result);
    } catch (err) {
      this.setError(err as TError);
      this.#onError?.(err as TError);
    }
  };

  public reset = () => {
    this.#state.set(createInitial<Data, TError>());
    this.#lastOptions = undefined;
  };

  public refetch = () => {
    return this.run(this.#lastOptions as TOptions);
  };

  private setLoading = () => {
    this.#state.set({
      ...this.#state.value,
      isLoading: true,
      isSuccess: false,
      isError: false,
      error: null,
    });
  };

  private setSuccess = (data: Data) => {
    this.#state.set({
      ...this.#state.value,
      isLoading: false,
      isSuccess: true,
      data,
    });
  };

  private setError = (error: TError) => {
    this.#state.set({
      ...this.#state.value,
      data: undefined,
      isLoading: false,
      isError: true,
      error,
    });
  };
}
