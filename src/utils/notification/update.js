import server from 'config/server'
import axios from 'axios'

export default function update({
    soundActive,
    soundVolume,
    soundFilename,
    toastActive
}) {
    return new Promise((resolve, reject) => {
        const url = `${server.api.base}/notification/update`
        const params = { soundActive, soundVolume, soundFilename,toastActive }
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