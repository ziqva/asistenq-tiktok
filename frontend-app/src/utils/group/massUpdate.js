import axios from 'axios'
import server from 'config/server'

export default function massUpdate({ids, groupNames}) {
    return new Promise((resolve, reject) => {
        const url = `${server.api.base}/group/massUpdate`
        const params = {ids, groupNames}
        axios.post(url, params)
        .then(({data}) => {
            if(data.error) {
                reject(data.msg)
            } else {
                resolve(true)
            }
        })
        .catch(err => reject(err.message))
    })
}