import server from 'config/server'
import axios from 'axios'

export default function addNewRingtone() {
    return new Promise((resolve, reject) => {
        const url = `${server.api.base}/notification/addNewRingtone`
        axios.get(url)
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