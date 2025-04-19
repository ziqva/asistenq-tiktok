import axios from 'axios'
import server from 'config/server'

export default function restart() {
  return new Promise((resolve, reject) => {
    const url = `${server.api.base}/app/restart`
    axios.post(url)
    .then(({data}) => {
      if(data.error) {
        reject(data.msg)
      } else {
        resolve(true)
      }
    })
    .catch(err => {
      reject(err.message || err)
    })
  })
}
