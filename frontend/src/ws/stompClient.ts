import { Client, StompSubscription, IMessage } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import ENV from "../config/env";

const client = new Client({
  webSocketFactory: () => new SockJS(ENV.API_BASE_URL + "/ws"),
  reconnectDelay: 5000,
  onStompError: (frame) => {
    console.error("STOMP error:", frame);
  },
});

export function connect(token: string): void {
  client.connectHeaders = { Authorization: "Bearer " + token };
  client.activate();
}

export function disconnect(): void {
  client.deactivate();
}

export function subscribe(
  dest: string,
  cb: (msg: IMessage) => void
): StompSubscription {
  return client.subscribe(dest, cb);
}

export function publish(dest: string, body: object): void {
  client.publish({
    destination: dest,
    body: JSON.stringify(body),
  });
}

export function onConnect(cb: () => void): void {
  client.onConnect = () => cb();
}