import axios from 'axios'
import server from 'config/server'

export default function add(name) {
    return new Promise((resolve, reject) => {
        const url = `${server.api.base}/group/add`
        const params ={ name }
        axios.post(url, params)
        .then(({data}) => {
            if(data.error) {
                reject(data.msg)
            } else {
                resolve(true)
            }
        })
        .catch(err => {
            reject(err.message || err)
        })
    })
}