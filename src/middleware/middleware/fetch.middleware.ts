import { HttpMethodsEnum } from "constants/http.constants";
import { HttpMethodsType, NegativeTypes } from "types";
import { ClientResponseType } from "client";
import { FetchBuilderConfig } from "../builder/fetch.builder.types";
import {
  ClientProgressCallback,
  DefaultOptionsType,
  ExtractRouteParams,
  FetchMethodType,
  FetchMiddlewareOptions,
  FetchType,
  ParamsType,
  ClientErrorCallback,
  ClientFinishedCallback,
  ClientSuccessCallback,
  ClientStartCallback,
  ClientResponseStartCallback,
} from "./fetch.middleware.types";

export class FetchMiddleware<
  ResponseType,
  PayloadType,
  ErrorType,
  EndpointType extends string,
  ClientOptions,
  HasData extends true | false = false,
  HasParams extends true | false = false,
  HasQuery extends true | false = false,
> {
  mockCallback: ((data: PayloadType) => ClientResponseType<ResponseType, ErrorType>) | undefined;
  endpoint: EndpointType;
  headers?: HeadersInit;
  method: HttpMethodsType;
  params: ExtractRouteParams<EndpointType> | NegativeTypes;
  data: PayloadType | NegativeTypes;
  queryParams: string | NegativeTypes;
  options: ClientOptions | undefined;

  abortController = new AbortController();

  constructor(
    readonly builderConfig: FetchBuilderConfig<ErrorType, ClientOptions>,
    readonly apiConfig: FetchMiddlewareOptions<EndpointType, ClientOptions>,
    readonly defaultOptions?: DefaultOptionsType<ResponseType, PayloadType, ErrorType, EndpointType>,
  ) {
    this.endpoint = defaultOptions?.endpoint || apiConfig.endpoint;
    this.headers = apiConfig.headers;
    this.method = apiConfig.method || HttpMethodsEnum.get;
    this.params = defaultOptions?.params;
    this.data = defaultOptions?.data;
    this.queryParams = defaultOptions?.queryParams;
    this.mockCallback = defaultOptions?.mockCallback;
  }

  requestStartCallback: ClientStartCallback | undefined;
  responseStartCallback: ClientResponseStartCallback | undefined;
  requestProgressCallback: ClientProgressCallback | undefined;
  responseProgressCallback: ClientProgressCallback | undefined;
  onFinishedCallback: ClientFinishedCallback | undefined;
  onErrorCallback: ClientErrorCallback | undefined;
  onSuccessCallback: ClientSuccessCallback | undefined;

  public onRequestStart = (callback: ClientStartCallback) => {
    const cloned = this.clone();

    cloned.requestStartCallback = callback;

    return cloned;
  };

  public onResponseStart = (callback: ClientStartCallback) => {
    const cloned = this.clone();

    cloned.responseStartCallback = callback;

    return cloned;
  };

  public onRequestProgress = (callback: ClientProgressCallback) => {
    const cloned = this.clone();

    cloned.requestProgressCallback = callback;

    return cloned;
  };

  public onResponseProgress = (callback: ClientProgressCallback) => {
    const cloned = this.clone();

    cloned.responseProgressCallback = callback;

    return cloned;
  };

  public onError = (callback: ClientErrorCallback) => {
    const cloned = this.clone();

    cloned.onErrorCallback = callback;

    return cloned;
  };

  public onSuccess = (callback: ClientSuccessCallback) => {
    const cloned = this.clone();

    cloned.onSuccessCallback = callback;

    return cloned;
  };

  public onFinished = (callback: ClientFinishedCallback) => {
    const cloned = this.clone();

    cloned.onFinishedCallback = callback;

    return cloned;
  };

  public setData = (
    data: PayloadType,
  ): FetchMiddleware<ResponseType, PayloadType, ErrorType, EndpointType, ClientOptions, true, HasParams, HasQuery> => {
    return this.clone({ data }) as FetchMiddleware<
      ResponseType,
      PayloadType,
      ErrorType,
      EndpointType,
      ClientOptions,
      true,
      HasParams,
      HasQuery
    >;
  };

  public setParams = (
    params: ExtractRouteParams<EndpointType>,
  ): FetchMiddleware<ResponseType, PayloadType, ErrorType, EndpointType, ClientOptions, HasData, true, HasQuery> => {
    return this.clone({ params }) as FetchMiddleware<
      ResponseType,
      PayloadType,
      ErrorType,
      EndpointType,
      ClientOptions,
      HasData,
      true,
      HasQuery
    >;
  };

  public setQueryParams = (
    queryParams: string,
  ): FetchMiddleware<ResponseType, PayloadType, ErrorType, EndpointType, ClientOptions, HasData, HasParams, true> => {
    return this.clone({ queryParams }) as FetchMiddleware<
      ResponseType,
      PayloadType,
      ErrorType,
      EndpointType,
      ClientOptions,
      HasData,
      HasParams,
      true
    >;
  };

  public mock = (mockCallback: (data: PayloadType) => ClientResponseType<ResponseType, ErrorType>) => {
    return this.clone({ mockCallback });
  };

  public clean = () => {
    delete this.requestStartCallback;
    delete this.responseStartCallback;
    delete this.requestProgressCallback;
    delete this.responseProgressCallback;
    delete this.onFinishedCallback;
    delete this.onErrorCallback;
    delete this.onSuccessCallback;

    return this;
  };

  private paramsMapper = (params: ParamsType | null | undefined): string => {
    let endpoint = this.apiConfig.endpoint as string;
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        endpoint = endpoint.replace(new RegExp(`:${key}`, "g"), String(value));
      });
    }
    return endpoint;
  };

  public clone(
    options?: DefaultOptionsType<ResponseType, PayloadType, ErrorType, EndpointType>,
  ): FetchMiddleware<ResponseType, PayloadType, ErrorType, EndpointType, ClientOptions, HasData, HasParams, HasQuery> {
    const currentOptions: DefaultOptionsType<ResponseType, PayloadType, ErrorType, EndpointType> = {
      endpoint: this.paramsMapper(options?.params || this.params) as EndpointType,
      params: options?.params || this.params,
      queryParams: options?.queryParams || this.queryParams,
      data: options?.data || this.data,
      mockCallback: options?.mockCallback || this.mockCallback,
      abortController: this.abortController,
    };

    const cloned = new FetchMiddleware<
      ResponseType,
      PayloadType,
      ErrorType,
      EndpointType,
      ClientOptions,
      HasData,
      HasParams,
      HasQuery
    >(this.builderConfig, this.apiConfig, currentOptions);

    return Object.assign(cloned, {
      requestStartCallback: this.requestStartCallback,
      responseStartCallback: this.responseStartCallback,
      requestProgressCallback: this.requestProgressCallback,
      responseProgressCallback: this.responseProgressCallback,
      onFinishedCallback: this.onFinishedCallback,
      onErrorCallback: this.onErrorCallback,
      onSuccessCallback: this.onSuccessCallback,
    });
  }

  public send: FetchMethodType<ResponseType, PayloadType, ErrorType, EndpointType, HasData, HasParams, HasQuery> =
    async (setup?: FetchType<PayloadType, EndpointType, HasData, HasParams, HasQuery>) => {
      if (this.mockCallback) return Promise.resolve(this.mockCallback(this.data as PayloadType));

      const middleware = this.clone(setup);

      const { client } = this.builderConfig;

      return client(middleware);
    };
}
// Typescript test cases

// import { FetchBuilder } from "middleware";

// const fetchMiddleware = new FetchBuilder({
//   baseUrl: "http://localhost:3000",
// }).build();

// const getUsers = fetchMiddleware<{ id: string }[]>()({
//   method: "GET",
//   endpoint: "/users",
// });

// const getUser = fetchMiddleware<{ id: string }>()({
//   method: "GET",
//   endpoint: "/users/:id",
// });

// const postUser = fetchMiddleware<{ id: string }, { name: string }>()({
//   method: "POST",
//   endpoint: "/users",
// });

// const patchUser = fetchMiddleware<{ id: string }, { name: string }>()({
//   method: "PATCH",
//   endpoint: "/users/:id",
// });

// // OK
// getUsers.send({ queryParams: "" });
// getUsers.setQueryParams("").send();
// // Fail
// getUsers.send({ data: "" });
// getUsers.send({ params: "" });
// getUsers.setQueryParams("").send({ queryParams: "" });

// // OK
// getUser.send({ params: { id: "" }, queryParams: "" });
// getUser.setParams({ id: "" }).send({ queryParams: "" });
// // Fail
// getUser.send({ queryParams: "" });
// getUser.send();
// getUser.setParams({ id: "" }).send({ params: { id: "" } });

// // OK
// postUser.send({ data: { name: "" } });
// postUser.setData({ name: "" }).send();
// // Fail
// postUser.send({ queryParams: "" });
// postUser.send({ data: null });
// postUser.send();
// postUser.setData({ name: "" }).send({ data: { name: "" } });

// // OK
// patchUser.send({ params: { id: "" }, data: { name: "" } });
// patchUser.setParams({ id: "" }).setData({ name: "" }).send();
// // Fail
// patchUser.send({ queryParams: "" });
// patchUser.send({ data: null });
// patchUser.send();
// patchUser
//   .setParams({ id: "" })
//   .setData({ name: "" })
//   .send({ data: { name: "" } });
// patchUser
//   .setParams({ id: "" })
//   .setData({ name: "" })
//   .send({ params: { id: "" } });
