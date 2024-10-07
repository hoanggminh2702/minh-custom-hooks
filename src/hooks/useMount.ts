import { EffectCallback, useEffect, useRef } from "react";

export default function useMount(fn: EffectCallback) {
  const firstRun = useRef<boolean>(true);
  useEffect(() => {
    if (firstRun.current) {
      firstRun.current = false;
      return fn();
    }
    return;
  }, []);
}
