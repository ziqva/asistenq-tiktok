import axios from 'axios'
import server from 'config/server'

export default function getLastChat() {
    return new Promise((resolve, reject) => {
        const url = `${server.api.chat}/chat/getLastChat`
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