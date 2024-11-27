import { DependencyList, EffectCallback, useLayoutEffect, useState } from 'react'

export default function useLayoutDidUpdate(fn: EffectCallback, deps: DependencyList) {
  const [mountedFlag, setMountedFlag] = useState<boolean>(false)

  useLayoutEffect(() => {
    if (!mountedFlag) return setMountedFlag(true)
    return fn()
  }, deps)
}
