import axios from 'axios'
import server from 'config/server'

export default function getExtensions(id) {
    return new Promise((resolve, reject) => {
        const url = `${server.api.base}/browser/removeExtension`
        axios.post(url, { id })
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