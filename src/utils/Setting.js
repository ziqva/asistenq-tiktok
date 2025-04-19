import server from 'config/server'
import axios from 'axios'

export default class Setting {
    constructor() {
        this.apiBase = server.api.base
    }

    get(name) {
        return new Promise((resolve, reject) => {
            const url = `${this.apiBase}/setting/getValue`
            const params = {
                name
            }
            axios.post(url, params)
            .then(({data}) => {
                if(data.error) {
                    reject(data.msg)
                } else {
                    resolve(data.value)
                }
            })
            .catch(err => reject(err.message || err))
        })
    }

    set(name, value) {
        return new Promise((resolve, reject) => {
            const url = `${this.apiBase}/setting/setValue`
            const params = {name, value}
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