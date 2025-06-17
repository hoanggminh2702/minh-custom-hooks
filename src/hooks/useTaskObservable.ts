/* eslint-disable @typescript-eslint/no-explicit-any */
import { useCallback, useEffect, useRef, useState } from 'react'
import { defer, Observable, Subscription } from 'rxjs'
import { fromPromise } from 'rxjs/internal/observable/innerFrom'
import { EnumSubscriptionState, type ExtractGeneric, type UseTaskObservable } from './@types/useTaskObservable'

export default function useTaskObservable<
  TFunc extends (...args: any[]) => Promise<any> | Observable<any>,
  TPreHandlerResult extends ReturnType<Observable<ExtractGeneric<ReturnType<TFunc>>>['pipe']>,
>({ task, observablePreHandler, onNext, onComplete, onError, onCancel }: UseTaskObservable<TFunc, TPreHandlerResult>) {
  const currentSubscription = useRef<Subscription | null>(null)
  const [data, setData] = useState<ExtractGeneric<TPreHandlerResult>>()
  const [err, setErr] = useState<any>()

  const [taskState, setTaskState] = useState<EnumSubscriptionState>(EnumSubscriptionState.IDLE)
  const [subscriptionState, setSubscriptionState] = useState<EnumSubscriptionState>(EnumSubscriptionState.IDLE)

  const run = (...args: Parameters<TFunc>) => {
    currentSubscription.current?.unsubscribe()
    setTaskState(EnumSubscriptionState.LOADING)
    setSubscriptionState(EnumSubscriptionState.LOADING)

    if (task instanceof Promise) {
      let toObservable = defer(() => {
        return fromPromise(task)
      })

      if (typeof observablePreHandler === 'function') {
        toObservable = observablePreHandler(toObservable)
      }

      currentSubscription.current = toObservable.subscribe({
        next: (v) => {
          setData(v)
          setSubscriptionState(EnumSubscriptionState.DATARECEIVED)
          onNext?.(v)
        },
        error: (err) => {
          setTaskState(EnumSubscriptionState.FAILED)
          setSubscriptionState(EnumSubscriptionState.FAILED)
          setErr(err)
          onError?.(err)
        },
        complete() {
          setTaskState(EnumSubscriptionState.SUCCESS)
          setSubscriptionState(EnumSubscriptionState.SUCCESS)
          onComplete?.()
        },
      })
    } else {
      let source$ = defer(() => {
        const generateObservable$ = task(...args)

        return generateObservable$ instanceof Promise ? fromPromise(generateObservable$) : generateObservable$
      })

      if (typeof observablePreHandler === 'function') {
        source$ = observablePreHandler(source$)
      }

      currentSubscription.current = source$.subscribe({
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
    }
  }

  const cancel = useCallback(() => {
    currentSubscription.current?.unsubscribe()
    setTaskState(EnumSubscriptionState.CANCELED)
    setSubscriptionState(EnumSubscriptionState.CANCELED)
    onCancel?.(data)
  }, [])

  useEffect(() => {
    return () => {
      currentSubscription.current?.unsubscribe()
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
    isSubscriptionIdle: taskState === EnumSubscriptionState.IDLE,
    isSubscriptionLoading: taskState === EnumSubscriptionState.LOADING,
    isSubscriptionDataReceived: taskState === EnumSubscriptionState.DATARECEIVED,
    isSubscriptionSuccess: taskState === EnumSubscriptionState.SUCCESS,
    isSubscriptionFailed: taskState === EnumSubscriptionState.FAILED,
    isSubscriptionCanceled: taskState === EnumSubscriptionState.CANCELED,

    // action
    run,
    cancel,
    subscription: currentSubscription.current,
  }
}
