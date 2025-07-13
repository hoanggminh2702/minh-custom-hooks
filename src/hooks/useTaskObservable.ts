/* eslint-disable @typescript-eslint/no-explicit-any */
import { useCallback, useEffect, useRef, useState } from 'react'
import { defer, Observable, Subject, Subscription } from 'rxjs'
import { fromPromise } from 'rxjs/internal/observable/innerFrom'
import { EnumSubscriptionState, type ExtractGeneric, type UseTaskObservable } from './@types/useTaskObservable'

export const DEFAULT_DATA_VALUE = undefined
export const DEFAULT_ERROR_VALUE = undefined
export const DEFAULT_SOURCE$_VALUE = null
export const DEFAULT_SUBSCRIPTION_VALUE = null

export default function useTaskObservable<
  TFunc extends (...args: [...(any | [])]) => Promise<any> | Observable<any>,
  TPreHandlerResult extends ReturnType<Observable<ExtractGeneric<ReturnType<TFunc>>>['pipe']> = Observable<
    ExtractGeneric<ReturnType<TFunc>>
  >,
>({ task, observablePreHandler, onNext, onComplete, onError, onCancel }: UseTaskObservable<TFunc, TPreHandlerResult>) {
  const [currentSource$, setCurrentSource$] = useState<Subject<ExtractGeneric<TPreHandlerResult>> | null>(
    DEFAULT_SOURCE$_VALUE,
  )
  const currentSubscription = useRef<Subscription | null>(DEFAULT_SUBSCRIPTION_VALUE)
  const [data, setData] = useState<ExtractGeneric<TPreHandlerResult> | undefined>(DEFAULT_DATA_VALUE)
  const [err, setErr] = useState<any | undefined>(DEFAULT_ERROR_VALUE)

  const [taskState, setTaskState] = useState<EnumSubscriptionState>(EnumSubscriptionState.IDLE)
  const [subscriptionState, setSubscriptionState] = useState<EnumSubscriptionState>(EnumSubscriptionState.IDLE)

  const run = (...args: Parameters<TFunc>) => {
    currentSource$?.unsubscribe()
    currentSubscription.current?.unsubscribe()

    const sub$ = new Subject<ExtractGeneric<TPreHandlerResult>>()

    if (typeof task === 'function') {
      let source$ = defer(() => {
        const generateObservable$ = task(...args)

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
          onNext?.(v, ...args)
        },
        error: (err) => {
          setErr(err)
          setTaskState(EnumSubscriptionState.FAILED)
          setSubscriptionState(EnumSubscriptionState.FAILED)
          onError?.(err, ...args)
        },
        complete() {
          setTaskState(EnumSubscriptionState.SUCCESS)
          setSubscriptionState(EnumSubscriptionState.SUCCESS)
          onComplete?.(...args)
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

  const reset = useCallback(function () {
    setData(DEFAULT_DATA_VALUE)
    setErr(DEFAULT_ERROR_VALUE)
    setSubscriptionState(EnumSubscriptionState.IDLE)
    setTaskState(EnumSubscriptionState.IDLE)

    currentSource$?.unsubscribe()
    setCurrentSource$(DEFAULT_SOURCE$_VALUE)

    currentSubscription.current?.unsubscribe()
    currentSubscription.current = DEFAULT_SUBSCRIPTION_VALUE
  }, [])

  useEffect(() => {
    return () => {
      reset()
    }
  }, [])

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
    run,
    cancel,
    subscription: currentSubscription.current,
    createObservable,
  }
}
