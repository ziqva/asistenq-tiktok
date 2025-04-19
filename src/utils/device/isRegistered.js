import server from 'config/server'
import axios from 'axios'
export default function isRegistered() {
    return new Promise((resolve, reject) => {
        const url = `${server.api.base}/device/isRegistered`
        axios.get(url)
            .then(({data}) => {
                if(data.error) {
                    reject(data.msg)
                } else {
                    resolve(data.registered)
                }
            })
            .catch(err => reject(err.message || err))
    })
}