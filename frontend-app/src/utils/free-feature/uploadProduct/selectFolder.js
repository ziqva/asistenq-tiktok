import server from 'config/server'
import axios from 'axios'

export default function selectFolder() {
    return new Promise((resolve, reject) => {
        const url = `${server.api.base}/freeFeature/productUploader/selectFolder`
        axios.get(url, {
            timeout: 100000000,
            timeoutErrorMessage: "Terlalu lama menunggu folder terpilih"
        })
        .then(({data}) => {
            if(data.error) {
                reject(data.msg)
            } else {
                resolve(data.data)
            }
        })
        .catch(err => {
            reject(err.message)
        })
    })
}