import server from "config/server";
import axios from "axios";

/**
 * Checks for updates by making a GET request to the server API.
 *
 * @return {Promise} A promise that resolves when the update check is complete.
 *                   If an error occurs during the update check, the promise is rejected
 *                   with the error message.
 */
export default function check() {
  return new Promise((resolve, reject) => {
    const url = `${server.api.base}/update/check`;
    axios
      .get(url)
      .then(({ data }) => {
        resolve();
      })
      .catch((err) => resolve(err.message || err));
  });
}
