import axios from 'axios'
import server from 'config/server'

export default function get(id){
    return new Promise((resolve, reject) => {
        const url = `${server.api.base}/account/get`
        const params = { id }
        axios.post(url, params)
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