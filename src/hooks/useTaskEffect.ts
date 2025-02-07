import { DependencyList, useCallback, useEffect, useRef, useState } from 'react'
import uuid from 'react-native-uuid'
import { EnumTaskState, UnwrapPromise } from './useTask'

export type UseTaskEffectProps<TTask extends () => Promise<any>, TError extends any = any> = {
  task: TTask
  deps: DependencyList | string | number
  enabled?: boolean
  loadingAtInit?: boolean
  startLoadingOnBeforeStart?: boolean
  onBeforeStart?: () => Promise<boolean>
  onSuccess?(data: UnwrapPromise<ReturnType<TTask>> | undefined): void
  onError?(error: TError | undefined): void
  onFinally?(): void
  preserve?: boolean
  preserveWhenError?: boolean
  debounceTime?: number
}

export default function useTask<TTask extends () => Promise<any>, TError extends any>({
  task,
  onBeforeStart,
  onSuccess,
  onError,
  onFinally,
  preserve = true,
  preserveWhenError = false,
  deps,
  enabled = true,
  loadingAtInit,
  startLoadingOnBeforeStart = true,
  debounceTime,
}: UseTaskEffectProps<TTask, TError>) {
  const [taskData, setTaskData] = useState<UnwrapPromise<ReturnType<TTask>>>()
  const [taskError, setTaskError] = useState<TError>()
  const [taskState, setTaskState] = useState<EnumTaskState>(loadingAtInit ? EnumTaskState.PENDING : EnumTaskState.IDLE)

  // For debounce time
  const timeoutId = useRef<ReturnType<typeof setTimeout>>()
  const rejectRef = useRef<(reason: any) => void>()

  // STORE NEWEST TASK ID TO MAKE SURE TASK DATA AND TASK STATE IS NEWEST
  const newestTask = useRef<string>()

  const runTask = () => {
    const taskAsync = async () => {
      const taskId = uuid.v4()
      newestTask.current = taskId

      setTaskState(EnumTaskState.PENDING)
      !preserve && setTaskData(undefined)

      let continueRunningTask = true

      if (onBeforeStart) {
        startLoadingOnBeforeStart && setTaskState(EnumTaskState.PENDING)
        try {
          continueRunningTask = await onBeforeStart()
          if (!continueRunningTask) setTaskState(EnumTaskState.IDLE)
        } catch (err) {
          continueRunningTask = false
          setTaskState(EnumTaskState.FAIL)
        }
      }

      if (continueRunningTask) {
        setTaskState(EnumTaskState.PENDING)
        try {
          if (newestTask.current === taskId) {
            const res = await task()
            onSuccess && onSuccess(res)
            setTaskData(res)
            setTaskState(EnumTaskState.SUCCESS)
          }
        } catch (err: any) {
          onError && onError(err)
          !preserveWhenError && setTaskData(undefined)
          setTaskState(EnumTaskState.FAIL)
          setTaskError(err)
        } finally {
          if (newestTask.current === taskId) {
            onFinally && onFinally()
          }
        }
      }
    }

    taskAsync()
  }

  const runTaskDebounce = () => {
    clearTimeout(timeoutId.current)
    setTaskState(EnumTaskState.PENDING)

    timeoutId.current = setTimeout(() => {
      runTask()
    }, debounceTime)
  }

  const runTaskAsync = async () => {
    const taskId = uuid.v4()
    newestTask.current = taskId

    !preserve && setTaskData(undefined)

    let continueRunningTask = true

    if (onBeforeStart) {
      startLoadingOnBeforeStart && setTaskState(EnumTaskState.PENDING)
      try {
        continueRunningTask = await onBeforeStart()
        if (!continueRunningTask) setTaskState(EnumTaskState.IDLE)
      } catch (err) {
        continueRunningTask = false
        setTaskState(EnumTaskState.FAIL)
      }
    }

    if (continueRunningTask) {
      setTaskState(EnumTaskState.PENDING)
      try {
        if (newestTask.current === taskId) {
          const res = await task()
          onSuccess && onSuccess(res)
          setTaskData(res)
          setTaskState(EnumTaskState.SUCCESS)
          return res as Awaited<UnwrapPromise<ReturnType<typeof task>>>
        }
        return undefined
      } catch (err: any) {
        onError && onError(err)
        !preserveWhenError && setTaskData(undefined)
        setTaskState(EnumTaskState.FAIL)
        setTaskError(err)

        throw err
      } finally {
        if (newestTask.current === taskId) {
          // If newest task !== taskId, new task has been created, and it will surely reach finally and off loading would be trigger
          // else if it is canceled, the task state and loading state is immediately set when cancel function is triggered
          onFinally && onFinally()
        }
      }
    } else {
      return undefined
    }
  }

  const runTaskDebounceAsync = async () => {
    rejectRef.current?.(false)
    clearTimeout(timeoutId.current)

    try {
      setTaskState(EnumTaskState.PENDING)
      await new Promise((resolve, reject) => {
        rejectRef.current = reject
        setTimeout(() => {
          resolve(true)
        }, debounceTime)
      })

      return runTaskAsync()
    } catch {
      return undefined
    }
  }

  const cancelTask = useCallback(() => {
    newestTask.current = undefined
    setTaskState(EnumTaskState.CANCELED)
    clearTimeout(timeoutId.current)
  }, [])

  useEffect(() => {
    if (enabled) {
      debounceTime && debounceTime > 0 ? runTaskDebounce() : runTask()
    }
  }, [...(Array.isArray(deps) ? deps : [deps]), enabled, debounceTime])

  return {
    data: taskData,
    error: taskError,
    state: taskState,
    isIdle: taskState === EnumTaskState.IDLE,
    isLoading: taskState === EnumTaskState.PENDING,
    isSuccess: taskState === EnumTaskState.SUCCESS,
    isError: taskState === EnumTaskState.FAIL,
    refetch: debounceTime && debounceTime > 0 ? runTaskDebounce : runTask,
    refetchAsync: debounceTime && debounceTime > 0 ? runTaskDebounceAsync : runTaskAsync,
    cancel: cancelTask,
  }
}
