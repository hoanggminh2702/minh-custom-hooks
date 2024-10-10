import { DependencyList, EffectCallback } from 'react'
import useDidUpdate from './useDidUpdate'

export default function useEventDidUpdate(callback: EffectCallback, deps: DependencyList) {
  useDidUpdate(() => {
    const clean = callback()
    return clean
  }, deps)
}
