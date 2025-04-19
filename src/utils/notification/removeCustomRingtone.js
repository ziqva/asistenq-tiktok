import server from 'config/server'
import axios from 'axios'

/**
 * Removes a custom ringtone from the server.
 *
 * @param {string} name - The name of the custom ringtone to remove.
 * @return {Promise<boolean>} A promise that resolves to true if the ringtone was successfully removed, or rejects with an error message.
 */
export default function removeCustomRingtone(name) {
    return new Promise((resolve, reject) => {
        const url = `${server.api.base}/notification/removeCustomRingtone`
        axios.post(url, { name })
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