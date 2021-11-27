import { getCacheData, isEmpty, stringify, isEqual } from "cache";
import { ClientResponseErrorType, ClientResponseSuccessType } from "client";

describe("Cache utils", () => {
  describe("Util function: getCacheData", () => {
    it("should not override cache on retry or refresh error response", async () => {
      const previousResponse = [{}, null, 200] as ClientResponseSuccessType<Record<string, string>>;
      const errorResponse = [null, {}, 400] as ClientResponseErrorType<Record<string, string>>;
      expect(getCacheData(previousResponse, errorResponse, {}, null)).toBe(previousResponse);
      expect(getCacheData(previousResponse, errorResponse, null, {})).toBe(previousResponse);
    });

    it("should use successful response over previous data", async () => {
      const previousResponse = [{}, null, 200] as ClientResponseSuccessType<Record<string, string>>;
      const newResponse = [{}, null, 200] as ClientResponseSuccessType<Record<string, string>>;
      expect(getCacheData(previousResponse, newResponse, null, null)).toBe(newResponse);
    });

    it("should use any response if there is no cached data", async () => {
      const newResponse = [{}, null, 200] as ClientResponseSuccessType<Record<string, string>>;
      const errorResponse = [null, {}, 400] as ClientResponseErrorType<Record<string, string>>;
      expect(getCacheData(undefined, newResponse, null, null)).toBe(newResponse);
      expect(getCacheData(undefined, errorResponse, null, null)).toBe(errorResponse);
      expect(getCacheData(undefined, errorResponse, {}, null)).toBe(errorResponse);
      expect(getCacheData(undefined, errorResponse, null, {})).toBe(errorResponse);
    });
  });

  describe("Util function: stringify", () => {
    it("should stringify valid values", async () => {
      const response = { something: 123 };
      const value = stringify(response);
      expect(value).toBe(JSON.stringify(response));
    });

    it("should not stringify invalid values", async () => {
      const value = stringify(() => null);
      expect(value).toBe("");
    });
  });

  describe("Util function: isEmpty", () => {
    it("should return true for empty array or object", async () => {
      expect(isEmpty([])).toBe(true);
      expect(isEmpty({})).toBe(true);
    });

    it("should return false", async () => {
      expect(isEmpty(null)).toBe(false);
      expect(isEmpty(new Date())).toBe(false);
      expect(isEmpty(NaN)).toBe(false);
      expect(isEmpty("")).toBe(false);
      expect(isEmpty(false)).toBe(false);
      expect(isEmpty(null)).toBe(false);
      expect(isEmpty(undefined)).toBe(false);
      expect(isEmpty(0)).toBe(false);
      expect(isEmpty(true)).toBe(false);
      expect(isEmpty(123)).toBe(false);
      expect(isEmpty("123")).toBe(false);
      expect(isEmpty([1, 2, 3])).toBe(false);
      expect(isEmpty({ something: 1 })).toBe(false);
    });
  });

  describe("Util function: isEqual", () => {
    it("should return false for non equal values", async () => {
      expect(isEqual(true, false)).toBe(false);
      expect(isEqual(null, {})).toBe(false);
      expect(isEqual(new Date(), {})).toBe(false);
      expect(isEqual(new Date(), null)).toBe(false);
      expect(isEqual(NaN, {})).toBe(false);
      expect(isEqual(NaN, null)).toBe(false);
      expect(isEqual("1", 1)).toBe(false);
      expect(isEqual(0, -1)).toBe(false);
      expect(isEqual("2", "3")).toBe(false);
      expect(isEqual([], [1])).toBe(false);
      expect(isEqual([1], [2])).toBe(false);
      expect(isEqual(["1"], [1])).toBe(false);
      expect(isEqual([null], [NaN])).toBe(false);
      expect(isEqual([null], [new Date()])).toBe(false);
      expect(isEqual([null], [{}])).toBe(false);
      expect(isEqual([new Date()], [{}])).toBe(false);
      expect(isEqual([NaN], [{}])).toBe(false);
      expect(isEqual([{ someKey: 1 }], [{ someKey: 2 }])).toBe(false);
      expect(isEqual([{ someKey: "1" }], [{ someKey: 1 }])).toBe(false);
      expect(isEqual([{ someKey: null }], [{ someKey: {} }])).toBe(false);
      expect(isEqual([{ someKey: null }], [{ someKey: NaN }])).toBe(false);
      expect(isEqual([{ someKey: null }], [{ someKey: new Date() }])).toBe(false);
      expect(isEqual([{ someKey: {} }], [{ someKey: new Date() }])).toBe(false);
      expect(isEqual([{ someKey: {} }], [{ someKey: NaN }])).toBe(false);
      expect(isEqual({ someKey: 1 }, { otherKey: 1 })).toBe(false);
      expect(isEqual({ someKey: 1 }, { someKey: 1, otherKey: 1 })).toBe(false);
      expect(isEqual({ someKey: 1 }, { someKey: 2 })).toBe(false);
      expect(isEqual({ someKey: "1" }, { someKey: 1 })).toBe(false);
      expect(isEqual({ someKey: null }, { someKey: {} })).toBe(false);
      expect(isEqual({ someKey: null }, { someKey: NaN })).toBe(false);
      expect(isEqual({ someKey: null }, { someKey: new Date() })).toBe(false);
      expect(isEqual({ someKey: {} }, { someKey: new Date() })).toBe(false);
      expect(isEqual({ someKey: {} }, { someKey: NaN })).toBe(false);
      expect(isEqual({ someKey: 1 }, { otherKey: 1 })).toBe(false);
      expect(isEqual({ someKey: 1 }, { someKey: 1, otherKey: 1 })).toBe(false);
    });

    it("should return true for equal arguments", async () => {
      expect(isEqual(true, true)).toBe(true);
      expect(isEqual(false, false)).toBe(true);
      expect(isEqual(undefined, undefined)).toBe(true);
      expect(isEqual(null, null)).toBe(true);
      expect(isEqual(Date, Date)).toBe(true);
      expect(isEqual(new Date(), new Date())).toBe(true);
      expect(isEqual(NaN, NaN)).toBe(true);
      expect(isEqual("1", "1")).toBe(true);
      expect(isEqual(0, 0)).toBe(true);
      expect(isEqual(1, 1)).toBe(true);
      expect(isEqual("2", "2")).toBe(true);
      expect(isEqual([], [])).toBe(true);
      expect(isEqual([1], [1])).toBe(true);
      expect(isEqual(["1"], ["1"])).toBe(true);
      expect(isEqual([NaN], [NaN])).toBe(true);
      expect(isEqual([Date], [Date])).toBe(true);
      expect(isEqual([null], [null])).toBe(true);
      expect(isEqual([{}], [{}])).toBe(true);
      expect(isEqual([{ someKey: 1 }], [{ someKey: 1 }])).toBe(true);
      expect(isEqual([{ someKey: "1" }], [{ someKey: "1" }])).toBe(true);
      expect(isEqual([{ someKey: null }], [{ someKey: null }])).toBe(true);
      expect(isEqual([{ someKey: NaN }], [{ someKey: NaN }])).toBe(true);
      expect(isEqual([{ someKey: Date }], [{ someKey: Date }])).toBe(true);
      expect(isEqual([{ someKey: {} }], [{ someKey: {} }])).toBe(true);
      expect(isEqual({ someKey: 1, otherKey: 1 }, { someKey: 1, otherKey: 1 })).toBe(true);
      expect(isEqual({ someKey: "1" }, { someKey: "1" })).toBe(true);
      expect(isEqual({ someKey: {} }, { someKey: {} })).toBe(true);
      expect(isEqual({ someKey: NaN }, { someKey: NaN })).toBe(true);
      expect(isEqual({ someKey: null }, { someKey: null })).toBe(true);
      expect(isEqual({ someKey: Date }, { someKey: Date })).toBe(true);
      expect(isEqual({}, {})).toBe(true);
    });
  });
});
