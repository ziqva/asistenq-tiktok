import server from 'config/server'
import {io} from 'socket.io-client'
import axios from 'axios'

export default class MainData {
    constructor() {
        this.wsBase = server.socket.base
        this.onMainData = () => {}
        this.socket = io(this.wsBase, {
            auth: {
                from: "main_data_column"
            }
        })

        this.socket.on('connect', () => {
        })
        this.socket.on('column-data', data => {
            this.onMainData(data)
        })
    }

    setActive({name, index, state}) {
        const url = `${server.api.base}/mainDataColumn/setActive`
        const params = {name, index, state}
        axios.post(url, params)
        .then(({data}) => {
            if(data.error) {
                console.error(data.msg)
            }
        })
        .catch(err=> {
            console.error(err.message || err)
        })
    }
}