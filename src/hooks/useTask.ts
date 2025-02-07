import { useCallback, useRef, useState } from 'react'
import uuid from 'react-native-uuid'

export enum EnumTaskState {
  IDLE = 'IDLE',
  PENDING = 'PENDING',
  SUCCESS = 'SUCCESS',
  FAIL = 'FAIL',
  CANCELED = 'CANCELED',
}

export type UnwrapPromise<T> = T extends Promise<infer U> ? U : T

export type TTaskType = (...args: any[]) => Promise<any>

export type UseTaskProps<TTask extends TTaskType, TError extends any = any> = {
  task: TTask
  startLoadingOnBeforeStart?: boolean
  onBeforeStart?: () => Promise<boolean>
  onSuccess?(
    data: UnwrapPromise<ReturnType<TTask>> | undefined,
    others: {
      params: [...Parameters<TTask>]
    },
  ): void
  onError?(
    error: TError | undefined,
    others: {
      params: [...Parameters<TTask>]
    },
  ): void
  onFinally?(others?: { params: [...Parameters<TTask>] }): void
  preserve?: boolean
  preserveWhenError?: boolean
  loadingAtInit?: boolean
  debounceTime?: number
}

export default function useTask<TTask extends (...args: any[]) => Promise<any>, TError extends any>({
  task,
  startLoadingOnBeforeStart = true,
  onBeforeStart,
  onSuccess,
  onError,
  onFinally,
  preserve = true,
  preserveWhenError = false,
  loadingAtInit,
  debounceTime,
}: UseTaskProps<TTask, TError>) {
  const [taskData, setTaskData] = useState<UnwrapPromise<ReturnType<TTask>>>()
  const [taskError, setTaskError] = useState<TError>()
  const [taskState, setTaskState] = useState<EnumTaskState>(loadingAtInit ? EnumTaskState.PENDING : EnumTaskState.IDLE)

  const timeoutId = useRef<ReturnType<typeof setTimeout>>()
  const rejectRef = useRef<(reason: any) => void>()

  // STORE NEWEST TASK ID TO MAKE SURE TASK DATA AND TASK STATE IS NEWEST
  const newestTask = useRef<string>()

  const runTask = (...args: Parameters<typeof task>) => {
    const taskAsync = async (...args: Parameters<typeof task>) => {
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
            const result = await task(...args)
            onSuccess &&
              onSuccess(result, {
                params: args,
              })
            setTaskData(result)
            setTaskState(EnumTaskState.SUCCESS)
          }
        } catch (err: any) {
          onError &&
            onError(err, {
              params: args,
            })
          !preserveWhenError && setTaskData(undefined)
          setTaskState(EnumTaskState.FAIL)
          setTaskError(err)
        } finally {
          if (newestTask.current === taskId) {
            // If newest task !== taskId, new task has been created, and it will surely reach finally and off loading would be trigger
            // else if it is canceled, the task state and loading state is immediately set when cancel function is triggered
            onFinally && onFinally({ params: args })
          }
        }
      }
    }

    taskAsync(...args)
  }

  const runTaskDebounce = (...args: Parameters<typeof task>) => {
    clearTimeout(timeoutId.current)
    setTaskState(EnumTaskState.PENDING)

    timeoutId.current = setTimeout(() => {
      runTask(...args)
    }, debounceTime)
  }

  const runTaskAsync = async (...args: Parameters<typeof task>) => {
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
          const res = await task(...args)
          onSuccess &&
            onSuccess(res, {
              params: args,
            })
          setTaskData(res)
          setTaskState(EnumTaskState.SUCCESS)
          return res as Awaited<UnwrapPromise<ReturnType<typeof task>>>
        }
        return undefined
      } catch (err: any) {
        onError &&
          onError(err, {
            params: args,
          })
        !preserveWhenError && setTaskData(undefined)
        setTaskState(EnumTaskState.FAIL)
        setTaskError(err)

        throw err
      } finally {
        if (newestTask.current === taskId) {
          // If newest task !== taskId, new task has been created, and it will surely reach finally and off loading would be trigger
          // else if it is canceled, the task state and loading state is immediately set when cancel function is triggered
          onFinally && onFinally({ params: args })
        }
      }
    } else {
      return undefined
    }
  }

  const runTaskDebounceAsync = async (...args: Parameters<typeof task>) => {
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

      return runTaskAsync(...args)
    } catch {
      return undefined
    }
  }

  const cancelTask = useCallback(() => {
    newestTask.current = undefined
    setTaskState(EnumTaskState.CANCELED)
    clearTimeout(timeoutId.current)
    rejectRef.current?.(false)
  }, [])

  return {
    data: taskData,
    error: taskError,
    state: taskState,
    isIdle: taskState === EnumTaskState.IDLE,
    isLoading: taskState === EnumTaskState.PENDING,
    isSuccess: taskState === EnumTaskState.SUCCESS,
    isError: taskState === EnumTaskState.FAIL,
    // run: runTask,
    // runAsync: runTaskAsync,
    run: debounceTime && debounceTime > 0 ? runTaskDebounce : runTask,
    runAsync: debounceTime && debounceTime > 0 ? runTaskDebounceAsync : runTaskAsync,
    cancel: cancelTask,
  }
}
