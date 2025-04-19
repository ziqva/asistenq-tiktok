import axios from 'axios'
import server from 'config/server'

export default function update(zipFile) {
    return new Promise((resolve, reject) => {
        const url = `${server.api.base}/updater/update`
        const params = {zip_file: zipFile}
        axios.post(url, params)
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