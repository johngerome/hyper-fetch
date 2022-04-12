import { FetchCommandInstance } from "command";
import { ClientResponseErrorType, ClientResponseType, ClientResponseSuccessType } from "client";
import { FetchEffect } from "effect";
import { ExtractError, ExtractRequestError } from "types";

export type FetchEffectLifecycle = "trigger" | "start" | "success" | "error" | "finished";

export type FetchEffectInstance = FetchEffect<FetchCommandInstance>;

export type FetchEffectConfig<T extends FetchCommandInstance> = {
  name: string;
  onTrigger?: (command: FetchCommandInstance) => void;
  onStart?: (command: FetchCommandInstance) => void;
  onSuccess?: (response: ClientResponseSuccessType<ResponseType>, command: FetchCommandInstance) => void;
  onError?: (
    response: ClientResponseErrorType<ExtractError<T> | ExtractRequestError<T>>,
    command: FetchCommandInstance,
  ) => void;
  onFinished?: (
    response: ClientResponseType<ResponseType, ExtractError<T> | ExtractRequestError<T>>,
    command: FetchCommandInstance,
  ) => void;
};
