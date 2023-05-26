import EventEmitter from "events";
import { QueryStringifyOptionsType, LoggerManager, SeverityType, AppManager, DateInterval } from "@hyper-fetch/core";

import {
  SocketOptionsType,
  ReconnectCallbackType,
  ReconnectStopCallbackType,
  OpenCallbackType,
  CloseCallbackType,
  MessageCallbackType,
  SendCallbackType,
  ErrorCallbackType,
  getSocketEvents,
  interceptListener,
  interceptEmitter,
} from "socket";
import { ExtractSocketFormatType, SocketAdapterInstance, websocketAdapter } from "adapter";
import { Listener, ListenerOptionsType } from "listener";
import { Emitter, EmitterInstance, EmitterOptionsType } from "emitter";

export class Socket<AdapterType extends SocketAdapterInstance> {
  public emitter = new EventEmitter();
  public events = getSocketEvents(this.emitter);

  url: string;
  reconnect: number;
  reconnectTime: number;
  debug: boolean;
  autoConnect: boolean;

  // Callbacks
  __onOpenCallbacks: OpenCallbackType<Socket<AdapterType>, any>[] = [];
  __onCloseCallbacks: CloseCallbackType<Socket<AdapterType>, any>[] = [];
  __onReconnectCallbacks: ReconnectCallbackType<Socket<AdapterType>>[] = [];
  __onReconnectStopCallbacks: ReconnectStopCallbackType<Socket<AdapterType>>[] = [];
  __onMessageCallbacks: MessageCallbackType<Socket<AdapterType>, any>[] = [];
  __onSendCallbacks: SendCallbackType<EmitterInstance>[] = [];
  __onErrorCallbacks: ErrorCallbackType<Socket<AdapterType>, any>[] = [];

  // Config
  adapter: ReturnType<AdapterType>;
  loggerManager = new LoggerManager(this);
  appManager = new AppManager();
  queryParamsConfig?: QueryStringifyOptionsType;

  // Logger
  logger = this.loggerManager.init("Socket");

  constructor(public options: SocketOptionsType<AdapterType>) {
    const { url, adapter, autoConnect, reconnect, reconnectTime } = this.options;
    this.url = url;
    this.debug = false;
    this.autoConnect = autoConnect ?? true;
    this.reconnect = reconnect ?? Infinity;
    this.reconnectTime = reconnectTime ?? DateInterval.second * 2;

    // Adapter must be initialized at the end
    this.adapter = (adapter(this) || websocketAdapter(this)) as unknown as ReturnType<AdapterType>;
  }

  /**
   * This method enables the logger usage and display the logs in console
   */
  setDebug = (debug: boolean) => {
    this.debug = debug;
    return this;
  };

  /**
   * Set the logger severity of the messages displayed to the console
   */
  setLoggerSeverity = (severity: SeverityType) => {
    this.loggerManager.setSeverity(severity);
    return this;
  };

  /**
   * Set the new logger instance to the socket
   */
  setLogger = (callback: (socket: Socket<AdapterType>) => LoggerManager) => {
    this.loggerManager = callback(this);
    return this;
  };

  /**
   * Callbacks
   */

  /**
   * Triggered when connection is opened
   * @param callback
   * @returns
   */
  onOpen<Event = ExtractSocketFormatType<AdapterType>>(callback: OpenCallbackType<Socket<AdapterType>, Event>) {
    this.__onOpenCallbacks.push(callback);
    return this;
  }
  /**
   * Triggered when connection is closed
   * @param callback
   * @returns
   */
  onClose<Event = ExtractSocketFormatType<AdapterType>>(callback: CloseCallbackType<Socket<AdapterType>, Event>) {
    this.__onCloseCallbacks.push(callback);
    return this;
  }

  /**
   * Triggered when connection is getting reconnected
   * @param callback
   * @returns
   */
  onReconnect(callback: ReconnectCallbackType<Socket<AdapterType>>) {
    this.__onReconnectCallbacks.push(callback);
    return this;
  }

  /**
   * Triggered when connection attempts are stopped
   * @param callback
   * @returns
   */
  onReconnectStop(callback: ReconnectStopCallbackType<Socket<AdapterType>>) {
    this.__onReconnectStopCallbacks.push(callback);
    return this;
  }

  /**
   * Triggered when any message is received
   * @param callback
   * @returns
   */
  onMessage<Event = ExtractSocketFormatType<AdapterType>>(callback: MessageCallbackType<Socket<AdapterType>, Event>) {
    this.__onMessageCallbacks.push(callback);
    return this;
  }

  /**
   * Triggered when any event is emitted
   * @param callback
   * @returns
   */
  onSend<EmitterType extends EmitterInstance>(callback: SendCallbackType<EmitterType>) {
    this.__onSendCallbacks.push(callback);
    return this;
  }

  /**
   * Triggered when we receive error
   * @param callback
   * @returns
   */
  onError<Event = ExtractSocketFormatType<AdapterType>>(callback: ErrorCallbackType<Socket<AdapterType>, Event>) {
    this.__onErrorCallbacks.push(callback);
    return this;
  }

  /**
   * ********************
   * Interceptors
   * ********************
   */

  __modifySend = (emitter: EmitterInstance) => {
    return interceptEmitter(this.__onSendCallbacks, emitter);
  };

  __modifyResponse = (response: ExtractSocketFormatType<AdapterType>) => {
    return interceptListener(this.__onMessageCallbacks, response, this);
  };

  /**
   * ********************
   * Creators
   * ********************
   */

  /**
   * Create event listener
   * @param options
   * @returns
   */
  createListener = <Response>(options: ListenerOptionsType<AdapterType>) => {
    return new Listener<Response, AdapterType>(this, options as any);
  };

  /**
   * Create event emitter
   * @param options
   * @returns
   */
  createEmitter = <Payload, Response = never>(options: EmitterOptionsType<AdapterType>) => {
    if ("isSSE" in this.options) {
      throw new Error("Cannot create emitters for SSE adapter");
    }
    return new Emitter<Payload, Response, AdapterType>(this, options as any);
  };
}
