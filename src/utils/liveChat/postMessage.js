import axios from 'axios'
import server from 'config/server'
import FormData from 'form-data'

export default function postMessage({
    text,
    attachment,
    senderId
}) {
    return new Promise((resolve, reject) => {
        if(!senderId) {
            return reject('senderId is required')
        }
        const url = `${server.api.chat}/chat/post`
        const fd = new FormData()
        fd.append('text', text)
        fd.append('senderId', senderId)
        if(attachment) {
            fd.append('attachment', attachment)
        }
        axios.post(url, fd)
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