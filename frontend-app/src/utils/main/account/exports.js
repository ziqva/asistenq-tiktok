import axios from 'axios'
import server from 'config/server'

export default async function exports(params) {
    return new Promise((resolve, reject) => {
        const url = `${server.api.base}/account/exports`
        axios.post(url, params, {
            timeout: 900000 // 15 menit
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