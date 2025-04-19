import axios from "axios";
import server from "config/server";

export default function updateSingle(before, after) {
  return new Promise((resolve, reject) => {
    const url = `${server.api.base}/group/updateSingle`;
    axios
      .post(url, {
        before,
        after,
      })
      .then(({ data }) => {
        if (data.error) {
          reject();
        } else {
          resolve();
        }
      })
      .catch((err) => {
        reject();
      });
  });
}
