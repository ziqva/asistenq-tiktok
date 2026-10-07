import axios from 'axios'
import server from 'config/server'

export default function remove(ids=[]) {
    return new Promise((resolve, reject) => {
        const url = `${server.api.base}/account/remove`
        const params = {ids}
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