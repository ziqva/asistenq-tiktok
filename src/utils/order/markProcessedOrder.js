import axios from 'axios'
import server from 'config/server'

export default function markProcessedOrder(invoice) {
    return new Promise((resolve, reject) => {
        const url = `${server.api.base}/order/markProcessedOrder`
        const payload = { invoice }
        axios.post(url, payload)
            .then(() => {
                resolve()
            })
            .catch(err => reject(err.message || err))
    })
}