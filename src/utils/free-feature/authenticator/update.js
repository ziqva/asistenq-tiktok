import server from 'config/server'
import axios from 'axios'

export default function update({label, email, secret, id}) {
    return new Promise((resolve, reject) => {
        const url = `${server.api.base}/freeFeature/authenticator/update`
        const params = {label, email, secret, id}
        axios.post(url, params)
        .then(({data}) => {
            if(data.error) {
                reject(data.msg) 
            } else {
                resolve(true)
            }
        })
        .catch(er => reject(er.message || er))
    })
}