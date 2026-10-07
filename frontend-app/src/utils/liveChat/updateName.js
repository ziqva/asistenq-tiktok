import axios from 'axios'
import server from 'config/server'

export default function updateName({machineId, name}) {
    return new Promise((resolve, reject) => {
        const url = `${server.api.chat}/user/updateName`
        const params = { name, machineId }
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