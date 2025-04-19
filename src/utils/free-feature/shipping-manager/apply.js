import axios from 'axios'
import config from '../../../config/server'

export default function apply(accountIds, activeIds) {
    return new Promise((resolve, reject) => {
        const url = `${config.api.base}/freeFeature/shippingManager/applyActivateShippers`
        axios.post(url, {
            accountIds,
            activeIds,
        }, {
            timeout: 1.8e+7
        })
        .then(() => resolve())
        .catch(err => reject(err.message || err))
    })
}