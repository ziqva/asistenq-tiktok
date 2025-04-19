import server from 'config/server'
import { io } from 'socket.io-client'

export default class BotStatus {
    constructor({onStatus}) {
        this.ep = server.socket.base // endpoint
        this.socket = io(this.ep, {
            withCredentials: true
        })

        this.socket.on('connect', () => { 
            this.socket.on('bot-status', onStatus)
        })
    }

    toggle() {
        this.socket.emit('bot-active-toggle')
    }
}