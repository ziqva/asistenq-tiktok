import server from 'config/server'
import axios from 'axios'

export default function addExt(url) {
    return new Promise((resolve, reject) => {
        const hitUrl = `${server.api.base}/browser/addExtension`
        axios.post(hitUrl, {
            url
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