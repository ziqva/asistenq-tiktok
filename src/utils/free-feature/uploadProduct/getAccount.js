import axios from 'axios'
import server from 'config/server'

export default function getAccount(id) {
    return new Promise((resolve, reject) => {
        const url = `${server.api.base}/freeFeature/productUploader/getAccount`
        axios.post(url, {id})
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