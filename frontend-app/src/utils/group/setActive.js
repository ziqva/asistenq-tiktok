import axios from 'axios'
import server from 'config/server'

export default function setActive(name, state, callback) {
    return new Promise((resolve, reject) => {
        const url = `${server.api.base}/group/setActive`
        const params = { name, state }
        axios.post(url, params)
        .then(({data}) => {
            if(data.error) {
                reject(data.msg)
            } else {
                resolve(true)
                if(callback) { callback() }
            }
        })
        .catch(err => reject(err.message || err))
    })
}