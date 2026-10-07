import axios from 'axios'
import server from 'config/server'

export default function getData() {
    return new Promise((resolve, reject) => {
        const url = `${server.api.base}/group/data`
        axios.get(url)
        .then(({data}) => {
            if(data.error) {
                reject(data.msg)
            } else {
                resolve({
                    groups: data.groups,
                    activeForAll: data.activeForAll
                })
            }
        })
        .catch(err => reject(err.message || err))
    })
}