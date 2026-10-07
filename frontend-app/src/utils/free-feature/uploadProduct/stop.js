import axios from 'axios'
import server from 'config/server'

export default function stop() {
    return new Promise(resolve => {
        const url = `${server.api.base}/freeFeature/productUploader/stop`
        axios.post(url)
        .then(() => resolve())
        .catch(err => {
            console.error(err.message || err)
            resolve()
        })
    }) 
}