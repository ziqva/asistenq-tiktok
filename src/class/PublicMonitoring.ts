import fetch from 'node-fetch'
import Device from './Device'
import Monitoring from './Monitoring'
import Group from './Group'

export default class PublicMonitoring {
    private rootUrl: string = 'https://asmon.ziqva.com'
    private headers: any = { 'user-agent': 'asistenq', 'content-type': 'application/json' }
    private device: Device
    private monitoring: Monitoring
    public active: boolean = false
    public recordDelay: number = 30000
    private group: Group

    constructor({ device, monitoring, group }: {
        device: Device,
        monitoring: Monitoring,
        group: Group
    }) {
        this.group = group
        this.device = device
        this.monitoring = monitoring
        this.init()
        // this.recordInterval()
    }

    /**
     * Records public monitoring data at a fixed interval.
     * 
     * This function will call the record() method at a fixed interval specified by the recordDelay property.
     * If the record() method fails, it will log the error message then continue to the next iteration.
     * This function will not stop unless it is explicitly stopped.
     * 
     * @return {Promise<void>} - A promise that resolves when the function is stopped.
     */
    private async recordInterval(): Promise<void> {
        while(true) {
            try {
                await this.record()
            } catch(err) { console.error(err.message || err) }
            await new Promise(r => setTimeout(r, this.recordDelay))
        }
    }

    /**
     * Initializes public monitoring services.
     * 
     * Makes a request to public monitoring server to register the device.
     * 
     * @return {Promise<void>} - A promise that resolves when the registration is complete.
     */
    public async init(): Promise<void> {
        try {
            console.log('Initializing public monitoring services')
            const url = `${this.rootUrl}/backend/init`
            const res = await fetch(url, {
                headers: this.headers,
                body: JSON.stringify({ machineId: this.device.getMachineId() }),
                method: "POST",
            })
            if (res.ok) {
                const data = await res.json()
                console.log(data)
            }
        } catch (err) { }
        finally {
            await this.isActive()
        }
    }

    /**
     * Checks if the device is active in public monitoring services.
     * 
     * Makes a request to public monitoring server with the device's machine ID.
     * 
     * @return {Promise<boolean>} - A promise that resolves to a boolean indicating the device's activity status.
     */
    public async isActive(): Promise<boolean> {
        try {
            const url = `${this.rootUrl}/backend/isActive`
            const res = await fetch(url, { headers: this.headers, body: JSON.stringify({ machineId: this.device.getMachineId() }), method: "POST" })
            if (res.ok) {
                const data: any = await res.json()
                this.active = data.data.active
                console.log({data})
                return data.data.active
            }
            this.active = false
            return false
        } catch (err) { }
        this.active = false
        return false
    }

    /**
     * Toggles the device's activity status in public monitoring services.
     * 
     * Makes a request to public monitoring server with the device's machine ID.
     * 
     * @return {Promise<void>} - A promise that resolves when the request is complete.
     * 
     **/
    public async activeToggle(): Promise<void> {
        try {
            const url = `${this.rootUrl}/backend/activeToggle`
            const res = await fetch(url, {
                headers: this.headers, method: "POST", body: JSON.stringify({
                    machineId: this.device.getMachineId()
                })
            })
            if (res.ok) {
                const data = await res.json()
                console.log(data)
            }
        } catch (err) { }
        finally {
            await this.isActive()
        }
    }

    /**
     * Retrieves the alias of the device in public monitoring services.
     * 
     * Makes a request to public monitoring server with the device's machine ID.
     * 
     * @return {Promise<string>} - A promise that resolves to the device's alias if the request is successful, otherwise an empty string.
     */
    public async getAlias(): Promise<string> {
        const url = `${this.rootUrl}/backend/getAlias`
        const response = await fetch(url, {
            headers: this.headers,
            body: JSON.stringify({
                machineId: this.device.getMachineId()
            }),
            method: "POST"
        })
        if(!response.ok) {
            return ''
        }

        const data: any = await response.json()
        if(data.error) {
            return ''
        }

        return data.data.alias
    }

    private getTotalBalanceofMonitoring(): number {
        let balance = 0
        for(const item of this.monitoring.mainData) {
            balance+= item.balance
        }
        return balance
    }

    /**
     * Records public monitoring data at a fixed interval.
     * 
     * This function will record the main data into public monitoring server
     * and will not stop unless it is explicitly stopped.
     * 
     * @return {Promise<void>} - A promise that resolves when the function is stopped.
     */
    public async record(): Promise<void> {
        if(!this.active) { console.log('PublicMonitoring: is inactive'); return }
        if(!this.monitoring.running) { console.log('PublicMonitoring: monitoring is not running'); return }
        console.log('Pusing data...')
        const md = this.group.filterMainData(this.monitoring.mainData)
        let data: PublicRecordPayload = {
            numbers: {
                chat: 0,
                discus: 0,
                order: 0,
                processing: 0,
                shipping: 0,
                complaint: 0,
                active: 0,
                hasBalanced: 0,
                moderated: 0,
                logout: 0,
                accounts: md.length
            },
            orders: [],
            discuses: [],
            processes: [],
            shippings: [],
            moderateds: [],
            hasSaldo: [],
            complaints: [],
            logouts: [],
            chats: [],
            machineId: this.device.getMachineId(),
            totalBalance: this.getTotalBalanceofMonitoring()
        }

        // Calculate data and put into data parameters
        data.numbers.hasBalanced = md.filter(x => x.balance > 0).length
        data.numbers.moderated = md.filter(x => x.moderated).length
        data.numbers.logout = md.filter(x => !x.authenticated).length
        for(const item of md) {
            data.numbers.chat+= item.chatCount
            // data.numbers.discus+= item.discusCount
            data.numbers.discus+= 0
            data.numbers.order+= item.orderCount
            data.numbers.processing+= item.dikemasCount
            data.numbers.shipping+= item.dikirimCount
            data.numbers.complaint+= item.complaintCount
            if(!item.moderated && item.authenticated) {
                data.numbers.active++
            }
        }


        // Push the new orders data
        const orders = md.filter(x => x.orderCount > 0)
        for(const order of orders) {
            data.orders.push({
                name: order.name,
                email: order.email,
                avatar: order.avatar,
                count: order.orderCount,
                deadline: order.orderEpoch,
                potency: order.orderPotency,
                groups: order.groupNames
                    .split(',').map(x => x.trim().toLowerCase())
                    .filter(x => x.length > 0)
            })
        }
        // End of push the new orders data

        // PUsh the chat data
        data.chats = md
            .filter(x => x.chatCount > 0)
            .map(x => {
                return {
                    name: x.name,
                    email: x.email,
                    avatar: x.avatar,
                    count: x.chatCount,
                    epoch: x.lastChatEpoch,
                    groups: x.groupNames
                    .split(',').map(x => x.trim().toLowerCase())
                    .filter(x => x.length > 0)
                }
            })
        // End of push the chat data

        // Push the discus count data
        // data.discuses = md
        //     .filter(x => x.discusCount > 0)
        //     .map(x => {
        //         return {
        //             name: x.name,
        //             email: x.email,
        //             avatar: x.avatar,
        //             count: x.discusCount,
        //             groups: x.groupNames
        //             .split(',').map(x => x.trim().toLowerCase())
        //             .filter(x => x.length > 0)
        //         }
        //     })
        data.discuses = []
        // End of push the new orders data

        // Push the order processing order (packing)
        data.processes = md
            .filter(x => x.dikemasCount > 0)
            .map(x => {
                return {
                    name: x.name,
                    email: x.email,
                    avatar: x.avatar,
                    count: x.dikemasCount,
                    deadline: x.dikemasEpoch,
                    potency: x.dikemasPotency,
                    groups: x.groupNames
                    .split(',').map(x => x.trim().toLowerCase())
                    .filter(x => x.length > 0)
                }
            })
        // End of push the processing order data

        // Push the shipping order data
        data.shippings = md
            .filter(x => x.dikirimCount > 0)
            .map(x => {
                return {
                    name: x.name,
                    email: x.email,
                    avatar: x.avatar,
                    count: x.dikirimCount,
                    potency: x.dikirimPotency,
                    groups: x.groupNames
                    .split(',').map(x => x.trim().toLowerCase())
                    .filter(x => x.length > 0)
                }
            })
        // End of push the shipping order data

        // Push the moderated store
        data.moderateds = md  
            .filter(x => x.moderated)
            .map(x => {
                return {
                    name: x.name,
                    email: x.email,
                    avatar: x.avatar,
                    groups: x.groupNames
                    .split(',').map(x => x.trim().toLowerCase())
                    .filter(x => x.length > 0)
                }
            })
        // End of push the moderated store

            
        // Push the has saldo accounts
        data.hasSaldo = md
            .filter(x => x.balance > 0)
            .map(x => {
                return {
                    name: x.name,
                    email: x.email,
                    avatar: x.avatar,
                    saldo: x.balance,
                    groups: x.groupNames
                    .split(',').map(x => x.trim().toLowerCase())
                    .filter(x => x.length > 0)
                }
            })
        // End of push the has saldo accounts


        // push the complaints data
        data.complaints = md
            .filter(x => x.complaintCount > 0)
            .map(x => {
                return {
                    name: x.name,
                    email: x.email,
                    avatar: x.avatar,
                    count: x.complaintCount,
                    potency: x.complaintPotency,
                    groups: x.groupNames
                    .split(',').map(x => x.trim().toLowerCase())
                    .filter(x => x.length > 0)
                }
            })
        // End of push the complaints data
        
        // Push the logouts data
        data.logouts = md 
            .filter(x => !x.authenticated)
            .map(x => {
                return { name: x.name, email: x.email, avatar: x.avatar, groups: x.groupNames
                    .split(',').map(x => x.trim().toLowerCase())
                    .filter(x => x.length > 0) }
            })
        // End of push the logouts data
        const jsonPayload = JSON.stringify(data)
        console.log({jsonPayload})
        const url = `${this.rootUrl}/backend/record`
        try {
            const response = await fetch(url, {
                method: "POST",
                body: jsonPayload,
                headers: this.headers
            })
            if(response.ok) {
                const data = await response.json()
                console.log(data)
            }
        } catch(err) { console.error(err.message || err) }
    }      
    
    
    /**
     * Change the alias of this device in public monitoring services.
     * 
     * Makes a request to public monitoring server with the device's machine ID and the new alias.
     * 
     * @param {string} alias - The new alias of this device.
     * @throws {Error} - If the request is not successful.
     */
    public async changeAlias(alias: string): Promise<void> {
        const url = `${this.rootUrl}/backend/changeAlias`
        const response = await fetch(url, {
            method: "POST",
            headers: this.headers,
            body: JSON.stringify({
                alias: alias.trim(),
                machineId: this.device.getMachineId()
            })
        })
        if(!response.ok) { throw new Error(`Error: ${response.status}`) }
        const data: any = await response.json()
        if(data.error) { throw new Error(data.msg) }
    }

    /**
     * Push a notification to the public monitoring server to be sent to the server's owner.
     * 
     * @param {string} msg - The message to be sent.
     * @throws {Error} - If the request is not successful.
     */
    public async push(msg: string): Promise<void> {
        if(!this.active) { return }
        try {
            const url = `${this.rootUrl}/notification/push`
            const response = await fetch(url, {
                method: "POST",
                headers: this.headers,
                body: JSON.stringify({
                    message: msg,
                    machineId: this.device.getMachineId()
                })
            })
            if(response.ok) {
                const data = await response.json()
                console.log(data)
            }
        } catch(err: any) {
            console.error(err.message || err)
        }
    }
}   