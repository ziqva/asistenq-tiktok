import server from 'config/server'
import axios from 'axios'

export default function remove(ids) {
    return new Promise((resolve, reject) => {
        const url = `${server.api.base}/freeFeature/authenticator/remove`
        const params = {ids}
        axios.post(url, params)
        .then(({data}) => {
            if(data.error) {
                reject(data.msg)
            } else{
                resolve()
            }
        })
        .catch(err => reject(err.message || err))
    })
}