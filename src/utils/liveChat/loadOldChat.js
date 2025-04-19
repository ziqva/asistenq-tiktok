import server from 'config/server'
import axios from 'axios'

export default function loadOldChat({ beforeChatId }) {
    return new Promise((resolve, reject) => {
        const url = `${server.api.chat}/chat/loadOldChat`
        const params = { beforeChatId }
        axios.post(url, params)
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