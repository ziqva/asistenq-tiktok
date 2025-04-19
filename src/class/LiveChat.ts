import { Socket } from 'socket.io'
import Setting from './Setting'

export default class LiveChat {
    private setting: Setting
    private active: boolean
    public sockets: Socket[]
    constructor({ setting }: {
        setting: Setting
    }) {
        this.setting = setting
        this.active = false
        this.initActive()
        this.sockets = []
    }

    public async sendSocketData(): Promise<void> {
        const data = {
            isActive: this.active
        }
        for(const socket of this.sockets) {
            try {
                socket.emit('live-chat-data', data)
            } catch(err) {}
        }
    }
    
    public removeSocket(socket: Socket): void {
        const i: number = this.sockets.findIndex(x => x === socket)
        if(i>=0) {
            this.sockets.splice(i, 1)
        }
    }

    private async initActive(): Promise<void> {
        this.active = (await this.setting.get('live_chat_enabled')) === 1
        await this.sendSocketData()
    }
    
    public async setActive(state: boolean): Promise<void> {
        await this.setting.set('live_chat_enabled', state ? 1 : 0)
        this.active = state
        await this.sendSocketData()
    }

    public isActive(): boolean {
        return this.active
    }
}