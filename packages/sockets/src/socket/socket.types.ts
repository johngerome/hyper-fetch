import { Socket } from "socket";
import { ExtractSocketOptionsType, SocketAdapterInstance } from "adapter";
import { EmitterInstance } from "emitter";

export type SocketInstance = Socket<SocketAdapterInstance>;

export type SocketOptionsType<AdapterType extends SocketAdapterInstance> = {
  url: string;
  adapter?: AdapterType;
  reconnect?: number;
  reconnectTime?: number;
  autoConnect?: boolean;
  adapterOptions?: ExtractSocketOptionsType<AdapterType>;
};

export type ReconnectCallbackType<SocketType extends SocketInstance> = (socket: SocketType) => void;
export type ReconnectStopCallbackType<SocketType extends SocketInstance> = (socket: SocketType) => void;
export type OpenCallbackType<SocketType extends SocketInstance, Event> = (event: Event, socket: SocketType) => void;
export type CloseCallbackType<SocketType extends SocketInstance, Event> = (event: Event, socket: SocketType) => void;
export type MessageCallbackType<SocketType extends SocketInstance, Event> = (event: Event, socket: SocketType) => Event;
export type SendCallbackType<EmitterType extends EmitterInstance> = (emitter: EmitterType) => EmitterInstance;
export type ErrorCallbackType<SocketType extends SocketInstance, Event> = (event: Event, socket: SocketType) => void;
