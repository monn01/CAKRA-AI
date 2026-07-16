"use client";

import { io, type Socket } from "socket.io-client";

let socket: Socket | undefined;

export function getSocketClient(): Socket {
  if (!socket) {
    socket = io({ path: "/api/socket" });
  }
  return socket;
}
