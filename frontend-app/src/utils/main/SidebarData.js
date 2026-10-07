import {io} from 'socket.io-client'
import server from 'config/server'

export default class SidebarData {
    constructor() {
        this.base = server.socket.base
        this.socket = io(this.base)
        this.onData = () => {}
        this.onRefreshData = () => {}
        this.socket.on('connect', () => {
            this.socket.on('main-sidebar-data', data => {
                this.onData(data)
            })

            this.socket.on('refresh-account-data', data => {
                this.onRefreshData(data)
            })
        })
    }
}