import axios from 'axios'
import server from 'config/server'

export default function sync() {
    return new Promise((resolve, reject) => {
        const url = `${server.api.base}/freeFeature/authenticator/sync`
        axios.get(url)
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