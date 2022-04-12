import EventEmitter from "events";

import { CommandResponseDetails, LoggerMethodsType } from "managers";
import { FetchBuilder } from "builder";
import { CacheOptionsType, CacheStorageType, getCacheData, getCacheEvents } from "cache";
import { ClientResponseType } from "client";
import { CacheStoreKeyType, CacheValueType, CacheStoreValueType } from "./cache.types";

/**
 * Cache class handles the data exchange with the queues.
 *
 * @note
 * Keys used to save the values are created dynamically on the FetchCommand class
 *
 * @remark
 * <center>
 * ```mermaid
 * graph TD
 *   C{Cache Storage}
 *   C -->|"GET_/users?page=1"| D[Data#1]
 *   C -->|"GET_/users/1"| E[Data#2]
 *   C -->|"GET_/users"| F[Data#3]
 *   C -->|unique key| G[Data...]
 * ```
 * </center>
 *
 * <center>
 *
 * ### Response event flow
 *
 * </center>
 * <center>
 * ```mermaid
 * graph TD
 *     A(Cache Events)
 *     C{Cache Storage}
 *     B[Cache Listeners]
 *     C -->|unique key| D[Data#1]
 *     C -->|unique key| E[Data#2]
 *     A -->|Mutation| E
 *     E -->|Response| B
 * ```
 * </center>
 *
 */
export class Cache<ErrorType, HttpOptions> {
  emitter = new EventEmitter();
  events: ReturnType<typeof getCacheEvents>;
  storage: CacheStorageType;

  private logger: LoggerMethodsType;

  constructor(
    private builder: FetchBuilder<ErrorType, HttpOptions>,
    private options?: CacheOptionsType<ErrorType, HttpOptions>,
  ) {
    this.logger = this.builder.loggerManager.init("Cache");
    this.storage = this?.options?.storage || new Map<CacheStoreKeyType, CacheStoreValueType>();
    this.events = getCacheEvents(this.emitter, this.storage);

    this.options?.onInitialization?.(this);

    if (this.options?.initialData) {
      Object.keys(this.options.initialData).forEach(async (key) => {
        const value = await this.storage.get(key);
        if (!value && this.options?.initialData?.[key]) {
          await this.storage.set(key, this.options?.initialData[key]);
        }
      });
    }
  }

  set = async <Response>(
    cacheKey: string,
    response: ClientResponseType<Response, ErrorType>,
    details: CommandResponseDetails,
    useCache: boolean,
  ): Promise<void> => {
    const cachedData = await this.storage.get(cacheKey);

    // Once refresh error occurs we don't want to override already valid data in our cache with the thrown error
    // We need to check it against cache and return last valid data we have
    const data = getCacheData(cachedData?.data, response);

    const newCacheData: CacheValueType = { data, details };

    // If request should not use cache - just emit response data
    if (!useCache) {
      this.logger.debug(`Only emitting payload as command cache is off`, data);

      return this.events.set<Response>(cacheKey, newCacheData);
    }

    // Cache response emitter to provide optimization for libs(re-rendering)
    this.logger.debug(`Setting new data to cache, emitting setter event...`, data);
    this.events.set<Response>(cacheKey, newCacheData);

    // Only success data is valid for the cache store
    if (!details.isFailed) {
      await this.storage.set(cacheKey, newCacheData);
    }
  };

  get = async <Response>(cacheKey: string): Promise<CacheValueType<Response> | undefined> => {
    const cachedData = this.storage.get<Response>(cacheKey);
    return cachedData;
  };

  delete = (cacheKey: string): void => {
    this.logger.debug(`Removing data from cache, emitting revalidation event...`);
    this.events.revalidate(cacheKey);
    this.storage.delete(cacheKey);
  };

  clear = (): void => {
    this.storage.clear();
  };
}
