import { DependencyList, EffectCallback, useEffect } from 'react'

export default function useEventEffect(callback: EffectCallback, deps: DependencyList) {
  useEffect(() => {
    const clean = callback()
    return clean
  }, deps)
}
