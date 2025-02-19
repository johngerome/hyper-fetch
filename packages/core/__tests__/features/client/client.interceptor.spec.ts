import { createRequestInterceptor, resetInterceptors, startServer, stopServer } from "../../server";
import { interceptorCallback } from "../../utils";
import { testCallbacksExecution } from "../../shared";
import { Client } from "client";
import { xhrExtra } from "adapter";

describe("Client [ Interceptor ]", () => {
  let client = new Client({ url: "shared-base-url/" });
  let request = client.createRequest()({ endpoint: "shared-base-endpoint" });

  const spy1 = jest.fn();
  const spy2 = jest.fn();
  const spy3 = jest.fn();

  beforeAll(() => {
    startServer();
  });

  beforeEach(() => {
    client = new Client({ url: "shared-base-url/" });
    request = client.createRequest()({ endpoint: "shared-base-endpoint" });
    resetInterceptors();
    jest.clearAllMocks();
  });

  afterAll(() => {
    stopServer();
  });

  describe("When interceptor callbacks being added", () => {
    it("should assign onError interceptors", async () => {
      const callback = interceptorCallback();
      client.onError(callback).onError(callback);

      expect(client.__onErrorCallbacks).toHaveLength(2);
      expect(client.__onErrorCallbacks[0]).toEqual(callback);
      expect(client.__onErrorCallbacks[1]).toEqual(callback);
    });
    it("should assign onSuccess interceptors", async () => {
      const callback = interceptorCallback();
      client.onSuccess(callback).onSuccess(callback);

      expect(client.__onSuccessCallbacks).toHaveLength(2);
      expect(client.__onSuccessCallbacks[0]).toEqual(callback);
      expect(client.__onSuccessCallbacks[1]).toEqual(callback);
    });
    it("should assign onResponse interceptors", async () => {
      const callback = interceptorCallback();
      client.onResponse(callback).onResponse(callback);

      expect(client.__onResponseCallbacks).toHaveLength(2);
      expect(client.__onResponseCallbacks[0]).toEqual(callback);
      expect(client.__onResponseCallbacks[1]).toEqual(callback);
    });
  });

  describe("When interceptor callbacks go into the execution loop", () => {
    it("should trigger __modifyErrorResponse async loop", async () => {
      const callbackAsync = interceptorCallback({ callback: spy1, sleepTime: 20 });
      const callbackSync = interceptorCallback({ callback: spy2 });
      const callbackLast = interceptorCallback({ callback: spy3, sleepTime: 10 });

      client.onError(callbackAsync).onError(callbackSync).onError(callbackLast);
      await client.__modifyErrorResponse(
        { data: null, error: null, status: 400, success: false, extra: xhrExtra },
        request,
      );

      testCallbacksExecution([spy1, spy2, spy3]);
    });
    it("should trigger __modifySuccessResponse async loop", async () => {
      const callbackAsync = interceptorCallback({ callback: spy1, sleepTime: 20 });
      const callbackSync = interceptorCallback({ callback: spy2 });
      const callbackLast = interceptorCallback({ callback: spy3, sleepTime: 10 });

      client.onSuccess(callbackAsync).onSuccess(callbackSync).onSuccess(callbackLast);
      await client.__modifySuccessResponse(
        { data: null, error: null, status: 400, success: false, extra: xhrExtra },
        request,
      );

      testCallbacksExecution([spy1, spy2, spy3]);
    });
    it("should trigger __modifyResponse async loop", async () => {
      const callbackAsync = interceptorCallback({ callback: spy1, sleepTime: 20 });
      const callbackSync = interceptorCallback({ callback: spy2 });
      const callbackLast = interceptorCallback({ callback: spy3, sleepTime: 10 });

      client.onResponse(callbackAsync).onResponse(callbackSync).onResponse(callbackLast);
      await client.__modifyResponse({ data: null, error: null, status: 400, success: false, extra: xhrExtra }, request);

      testCallbacksExecution([spy1, spy2, spy3]);
    });
  });

  describe("When interceptor returns undefined value", () => {
    it("should throw onError method when request is not returned", async () => {
      client.onError(() => undefined as any);

      await expect(
        client.__modifyErrorResponse(
          { data: null, error: null, status: 400, success: false, extra: xhrExtra },
          request,
        ),
      ).rejects.toThrow();
    });
    it("should throw onSuccess method when request is not returned", async () => {
      client.onSuccess(() => undefined as any);

      await expect(
        client.__modifySuccessResponse(
          { data: null, error: null, status: 400, success: false, extra: xhrExtra },
          request,
        ),
      ).rejects.toThrow();
    });
    it("should throw onResponse method when request is not returned", async () => {
      client.onResponse(() => undefined as any);

      await expect(
        client.__modifyResponse({ data: null, error: null, status: 400, success: false, extra: xhrExtra }, request),
      ).rejects.toThrow();
    });
  });
  describe("When user wants to remove listeners", () => {
    it("should allow for removing interceptors on error", async () => {
      const firstCallback = interceptorCallback({ callback: spy1 });
      const secondCallback = interceptorCallback({ callback: spy2 });
      client.onError(firstCallback).onError(secondCallback);

      await request.send();
      client.removeOnErrorInterceptors([secondCallback]);

      await request.send();

      expect(spy1).toBeCalledTimes(2);
      expect(spy2).toBeCalledTimes(1);
    });
    it("should allow for removing interceptors on success", async () => {
      createRequestInterceptor(request, { fixture: { data: [1, 2, 3] } });
      const firstCallback = interceptorCallback({ callback: spy1 });
      const secondCallback = interceptorCallback({ callback: spy2 });
      client.onSuccess(firstCallback).onSuccess(secondCallback);

      await request.send();
      client.removeOnSuccessInterceptors([secondCallback]);

      await request.send();

      expect(spy1).toBeCalledTimes(2);
      expect(spy2).toBeCalledTimes(1);
    });
    it("should allow for removing interceptors on response", async () => {
      const firstCallback = interceptorCallback({ callback: spy1 });
      const secondCallback = interceptorCallback({ callback: spy2 });
      client.onResponse(firstCallback).onResponse(secondCallback);

      await request.send();
      client.removeOnResponseInterceptors([secondCallback]);

      await request.send();

      expect(spy1).toBeCalledTimes(2);
      expect(spy2).toBeCalledTimes(1);
    });
  });
});
