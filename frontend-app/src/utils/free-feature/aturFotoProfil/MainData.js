import server from "config/server";
import { io } from "socket.io-client";

export default class MainData {
  constructor() {
    this.url = `${server.socket.base}`;
    this.onRunningState = (e) => {
    };
    this.onLogs = () => {};

    this.socket = io(this.url, {
      auth: {
        from: "atur-foto-profil",
      },
    });
    this.socket.on("connect", () => {
      this.socket.on("running-state", this.onRunningState);
      this.socket.on("logs", this.onLogs);
    });
  }

  unset(selectedIds) {
    this.socket.emit("unset", {
      selectedIds,
    });
  }

  start(selectedIds, { folder }) {
    this.socket.emit("start", {
      selectedIds,
      folder
    });
  }
}
