import {io} from 'socket.io-client'
import server from 'config/server'

const socket = io(server.socket.base)


export default class Filter {
    constructor() {
        this.onFilter = () => {}

        socket.on('connect', () => {
            socket.on('monitoring-active-filter', filter => {
                this.onFilter && this.onFilter(filter)
            })
        })
    }

    setActive(filter) {
        socket.emit('set-monitoring-active-filter', filter)
    }
}