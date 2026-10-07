import axios from "axios";
import { io } from "socket.io-client";
import server from "config/server";

export default class MainData {
  constructor({ onLogs, onRunningState, onEligible }) {
    this.url = `${server.socket.base}`;
    this.onRunningState = () => {};
    this.onLogs = () => {};
    this.onEligible = () => {};
    const socket = io(this.url, {
      auth: {
        from: "free_feature__delete_product",
      },
    });
    socket.on("is-running", onRunningState);
    socket.on("logs", onLogs);
    socket.on("eligible-data", onEligible);
    socket.on("connect", () => {
      console.log("socket main data of the delete product has been connected");
    });
    this.socket = socket;
  }

  stop() {
    this.socket.emit("stop");
  }

  start(accountId, { id, value, notSold }) {
    try {
      console.log({ id, value });
      this.socket.emit("start_delete_product", {
        accountId,
        id,
        value,
        notSold
      });
    } catch (err) {
      console.error(`Failed for start the process: ${err.message || err}`);
    }
  }
}
