/* eslint-disable @typescript-eslint/no-explicit-any */
import { useCallback, useEffect, useRef, useState, type DependencyList } from 'react'
import { defer, Observable, Subject, Subscription } from 'rxjs'
import { fromPromise } from 'rxjs/internal/observable/innerFrom'
import { EnumSubscriptionState, type ExtractGeneric, type UseTaskObservable } from './@types/useTaskObservable'

export type UseTaskEffectObservable<
  TFunc extends (...args: any[]) => Promise<any> | Observable<any>,
  TPreHandlerResult extends ReturnType<Observable<ExtractGeneric<ReturnType<TFunc>>>['pipe']>,
> = UseTaskObservable<TFunc, TPreHandlerResult> & {
  deps?: DependencyList
  enabled?: boolean
  loadingAtInit?: boolean
}

export default function useTaskEffectObservable<
  TFunc extends (...args: []) => Promise<any> | Observable<any>,
  TPreHandlerResult extends ReturnType<Observable<ExtractGeneric<ReturnType<TFunc>>>['pipe']> = Observable<
    ExtractGeneric<ReturnType<TFunc>>
  >,
>({
  task,
  observablePreHandler,
  onNext,
  onComplete,
  onError,
  onCancel,
  deps,
  enabled = true,
  loadingAtInit,
}: UseTaskEffectObservable<TFunc, TPreHandlerResult>) {
  const [currentSource$, setCurrentSource$] = useState<Subject<ExtractGeneric<TPreHandlerResult>> | null>(null)
  const currentSubscription = useRef<Subscription | null>(null)
  const [data, setData] = useState<ExtractGeneric<TPreHandlerResult>>()
  const [err, setErr] = useState<any>()

  const [taskState, setTaskState] = useState<EnumSubscriptionState>(
    enabled && loadingAtInit ? EnumSubscriptionState.LOADING : EnumSubscriptionState.IDLE,
  )
  const [subscriptionState, setSubscriptionState] = useState<EnumSubscriptionState>(
    enabled && loadingAtInit ? EnumSubscriptionState.LOADING : EnumSubscriptionState.IDLE,
  )

  const run = () => {
    currentSource$?.unsubscribe()
    currentSubscription.current?.unsubscribe()

    const sub$ = new Subject<ExtractGeneric<TPreHandlerResult>>()

    if (typeof task === 'function') {
      let source$ = defer(() => {
        const generateObservable$ = task()

        return generateObservable$ instanceof Promise ? fromPromise(generateObservable$) : generateObservable$
      })

      if (typeof observablePreHandler === 'function') {
        source$ = observablePreHandler(source$)
      }

      setTaskState(EnumSubscriptionState.LOADING)
      setSubscriptionState(EnumSubscriptionState.LOADING)

      currentSubscription.current = source$.subscribe(sub$)

      sub$.subscribe({
        next: (v) => {
          setData(v)
          setSubscriptionState(EnumSubscriptionState.DATARECEIVED)
          onNext?.(v)
        },
        error: (err) => {
          setErr(err)
          setTaskState(EnumSubscriptionState.FAILED)
          setSubscriptionState(EnumSubscriptionState.FAILED)
          onError?.(err)
        },
        complete() {
          setTaskState(EnumSubscriptionState.SUCCESS)
          setSubscriptionState(EnumSubscriptionState.SUCCESS)
          onComplete?.()
        },
      })

      setCurrentSource$(sub$)
    } else {
      throw new Error('Task must be a function observable or promise')
    }
  }

  const cancel = useCallback(() => {
    currentSubscription.current?.unsubscribe()
    currentSource$?.unsubscribe()

    setTaskState(EnumSubscriptionState.CANCELED)
    setSubscriptionState(EnumSubscriptionState.CANCELED)
    onCancel?.(data)
  }, [data, onCancel])

  const createObservable = useCallback(() => {
    return currentSource$?.asObservable()
  }, [currentSource$])

  const complete = useCallback(() => {
    currentSource$?.complete()
  }, [currentSource$])

  useEffect(() => {
    if (enabled) {
      run()
    }

    return () => {
      currentSubscription.current?.unsubscribe()
      currentSource$?.unsubscribe()
    }
  }, [...(deps ?? []), enabled])

  return {
    // data state
    data,
    err,

    // current state
    state: taskState,
    subscriptionState,

    // task state
    isIdle: taskState === EnumSubscriptionState.IDLE,
    isLoading: taskState === EnumSubscriptionState.LOADING,
    isSuccess: taskState === EnumSubscriptionState.SUCCESS,
    isFailed: taskState === EnumSubscriptionState.FAILED,
    isCanceled: taskState === EnumSubscriptionState.CANCELED,

    // subscription state
    isSubscriptionIdle: subscriptionState === EnumSubscriptionState.IDLE,
    isSubscriptionLoading: subscriptionState === EnumSubscriptionState.LOADING,
    isSubscriptionDataReceived: subscriptionState === EnumSubscriptionState.DATARECEIVED,
    isSubscriptionSuccess: subscriptionState === EnumSubscriptionState.SUCCESS,
    isSubscriptionFailed: subscriptionState === EnumSubscriptionState.FAILED,
    isSubscriptionCanceled: subscriptionState === EnumSubscriptionState.CANCELED,

    // action
    refetch: run,
    complete,
    cancel,
    subscription: currentSubscription.current,
    createObservable,
  }
}
