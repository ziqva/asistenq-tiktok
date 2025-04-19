import config from '../../../config/server'
import axios from 'axios'

export default function getShippers() {
    return new Promise((resolve, reject) => {
        const url = `${config.api.base}/freeFeature/shippingManager/getShippers`
        axios.get(url)
            .then(({data}) => {
                if(data.error) {
                    return reject(data.msg)
                }
                return resolve(data.data)
            })
            .catch(err => reject(err.message || err))
    })
}