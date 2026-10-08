import { io } from 'socket.io-client';
import server from 'config/server';

export default class MainData {
    constructor() {
        this.endpoint = (typeof window !== 'undefined' && window.location && (window.location.port === '9184' || window.location.port === '3000'))
            ? window.location.origin
            : (server.socket.base || 'http://localhost:9184');
        this.lastData = null;
        this._onMainData = () => {};

        try {
            this.socket = io(this.endpoint, {
                reconnection: true,
                reconnectionAttempts: 20,
                timeout: 10000,
            });

            this.socket.on('connect', () => {
                this.getMainData();
            });

            this.socket.on('monitoring-main-data', (data) => {
                this.lastData = data;
                if (typeof this._onMainData === 'function') {
                    this._onMainData(data);
                }
            });

            if (this.socket.connected) {
                this.getMainData();
            }
        } catch (e) {
            console.error('Error creating socket in MainData:', e);
        }
    }

    get onMainData() {
        return this._onMainData;
    }

    set onMainData(handler) {
        this._onMainData = handler;
        if (this.lastData !== null && typeof handler === 'function') {
            handler(this.lastData);
        }
    }

    getMainData() {
        if (this.socket) {
            if (this.socket.connected) {
                this.socket.emit('get-monitoring-main-data');
            } else {
                this.socket.once('connect', () => {
                    this.socket.emit('get-monitoring-main-data');
                });
            }
        }
    }
}
