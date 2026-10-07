import {io} from 'socket.io-client'
import server from 'config/server'

export default class MainData {
    constructor() {
        this.onData = () => {}
    }

    connect() {
        const socket = io(server.socket.base)
        socket.on('connect', () => {
            socket.on('free_feature_authenticator-data', this.onData)
        })
    }
}