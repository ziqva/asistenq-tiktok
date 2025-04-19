import axios from 'axios'
import server from 'config/server'

export default function show({title, message, from}) {
    const url = `${server.api.base}/notification/show`
    const params = { title, message, from }
    axios.post(url, params)
    .then(() => {})
    .catch(err => { console.error(err) })
}