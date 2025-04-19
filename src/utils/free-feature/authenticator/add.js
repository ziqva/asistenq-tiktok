import server from 'config/server'
import axios from 'axios'

export default function add({label, email, authenticator}) {
    return new Promise((resolve, reject) => {
        const url = `${server.api.base}/freeFeature/authenticator/add`
        const params = {label, email, authenticator}
        axios.post(url, params)
        .then(({data}) => {
            if(data.error) {
                reject(data.msg)
            } else{
                resolve(true)
            }
        })
        .catch(err => {
            reject(err.message)
        })
    })
}