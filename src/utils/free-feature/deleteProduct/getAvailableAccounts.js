import axios from 'axios'
import server from 'config/server'

export default function getAvailableAccounts({search}) {
    return new Promise((resolve, reject) => {
        const url = `${server.api.base}/freeFeature/deleteProduct/getAvailableAccounts?search=${search}`
        axios.get(url)
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