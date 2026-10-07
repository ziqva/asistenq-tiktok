import server from "config/server";
import { io } from "socket.io-client";

export default class MainData {
  constructor() {
    this.url = `${server.socket.base}`;
    this.onRunningState = () => {};
    this.onLogs = () => {};

    this.socket = io(this.url, {
      auth: {
        from: "operational_schedule",
      },
    });
    this.socket.on("connect", () => {
      this.socket.on("running-state", this.onRunningState);
      this.socket.on("logs", this.onLogs);
    });
  }

  start(selectedIds, days) {
    this.socket.emit("start", { selectedIds, days });
  }
}
