import { DependencyList, EffectCallback, useEffect, useLayoutEffect, useRef } from 'react'

export default function useDidUpdate(fn: EffectCallback, deps: DependencyList) {
  const isMounted = useRef<boolean>(false)

  const count = useRef<number>(0)

  useLayoutEffect(() => {
    // If effect still run twice when the deps is empty array, this is strict mode, IsMounted will set to false
    if (process.env.NODE_ENV === 'development') {
      if (count.current > 0 && isMounted.current) {
        isMounted.current = false
      }
      count.current += 1
    }
  }, [])

  useEffect(() => {
    if (!isMounted.current) {
      isMounted.current = true
      return
    }

    // eslint-disable-next-line consistent-return
    return fn()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)
}
