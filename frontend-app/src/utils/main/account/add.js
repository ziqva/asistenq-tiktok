import axios from 'axios'
import server from 'config/server'

export default function add({
    name,
    email,
    password,
    authenticator,
    useAuthenticator,
    labels
}) {
    return new Promise((resolve, reject) => {
        const url = `${server.api.base}/account/add`
        const params = {
            name,
            email,
            password,
            authenticator,
            useAuthenticator,
            labels
        }

        axios.post(url, params)
            .then(({data}) => {
                if(data.error) {
                    reject(data.msg)
                } else {
                    resolve(data.msg)
                }
            })
            .catch(err => reject(err.message || err))
    })
}