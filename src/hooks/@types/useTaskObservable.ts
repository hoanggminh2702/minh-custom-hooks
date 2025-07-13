/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Observable } from 'rxjs'

export type ExtractGeneric<T extends Observable<any> | Promise<any>> = T extends Observable<infer R> | Promise<infer R>
  ? R
  : never

export type UseTaskObservable<
  TFunc extends (...args: [...any]) => Promise<any> | Observable<any>,
  TPreHandlerResult extends ReturnType<Observable<ExtractGeneric<ReturnType<TFunc>>>['pipe']> = Observable<
    ExtractGeneric<ReturnType<TFunc>>
  >,
> = {
  task: TFunc
  resetDataWhenError?: boolean
  observablePreHandler?: (source$: Observable<ExtractGeneric<ReturnType<TFunc>>>) => TPreHandlerResult
  onNext?: (value: ExtractGeneric<TPreHandlerResult>, ...args: Parameters<TFunc>) => void
  onError?: (err: any, ...args: Parameters<TFunc>) => void
  onComplete?: (...args: Parameters<TFunc>) => void
  onCancel?(value?: ExtractGeneric<TPreHandlerResult>): void
}

export const enum EnumSubscriptionState {
  IDLE = 'IDLE',
  LOADING = 'LOADING',
  DATARECEIVED = 'DATARECEIVED',
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
  CANCELED = 'CANCELED',
}

// For test
export type UseTaskObservableFunc = {
  <
    TFunc extends (...args: any[]) => Promise<any> | Observable<any>,
    TPreHandlerResult extends ReturnType<Observable<ExtractGeneric<ReturnType<TFunc>>>['pipe']>,
  >(props: {
    task: TFunc
    observablePreHandler: (source$: Observable<ExtractGeneric<ReturnType<TFunc>>>) => TPreHandlerResult
    onNext?: (value: ExtractGeneric<TPreHandlerResult>, ...args: Parameters<TFunc>) => void
    onError?: (err: any, ...args: Parameters<TFunc>) => void
    onComplete?: (...args: Parameters<TFunc>) => void
    onCancel?: () => void
  }): {
    data?: ExtractGeneric<TPreHandlerResult>
    err?: any

    state: EnumSubscriptionState
    subscriptionState: EnumSubscriptionState

    isIdle: boolean
    isLoading: boolean
    isDataReceived: boolean
    isSuccess: boolean
    isFailed: boolean
    isCanceled: boolean

    isSubscriptionIdle: boolean
    isSubscriptionLoading: boolean
    isSubscriptionDataReceived: boolean
    isSubscriptionSuccess: boolean
    isSubscriptionFailed: boolean
    isSubscriptionCanceled: boolean

    run: (...args: Parameters<TFunc>) => void
    cancel: () => void
    createObservable: () => Observable<ExtractGeneric<TPreHandlerResult>>
  }

  <TFunc extends (...args: [...any] | []) => Promise<any> | Observable<any>>(props: {
    task: TFunc
    onNext?: (value: ExtractGeneric<ReturnType<TFunc>>, ...args: Parameters<TFunc>) => void
    onError?: (err: any, ...args: Parameters<TFunc>) => void
    onComplete?: (...args: Parameters<TFunc>) => void
    onCancel?: () => void
  }): {
    data?: ExtractGeneric<ReturnType<TFunc>>
    err?: any

    state: EnumSubscriptionState
    subscriptionState: EnumSubscriptionState

    isIdle: boolean
    isLoading: boolean
    isDataReceived: boolean
    isSuccess: boolean
    isFailed: boolean
    isCanceled: boolean

    isSubscriptionIdle: boolean
    isSubscriptionLoading: boolean
    isSubscriptionDataReceived: boolean
    isSubscriptionSuccess: boolean
    isSubscriptionFailed: boolean
    isSubscriptionCanceled: boolean

    run: (...args: Parameters<TFunc>) => void
    cancel: () => void
  }
}
