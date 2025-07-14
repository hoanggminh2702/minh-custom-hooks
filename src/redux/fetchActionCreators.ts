/* eslint-disable @typescript-eslint/no-unnecessary-type-constraint */

import { EnumTaskState } from '../hooks/useTask'
import actionCreators from './actionCreators'

export type GlobalFetchValueType<TValue = any, TRunTask extends (...args: any[]) => void = () => void> = {
  data?: TValue
  isLoading: boolean
  error?: string
  refetch: TRunTask
  reset: (...args: any) => void
  cancel: (...args: any) => void
  isSuccess: boolean
  isError: boolean
  isIdle: boolean
  status: EnumTaskState
}

export function createInitGlobalFetchValue<TValue = any, TRunTask extends (...args: any[]) => void = () => void>(
  data?: TValue,
  initRunTask = (() => {}) as TRunTask,
  cancel = () => {},
  reset = () => {},
) {
  return {
    data,
    isLoading: false,
    error: undefined,
    refetch: initRunTask,
    reset,
    cancel,
    isSuccess: false,
    isError: false,
    isIdle: true,
    status: 'idle',
  }
}

export default function fetchActionsCreators<
  TPrefix extends string,
  TValue extends any,
  TActions extends Record<
    string,
    (...args: [state: GlobalFetchValueType<TValue>, ...any[]]) => GlobalFetchValueType<TValue>
  >,
  TRunTask extends (...args: any[]) => void = () => void,
>(key: TPrefix, initData: GlobalFetchValueType<TValue, TRunTask>, actions?: TActions) {
  return actionCreators(key, initData, {
    initFetching(state, initRunTask: TRunTask, cancel: () => void, reset: () => void) {
      return { ...state, refetch: initRunTask, cancel, reset }
    },

    startFetching(state) {
      return {
        ...state,
        isLoading: true,
        isSuccess: false,
        isError: false,
        status: EnumTaskState.PENDING,
      }
    },
    successFetching(state, data: TValue) {
      return {
        ...state,
        data,
        isLoading: false,
        isSuccess: true,
        isError: false,
        status: EnumTaskState.SUCCESS,
      }
    },
    errorFetching(state, error: string) {
      return {
        ...state,
        error,
        isLoading: false,
        isSuccess: false,
        isError: true,
        status: EnumTaskState.FAIL,
      }
    },
    cancelFetching(state) {
      return {
        ...state,
        isLoading: false,
        isSuccess: false,
        isIdle: true,
        status: EnumTaskState.IDLE,
      }
    },
    resetData() {
      return initData
    },
    ...actions,
  })
}
