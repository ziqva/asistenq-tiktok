import server from 'config/server'
import axios from 'axios'

export default function bulkRefreshCore(ids) {
    return new Promise((resolve, reject) => {
        const url = `${server.api.base}/monitoring/bulkRefresh`
        const payload = { ids }
        axios.post(url, payload)
            .then(({data}) => {
                if(data.error) {
                    reject(data.msg)
                } else {
                    resolve()
                }
            })
            .catch(err => reject(err.message || err))
    })
}