import axios from 'axios'
import server from 'config/server'

export default function login({ids}) {
    return new Promise((resolve, reject) => {
        const url = `${server.api.base}/account/login`
        axios.post(url, {ids: ids})
            .then(({data}) => {
                if(data.error) {
                    reject(data.msg)
                } else {
                    resolve(true)
                }
            })
            .catch(err => {
                console.error(err)
            })
    })
}