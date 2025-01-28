import { useCallback, useRef, useState } from 'react'
import uuid from 'react-native-uuid'
import useToggle from './useToggle'

export enum EnumTaskState {
  IDLE = 'IDLE',
  PENDING = 'PENDING',
  SUCCESS = 'SUCCESS',
  FAIL = 'FAIL',
  CANCELED = 'CANCELED',
}

type UnwrapPromise<T> = T extends Promise<infer U> ? U : T

type UseTaskProps<TTask extends () => Promise<any>, TError extends any = any> = {
  task: TTask

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
}

export default function useTask<TTask extends (...args: any[]) => Promise<any>, TError extends any>({
  task,
  onSuccess,
  onError,
  onFinally,
  preserve = true,
  preserveWhenError = false,
}: UseTaskProps<TTask, TError>) {
  const { state, on, off } = useToggle()

  const [taskData, setTaskData] = useState<UnwrapPromise<ReturnType<TTask>>>()
  const [taskError, setTaskError] = useState<TError>()
  const [taskState, setTaskState] = useState<EnumTaskState>(EnumTaskState.IDLE)

  // STORE NEWEST TASK ID TO MAKE SURE TASK DATA AND TASK STATE IS NEWEST
  const newestTask = useRef<string>()

  const runTask = (...args: Parameters<typeof task>) => {
    const taskId = uuid.v4()
    newestTask.current = taskId
    on()
    setTaskState(EnumTaskState.PENDING)
    !preserve && setTaskData(undefined)

    task(...args)
      .then((res) => {
        if (newestTask.current === taskId) {
          onSuccess &&
            onSuccess(res, {
              params: args,
            })
          setTaskData(res)
          setTaskState(EnumTaskState.SUCCESS)
        }
      })
      .catch((err) => {
        if (newestTask.current === taskId) {
          onError &&
            onError(err, {
              params: args,
            })
          !preserveWhenError && setTaskData(undefined)
          setTaskState(EnumTaskState.FAIL)
          setTaskError(err)
        }
      })
      .finally(() => {
        if (newestTask.current === taskId) {
          // If newest task !== taskId, new task has been created, and it will surely reach finally and off loading would be trigger
          // else if it is canceled, the task state and loading state is immediately set when cancel function is triggered
          off()
          onFinally && onFinally({ params: args })
        }
      })
  }

  const runTaskAsync = async (...args: Parameters<typeof task>) => {
    const taskId = uuid.v4()
    newestTask.current = taskId
    on()
    setTaskState(EnumTaskState.PENDING)
    !preserve && setTaskData(undefined)
    try {
      const res = await task(...args)
      if (newestTask.current === taskId) {
        onSuccess &&
          onSuccess(res, {
            params: args,
          })
        setTaskData(res)
        setTaskState(EnumTaskState.SUCCESS)
      }
      return res as Awaited<UnwrapPromise<ReturnType<typeof task>>>
    } catch (err: any) {
      if (newestTask.current === taskId) {
        onError &&
          onError(err, {
            params: args,
          })
        !preserveWhenError && setTaskData(undefined)
        setTaskState(EnumTaskState.FAIL)
        setTaskError(err)
      }

      throw err
    } finally {
      if (newestTask.current === taskId) {
        // If newest task !== taskId, new task has been created, and it will surely reach finally and off loading would be trigger
        // else if it is canceled, the task state and loading state is immediately set when cancel function is triggered
        off()
        onFinally && onFinally({ params: args })
      }
    }
  }

  const cancelTask = useCallback(() => {
    newestTask.current = undefined
    off()
    setTaskState(EnumTaskState.CANCELED)
  }, [])

  return {
    data: taskData,
    error: taskError,
    state: taskState,
    isLoading: state,
    run: runTask,
    runAsync: runTaskAsync,
    cancel: cancelTask,
  }
}
