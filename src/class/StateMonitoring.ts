// @ts-ignore
import io from 'socket.io-client'
import { powerMonitor } from 'electron'

export default class StateMonitoring {
    private started: boolean = false
    private idleTimeLimit: number = 30 // 5 minute idle
    private socket: any
    private socketUrl: string = 'wss://asmon.ziqva.com'

    constructor() {
        
    }   

    public async start({ name, email, machineId }: {
        name: string,
        email: string,
        machineId: string
    }): Promise<void> {
        if(this.started) { return }
        this.started = true
        console.error('RUNNING FOR START THE STATE MONITORING')
        this.socket = io(this.socketUrl, {
            extraHeaders: {
                'x-state-client': '1',
                'x-email': email,
                'x-name': name,
                'x-machine-id': machineId
            },
            withCredentials: false,
            autoConnect: true,
            reconnection: true,
            transports: ['websocket']
        })

        this.socket.on('connect', () => {
            console.error('SOCKET IS CONNECTED!')
        })
        this.socket.on('connect_error', (err: any) => console.error(err))

        // @ts-ignore
        this.socket.on('connect_error', err => console.error(err))

        console.log(this.socket)

        // while(true) {
        //     const lastIdle = powerMonitor.getSystemIdleTime()
        //     await new Promise(r => setTimeout(r, 3000))
        // }
    }
}