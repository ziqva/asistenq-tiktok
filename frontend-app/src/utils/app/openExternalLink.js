import axios from 'axios'
import server from 'config/server'

export default function openExternalLink(_url) {
    return new Promise((resolve, reject) => {
        const url = `${server.api.base}/app/openExternalLink`
        const params = {url: _url}
        axios.post(url, params)
            .then(({data}) => {
                if (data.error) {
                    reject(data.msg)
                } else {
                    resolve(true)
                }
            })
            .catch(err => reject(err.message || err))
    })
}