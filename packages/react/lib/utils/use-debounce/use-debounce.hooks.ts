import { useRef } from "react";
import { useWillUnmount, useDidUpdate } from "@better-typed/react-lifecycle-hooks";

type Debounce = {
  time: number;
  timer: ReturnType<typeof setTimeout> | null;
};

type DebounceFunction = (callback: () => void | Promise<void>) => void;

type UseDebounceReturnType = {
  debounce: DebounceFunction;
  resetDebounce: VoidFunction;
  active: boolean;
};

export const useDebounce = (delay = 600): UseDebounceReturnType => {
  const debounce = useRef<Debounce>({
    time: delay,
    timer: null,
  });

  useDidUpdate(() => {
    debounce.current.time = delay;
  }, [delay]);

  const resetDebounce = () => {
    if (debounce.current.timer !== null) clearTimeout(debounce.current.timer);
    debounce.current.timer = null;
  };

  const setDebounce: DebounceFunction = (callback) => {
    resetDebounce();
    debounce.current.timer = setTimeout(() => {
      callback();
    }, debounce.current.time);
  };

  useWillUnmount(resetDebounce);

  return { debounce: setDebounce, resetDebounce, active: !!debounce.current.timer };
};
