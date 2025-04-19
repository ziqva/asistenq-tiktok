import {io} from 'socket.io-client'
import server from 'config/server'

export default class MainData {
    constructor() {
        this.endpoint = server.socket.base
        this.onMainData = () => {}
        this.socket = io(this.endpoint, {
            withCredentials: true
        })
        this.socket.on('connect', () => {
            this.socket.on('monitoring-main-data', this.onMainData)
        })
    }

    getMainData() {
        if(this.socket.connected) {
            this.socket.emit('get-monitoring-main-data')
        } else {
            throw new Error('Socket is not connected')
        }
    }
}