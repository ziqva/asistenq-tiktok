import axios from 'axios'
import server from 'config/server'

export default function get() {
    return new Promise((resolve, reject) => {
        const url = `${server.api.base}/notification/get`
        axios.get(url)
        .then(({data}) => {
            if(data.error) {
                reject(data.msg)
            } else {
                resolve(data.data)
            }
        })
        .catch(err => reject(err.message || err))
    })
}   