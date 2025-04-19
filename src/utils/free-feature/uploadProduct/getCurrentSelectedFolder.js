import config from "config/server";
import axios from "axios";

export default function getCurrentSelectedFolder() {
  return new Promise((resolve, reject) => {
    const url = `${config.api.base}/freeFeature/productUploader/getCurrentSelectedFolder`;
    axios
      .get(url)
      .then(({ data }) => {
        if (data.error) {
          reject(data.msg);
        } else {
          resolve(data.data);
        }
      })
      .catch((err) => reject(err.message || err));
  });
}
