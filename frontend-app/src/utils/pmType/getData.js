import server from 'config/server'
import axios from 'axios'

export default function getData() {
    return new Promise((resolve, reject) => {
        const url = `${server.api.base}/monitoring/getPMTypeData`
        axios.get(url)
        .then(({data}) => {
            if(data.error) {
                reject(data.msg)
            } else {
                resolve(data.data)
            }
        })
        .catch(err => {
            reject(err.message || err)
        })
    })
}