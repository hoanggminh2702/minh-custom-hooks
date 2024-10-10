import { DependencyList, useMemo } from 'react'

export default function useEventMemo<T>(factory: () => T, deps: DependencyList) {
  return useMemo(() => factory(), deps)
}
