import { Client, StompSubscription, IMessage } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import ENV from "../config/env";

const connectCallbacks = new Set<() => void>();

let _connected = false;

const client = new Client({
  webSocketFactory: () => new SockJS(ENV.API_BASE_URL + "/ws"),
  reconnectDelay: 5000,
  onConnect: () => {
    _connected = true;
    connectCallbacks.forEach((cb) => cb());
  },
  onDisconnect: () => {
    _connected = false;
  },
  onStompError: (frame) => {
    console.error("STOMP error:", frame);
  },
});

let _refCount = 0;

export function connect(token: string): void {
  _refCount++;
  if (client.active || _connected) return;
  client.connectHeaders = { Authorization: "Bearer " + token };
  client.activate();
}

export function disconnect(): void {
  _refCount = Math.max(0, _refCount - 1);
  if (_refCount === 0) {
    _connected = false;
    client.deactivate();
  }
}

export function subscribe(
  dest: string,
  cb: (msg: IMessage) => void
): StompSubscription {
  if (!_connected) {
    throw new Error(`Cannot subscribe to ${dest}: STOMP not connected`);
  }
  return client.subscribe(dest, cb);
}

export function publish(dest: string, body: object): void {
  if (!_connected) {
    console.warn("Cannot publish: STOMP not connected");
    return;
  }
  client.publish({ destination: dest, body: JSON.stringify(body) });
}

export function onConnect(cb: () => void): void {
  connectCallbacks.add(cb);
  if (_connected) {
    cb();
  }
}

export function offConnect(cb: () => void): void {
  connectCallbacks.delete(cb);
}

export function isConnected(): boolean {
  return _connected;
}