import { DependencyList, Dispatch, useCallback, useMemo, useRef, useState } from 'react'
import useDidUpdate from './useDidUpdate'

export enum DebounceValueStatus {
  DONE = 'DONE',
  PENDING = 'PENDING',
}

const defaultDebounceTime = 500

export interface UseDebounceStateFunc {
  <S>(initialState: S | (() => S)): {
    debouncedState: S
    setState: Dispatch<React.SetStateAction<S>>
    actualState: S
    stop(): void
    status: DebounceValueStatus
  }

  <S = undefined>(): {
    debouncedState: S | undefined
    setState: Dispatch<React.SetStateAction<S | undefined>>
    actualState: S | undefined
    stop(): void
    status: DebounceValueStatus
  }
}

export const useDebounceState: UseDebounceStateFunc = function <S>(
  initialState?: S | (() => S),
  debounceTime = defaultDebounceTime,
) {
  const [state, setState] = useState(initialState)
  const [debouncedState, setDebouncedState] = useState(initialState)
  const timer = useRef<ReturnType<typeof setTimeout>>()

  const [status, setStatus] = useState<DebounceValueStatus>(DebounceValueStatus.DONE)

  const stop = useCallback(() => {
    timer.current && clearTimeout(timer.current)
    setStatus(DebounceValueStatus.DONE)
  }, [])

  useDidUpdate(() => {
    timer.current && clearTimeout(timer.current)
    setStatus(DebounceValueStatus.PENDING)
    timer.current = setTimeout(() => {
      setDebouncedState(state)
      setStatus(DebounceValueStatus.DONE)
    }, debounceTime)
  }, [state])

  return { debouncedState, setState, actualState: state, stop, status }
}

export interface UseDebounceFunc {
  <S>(initialState: S | (() => S)): {
    debouncedState: S
    stop(): void
    status: DebounceValueStatus
  }

  <S = undefined>(): {
    debouncedState: S | undefined
    stop(): void
    status: DebounceValueStatus
  }
}

export const useDebounce: UseDebounceFunc = function useDebounce<S = undefined>(
  state?: S,
  debounceTime = defaultDebounceTime,
) {
  const [debouncedState, setDebouncedState] = useState(state)
  const timer = useRef<ReturnType<typeof setTimeout>>()
  const [status, setStatus] = useState<DebounceValueStatus>(DebounceValueStatus.DONE)

  const stop = useCallback(() => {
    timer.current && clearTimeout(timer.current)
    setStatus(DebounceValueStatus.DONE)
  }, [])

  useDidUpdate(() => {
    timer.current && clearTimeout(timer.current)
    setStatus(DebounceValueStatus.PENDING)

    timer.current = setTimeout(() => {
      setDebouncedState(state)
      setStatus(DebounceValueStatus.DONE)
    }, debounceTime)
  }, [state])

  return {
    debouncedState,
    stop,
    status,
  }
}

// #region Implement UseDebounceFn
interface BaseUseDebounceConfigOptions {
  /** Millisecond  */
  debounceTime?: number
}

interface UseDebounceConfigOptionsForPromise<TSuccess> extends BaseUseDebounceConfigOptions {
  /** Promise successful handler */
  onSuccess?(data: TSuccess): void
  /** Promise reject handler */
  onError?(err: unknown): void
}

type TypeFromPromise<P> = P extends Promise<infer R> ? R : P

type UseDebounceConfigOptions<TReturn> =
  TReturn extends Promise<infer TResolve> ? UseDebounceConfigOptionsForPromise<TResolve> : BaseUseDebounceConfigOptions

export function useDebounceFn<TParams extends unknown[] = any[], TReturn = unknown>(
  /** Debounce function */
  fn: (...args: TParams) => TReturn,
  /**
   * Additional configuration options
   * onSuccess, onError can be config if the function return a promise
   */
  config?: UseDebounceConfigOptions<TReturn>,
  /** Function with use callback also available, just pass dependency here, run function automatically wrapped inside useCallback
   * with your all dependencies
   */
  deps?: DependencyList,
) {
  // const isDevelopment = useRef<boolean>(!process.env.NODE_ENV || process.env.NODE_ENV === 'development');
  const timer = useRef<ReturnType<typeof setTimeout>>()
  const [returnedData, setReturnedData] = useState<TypeFromPromise<TReturn>>()
  const [status, setStatus] = useState<DebounceValueStatus>(DebounceValueStatus.DONE)
  const [progressStatus, setProgressStatus] = useState<DebounceValueStatus>(DebounceValueStatus.DONE)

  const { debounceTime, ...others } = useMemo(() => {
    return {
      ...config,
      debounceTime: config?.debounceTime ?? defaultDebounceTime,
    }
  }, [config])

  const funcWithoutDeps = (...args: TParams) => {
    timer.current && clearTimeout(timer.current)
    setStatus(DebounceValueStatus.PENDING)
    setProgressStatus(DebounceValueStatus.PENDING)

    timer.current = setTimeout(() => {
      const funcReturn = fn(...args)
      setStatus(DebounceValueStatus.DONE)

      if (!(funcReturn instanceof Promise)) {
        setReturnedData(funcReturn as any)
        setProgressStatus(DebounceValueStatus.DONE)

        return
      }
      const promiseCallbacks = others as Omit<UseDebounceConfigOptions<Promise<any>>, 'debounceTime'>
      funcReturn
        .then((data) => {
          setReturnedData(data)
          promiseCallbacks?.onSuccess?.(data)
        })
        .catch((err) => {
          promiseCallbacks?.onError?.(err)
        })
        .finally(() => {
          setProgressStatus(DebounceValueStatus.DONE)
        })
    }, debounceTime)
  }

  const funWithDeps = useCallback((...args: TParams) => {
    timer.current && clearTimeout(timer.current)
    setStatus(DebounceValueStatus.PENDING)
    setProgressStatus(DebounceValueStatus.PENDING)

    timer.current = setTimeout(() => {
      const funcReturn = fn(...args)
      setStatus(DebounceValueStatus.DONE)

      if (!(funcReturn instanceof Promise)) {
        setReturnedData(funcReturn as any)
        setProgressStatus(DebounceValueStatus.DONE)

        return
      }
      const promiseCallbacks = others as Omit<UseDebounceConfigOptions<Promise<any>>, 'debounceTime'>
      funcReturn
        .then((data) => {
          setReturnedData(data)
          promiseCallbacks?.onSuccess?.(data)
        })
        .catch((err) => {
          promiseCallbacks?.onError?.(err)
        })
        .finally(() => {
          setProgressStatus(DebounceValueStatus.DONE)
        })
    }, debounceTime)
  }, deps || [])

  const stop = useCallback(() => {
    timer.current && clearTimeout(timer.current)
    setStatus(DebounceValueStatus.DONE)
  }, [])

  return {
    /** Return data of whole progress */
    returnedData,
    /** Control only pending time */
    status,
    /** Control whole state include debounce pending time + promise pending time */
    progressStatus,
    /** Run debounce function */
    run: deps ? funWithDeps : funcWithoutDeps,
    /** stop debounce progress */
    stop,
  }
}

// #endregion
