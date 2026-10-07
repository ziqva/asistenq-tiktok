import axios from 'axios'
import server from 'config/server'

export default function upload({id, maxFile, afterUploaded, dirPath}) {
    return new Promise((resolve, reject) => {
        const url = `${server.api.base}/freeFeature/productUploader/upload`
        const params = {id, maxFile, afterUploaded, dirPath}
        axios.post(url, params)
        .then(({data}) => {
            if(data.error) {
                reject(data.msg)
            } else {
                resolve(null)
            }
        })
        .catch(err => reject(err.message || err))
    })
}