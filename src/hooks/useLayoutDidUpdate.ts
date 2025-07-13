import { DependencyList, EffectCallback, useLayoutEffect, useRef } from 'react'

export default function useLayoutDidUpdate(fn: EffectCallback, deps: DependencyList) {
  const mountedRef = useRef(false)

  useLayoutEffect(() => {
    if (!mountedRef.current) {
      mountedRef.current = true
      return
    }
    return fn()
  }, deps)
}
