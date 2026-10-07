import server from 'config/server'
import axios from 'axios'


export default function getUpdates() {
    return new Promise((resolve, reject) => {
        const url = `${server.api.base}/updater/getUpdates`
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