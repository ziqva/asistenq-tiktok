import server from 'config/server'
import axios from 'axios'

export default function set(size) {
    return new Promise((resolve, reject) => {
        const url = `${server.api.base}/zoomLevel/set`
        const params = {size}
        axios.post(url, params)
        .then(({data}) => {
            if(data.error) {
                reject(data.msg)
            } else {
                resolve(true)
            }
        })
        .catch(err => reject(err.message || err))
    })
}