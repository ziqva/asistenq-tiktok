import axios from 'axios'
import server from 'config/server'

import {io} from 'socket.io-client'

export default class OpenBrowser {
    constructor() {
        this.onAccountActive = () => {}
        const socket = io(server.socket.base)
        socket.on('connect', () => {
            socket.on('active-account-id', (data) => {
                this.onAccountActive(data)
            })
        })
    }

    openBrowser(id, targetUrl) {
        return new Promise((resolve, reject) => {
            const url = `${server.api.base}/openBrowser/open`
            const params = {id, targetUrl}
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
}