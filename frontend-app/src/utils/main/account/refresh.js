import server from 'config/server'
import axios from 'axios'

export default function refresh(id) {
    return new Promise((resolve, reject) => {
        const url = `${server.api.base}/account/refresh`
        axios.post(url, {
            id: id
        })
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