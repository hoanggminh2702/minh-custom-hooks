/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Observable } from 'rxjs'

export type ExtractGeneric<T extends Observable<any> | Promise<any>> = T extends Observable<infer R> | Promise<infer R>
  ? R
  : never

export type UseTaskObservable<
  TFunc extends (...args: any[]) => Promise<any> | Observable<any>,
  TPreHandlerResult extends ReturnType<Observable<ExtractGeneric<ReturnType<TFunc>>>['pipe']>,
> = {
  task: TFunc
  resetDataWhenError?: boolean
  observablePreHandler?: (source$: Observable<ExtractGeneric<ReturnType<TFunc>>>) => TPreHandlerResult
  onNext?(value: ExtractGeneric<TPreHandlerResult>): void
  onError?(err: any): void
  onComplete?(): void
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
