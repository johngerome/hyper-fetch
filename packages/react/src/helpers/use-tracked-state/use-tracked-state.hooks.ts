import { useRef } from "react";
import { useDidUpdate, useForceUpdate } from "@better-hooks/lifecycle";
import {
  ExtractErrorType,
  CacheValueType,
  ExtractResponseType,
  RequestInstance,
  ExtractAdapterType,
} from "@hyper-fetch/core";

import { isEqual } from "utils";
import {
  UseTrackedStateActions,
  UseTrackedStateType,
  UseTrackedStateProps,
  UseTrackedStateReturn,
} from "./use-tracked-state.types";
import { getDetailsState, getInitialState, isStaleCacheData } from "./use-tracked-state.utils";

/**
 *
 * @param request
 * @param initialData
 * @param dispatcher
 * @param dependencies
 * @internal
 */
export const useTrackedState = <T extends RequestInstance>({
  request,
  dispatcher,
  initialData,
  deepCompare,
  dependencyTracking,
  defaultCacheEmitting = true,
}: UseTrackedStateProps<T>): UseTrackedStateReturn<T> => {
  const { client, cacheKey, queueKey, cacheTime, responseMapper } = request;
  const { cache, requestManager } = client;

  const forceUpdate = useForceUpdate();

  const state = useRef<UseTrackedStateType<T>>(getInitialState(initialData, dispatcher, request));
  const renderKeys = useRef<Array<keyof UseTrackedStateType<T>>>([]);

  // ******************
  // Utils
  // ******************

  const getStaleStatus = (): boolean => {
    const cacheData = cache.get(cacheKey);
    return !cacheData || isStaleCacheData(cacheTime, cacheData?.timestamp);
  };

  // ******************
  // Dependency Tracking
  // ******************

  const renderKeyTrigger = (keys: Array<keyof UseTrackedStateType>) => {
    const shouldRerender = renderKeys.current.some((renderKey) => keys.includes(renderKey));
    if (shouldRerender) forceUpdate();
  };

  const setRenderKey = (renderKey: keyof UseTrackedStateType) => {
    if (!renderKeys.current.includes(renderKey)) {
      renderKeys.current.push(renderKey);
    }
  };

  // ******************
  // Cache initialization
  // ******************

  useDidUpdate(
    () => {
      // Handle initial loading state
      state.current.loading = dispatcher.hasRunningRequests(queueKey);

      // Get cache state
      const newState = getInitialState(initialData, dispatcher, request);

      const hasInitialState = isEqual(initialData?.data, state.current.data);
      const hasState = !!(state.current.data || state.current.error) && !hasInitialState;
      const shouldLoadInitialCache = !hasState && !!state.current.data;
      const shouldRemovePreviousData = hasState && !state.current.data;

      if (newState.data || shouldLoadInitialCache || shouldRemovePreviousData) {
        // Don't update the state when we are fetching data for new cacheKey
        // So on paginated page we will have previous page access until the new one will be fetched
        // However: When we have some cached data, we can use it right away
        state.current = newState;
        if (state.current) {
          renderKeyTrigger(["data"]);
        }
      }
    },
    [cacheKey, queueKey],
    true,
  );

  // ******************
  // Turn off dependency tracking
  // ******************

  useDidUpdate(
    () => {
      const handleDependencyTracking = () => {
        if (!dependencyTracking) {
          Object.keys(state.current).forEach((key) => setRenderKey(key as Parameters<typeof setRenderKey>[0]));
        }
      };

      handleDependencyTracking();
    },
    [dependencyTracking],
    true,
  );

  // ******************
  // Cache data handler
  // ******************

  const handleCompare = (firstValue: unknown, secondValue: unknown) => {
    if (typeof deepCompare === "function") {
      return deepCompare(firstValue, secondValue);
    }
    if (deepCompare) {
      return isEqual(firstValue, secondValue);
    }
    return false;
  };

  const handleCacheData = (
    cacheData: CacheValueType<ExtractResponseType<T>, ExtractErrorType<T>, ExtractAdapterType<T>>,
  ) => {
    const newStateValues: UseTrackedStateType<T> = {
      data: cacheData.data,
      error: cacheData.error,
      status: cacheData.status,
      success: cacheData.success,
      extra: cacheData.extra,
      retries: cacheData.retries,
      timestamp: new Date(cacheData.timestamp),
      loading: state.current.loading,
    };

    const changedKeys = Object.keys(newStateValues).filter((key) => {
      const keyValue = key as keyof UseTrackedStateType<T>;
      const firstValue = state.current[keyValue];
      const secondValue = newStateValues[keyValue];

      return !handleCompare(firstValue, secondValue);
    }) as unknown as (keyof UseTrackedStateType<T>)[];

    state.current = {
      ...state.current,
      ...newStateValues,
    };

    renderKeyTrigger(changedKeys);
  };

  const setCacheData = (
    cacheData: CacheValueType<ExtractResponseType<T>, ExtractErrorType<T>, ExtractAdapterType<T>>,
  ): Promise<void> | void => {
    const data = responseMapper ? responseMapper(cacheData) : cacheData;

    if (data instanceof Promise) {
      return (async () => {
        const promiseData = await data;
        handleCacheData({ ...cacheData, ...promiseData });
      })();
    }
    return handleCacheData({ ...cacheData, ...data });
  };

  // ******************
  // Actions
  // ******************

  const actions: UseTrackedStateActions<T> = {
    setData: (data, emitToCache = defaultCacheEmitting) => {
      if (emitToCache) {
        const currentState = state.current;
        cache.set(request, { ...currentState, ...getDetailsState(state.current), success: true, data });
      } else {
        state.current.data = data;
        renderKeyTrigger(["data"]);
      }
    },
    setError: (error, emitToCache = defaultCacheEmitting) => {
      if (emitToCache) {
        const currentState = state.current;
        cache.set(request, { ...currentState, ...getDetailsState(state.current), success: false, error });
      } else {
        state.current.error = error;
        renderKeyTrigger(["error"]);
      }
    },
    setLoading: (loading, emitToHooks = true) => {
      if (emitToHooks) {
        requestManager.events.emitLoading(queueKey, "", {
          queueKey,
          requestId: "",
          loading,
          isRetry: false,
          isOffline: false,
        });
      } else {
        state.current.loading = loading;
        renderKeyTrigger(["loading"]);
      }
    },
    setStatus: (status, emitToCache = defaultCacheEmitting) => {
      if (emitToCache) {
        const currentState = state.current;
        cache.set(request, { ...currentState, ...getDetailsState(state.current), status });
      } else {
        state.current.status = status;
        renderKeyTrigger(["status"]);
      }
    },
    setSuccess: (success, emitToCache = defaultCacheEmitting) => {
      if (emitToCache) {
        const currentState = state.current;
        cache.set(request, { ...currentState, ...getDetailsState(state.current), success });
      } else {
        state.current.success = success;
        renderKeyTrigger(["success"]);
      }
    },
    setExtra: (extra, emitToCache = defaultCacheEmitting) => {
      if (emitToCache) {
        const currentState = state.current;
        cache.set(request, { ...currentState, ...getDetailsState(state.current), extra });
      } else {
        state.current.extra = extra;
        renderKeyTrigger(["extra"]);
      }
    },
    setRetries: (retries, emitToCache = defaultCacheEmitting) => {
      if (emitToCache) {
        const currentState = state.current;
        cache.set(request, { ...currentState, ...getDetailsState(state.current, { retries }) });
      } else {
        state.current.retries = retries;
        renderKeyTrigger(["retries"]);
      }
    },
    setTimestamp: (timestamp, emitToCache = defaultCacheEmitting) => {
      if (emitToCache) {
        const currentState = state.current;
        cache.set(request, { ...currentState, ...getDetailsState(state.current, { timestamp: +timestamp }) });
      } else {
        state.current.timestamp = timestamp;
        renderKeyTrigger(["timestamp"]);
      }
    },
  };

  return [state.current, actions, { setRenderKey, setCacheData, getStaleStatus }];
};
