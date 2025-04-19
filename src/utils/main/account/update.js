import server from 'config/server'
import axios from 'axios'

export default function update({
    id,
    name,
    email,
    password,
    secretAutenticator,
    useAuthenticator,
    groupNames
}) {
    return new Promise((resolve, reject) => {
        const url = `${server.api.base}/account/update`
        const params = {
            id,
            name,
            email,
            password,
            secretAutenticator,
            useAuthenticator,
            groupNames
        }
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