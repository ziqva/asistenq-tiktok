import server from 'config/server'
import axios from 'axios'

export default function setActiveForAll(state, callback) {
    const url = `${server.api.base}/monitoring/PMTypeSetActiveForAll`
    const params = {state}
    axios.post(url, params)
    .then(() => {
        callback && callback()
    })
    .catch(err => console.error(err.message || err))
}