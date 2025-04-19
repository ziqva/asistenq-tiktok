import { io } from 'socket.io-client'
import server from 'config/server'

export default class Socket {
    constructor() {
        this.url = server.socket.chat
        const socket = null
        this.onConnected = () => {}
        this.onDisconnected = () => {}
        this.onUserUpdate = () => {}
        this.onNewChat = () => {}
        this.onOnlineUsers = () => {}
        this.userid = null
        this.onTypingUsers = () => {}
        this.onOfficeData = () => {}
    }

    connect({ userId, machineId }) {
        this.socket = io(this.url, {
            transports: [
                'websocket',
                'polling',
                'flashsocket'
            ],
            withCredentials: true,
            auth: {
                machineId: machineId,
                userId: userId
            },
            secure: false
        })
        this.userid = userId
        this.socket.removeAllListeners()
        this.socket.on('connect', this.onConnected)
        this.socket.on('disconnect', this.onDisconnected)
        this.socket.on('user-update', this.onUserUpdate)
        this.socket.on('new-chat', this.onNewChat)
        this.socket.on('online-users', this.onOnlineUsers)
        this.socket.on('typing-users', this.onTypingUsers)
        this.socket.on('office-data', this.onOfficeData)
    }


    setTypingState(state) {
        if(this.socket && this.socket.connected) {
            this.socket.emit('set-typing-state', state)
        }
    }

    setCurrentlyOpeningChat(state) {
        if(this.socket && this.socket.connected) {
            this.socket.emit('set-currently-opening-chat', state)
        }
    }
}   