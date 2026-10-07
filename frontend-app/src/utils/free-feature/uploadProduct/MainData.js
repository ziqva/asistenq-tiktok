import server from 'config/server'
import {io} from 'socket.io-client'

export default class MainData {
    constructor() {
        this.url = `${server.socket.base}`
        this.onUploading = () => {}
        this.onLogs = () => {}
        this.socket = io(this.url, {
            auth: {
                from: "free_feature__product_uploader"
            }
        })
        this.socket.on('connect', () => {
            this.socket.on('is-uploading', this.onUploading)
            this.socket.on('logs', this.onLogs)
        })
    }
}