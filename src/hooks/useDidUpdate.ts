import { DependencyList, EffectCallback, useEffect, useState } from 'react'

export default function useDidUpdate(fn: EffectCallback, deps: DependencyList) {
  const [mountedFlag, setMountedFlag] = useState<boolean>(false)

  useEffect(() => {
    if (!mountedFlag) return setMountedFlag(true)
    return fn()
  }, deps)
}
