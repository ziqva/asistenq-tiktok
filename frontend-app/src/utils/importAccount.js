import FormData from 'form-data'
import server from 'config/server'
import axios from 'axios'

export default function importAccount(file) {
    return new Promise((resolve, reject) => {
        const url = `${server.api.base}/account/imports`
        const fd = new FormData()
        fd.append('file', file)
        axios.post(url, fd, {
            timeout: 1.08e+7
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