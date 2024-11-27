import { EffectCallback, useLayoutEffect } from 'react'

export default function useLayoutMount(fn: EffectCallback) {
  useLayoutEffect(() => {
    return fn()
  }, [])
}
