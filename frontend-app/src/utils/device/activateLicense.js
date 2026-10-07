import server from 'config/server'
import axios from 'axios'


export default function activateLicense(license) {
    return new Promise((resolve, reject) => {
        const url = `${server.api.base}/device/activateLicense`
        const params = { license }
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