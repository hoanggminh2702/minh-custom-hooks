import { DependencyList, useCallback, useEffect, useRef, useState } from 'react'
import uuid from 'react-native-uuid'
import { EnumTaskState, UnwrapPromise } from './useTask'

export type UseTaskEffectProps<TTask extends () => Promise<any>, TError extends any = any> = {
  task: TTask
  deps: DependencyList | string | number
  enabled?: boolean
  loadingAtInit?: boolean
  onSuccess?(data: UnwrapPromise<ReturnType<TTask>> | undefined): void
  onError?(error: TError | undefined): void
  onFinally?(): void
  preserve?: boolean
  preserveWhenError?: boolean
}

export default function useTask<TTask extends () => Promise<any>, TError extends any>({
  task,
  onSuccess,
  onError,
  onFinally,
  preserve = true,
  preserveWhenError = false,
  deps,
  enabled = true,
  loadingAtInit,
}: UseTaskEffectProps<TTask, TError>) {
  const [taskData, setTaskData] = useState<UnwrapPromise<ReturnType<TTask>>>()
  const [taskError, setTaskError] = useState<TError>()
  const [taskState, setTaskState] = useState<EnumTaskState>(loadingAtInit ? EnumTaskState.PENDING : EnumTaskState.IDLE)

  // STORE NEWEST TASK ID TO MAKE SURE TASK DATA AND TASK STATE IS NEWEST
  const newestTask = useRef<string>()

  const runTask = () => {
    const taskId = uuid.v4()
    newestTask.current = taskId

    setTaskState(EnumTaskState.PENDING)
    !preserve && setTaskData(undefined)

    task()
      .then((res) => {
        if (newestTask.current === taskId) {
          onSuccess && onSuccess(res)
          setTaskData(res)
          setTaskState(EnumTaskState.SUCCESS)
        }
      })
      .catch((err) => {
        if (newestTask.current === taskId) {
          onError && onError(err)
          !preserveWhenError && setTaskData(undefined)
          setTaskState(EnumTaskState.FAIL)
          setTaskError(err)
        }
      })
      .finally(() => {
        if (newestTask.current === taskId) {
          // If newest task !== taskId, new task has been created, and it will surely reach finally and off loading would be trigger
          // else if it is canceled, the task state and loading state is immediately set when cancel function is triggered

          onFinally && onFinally()
        }
      })
  }

  const runTaskAsync = async () => {
    const taskId = uuid.v4()
    newestTask.current = taskId

    setTaskState(EnumTaskState.PENDING)
    !preserve && setTaskData(undefined)
    try {
      const res = await task()
      if (newestTask.current === taskId) {
        onSuccess && onSuccess(res)
        setTaskData(res)
        setTaskState(EnumTaskState.SUCCESS)
      }
      return res as Awaited<UnwrapPromise<ReturnType<typeof task>>>
    } catch (err: any) {
      if (newestTask.current === taskId) {
        onError && onError(err)
        !preserveWhenError && setTaskData(undefined)
        setTaskState(EnumTaskState.FAIL)
        setTaskError(err)
      }

      throw err
    } finally {
      if (newestTask.current === taskId) {
        // If newest task !== taskId, new task has been created, and it will surely reach finally and off loading would be trigger
        // else if it is canceled, the task state and loading state is immediately set when cancel function is triggered

        onFinally && onFinally()
      }
    }
  }

  const cancelTask = useCallback(() => {
    newestTask.current = undefined

    setTaskState(EnumTaskState.CANCELED)
  }, [])

  useEffect(() => {
    if (enabled) {
      runTask()
    }
  }, [...(Array.isArray(deps) ? deps : [deps]), enabled])

  return {
    data: taskData,
    error: taskError,
    state: taskState,
    isIdle: taskState === EnumTaskState.IDLE,
    isLoading: taskState === EnumTaskState.PENDING,
    isSuccess: taskState === EnumTaskState.SUCCESS,
    isError: taskState === EnumTaskState.FAIL,
    refetch: runTask,
    refetchAsync: runTaskAsync,
    cancel: cancelTask,
  }
}
