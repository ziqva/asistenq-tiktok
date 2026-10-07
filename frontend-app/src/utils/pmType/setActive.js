import axios from 'axios'
import server from 'config/server'

export default function setActive(name, state, callback) {
    const url = `${server.api.base}/monitoring/PMTypeSetActive`
    const params = {name, state}
    axios.post(url, params)
    .then(({data}) => {
        callback && callback()
    })
    .catch(err => console.error(err.message || err))
}