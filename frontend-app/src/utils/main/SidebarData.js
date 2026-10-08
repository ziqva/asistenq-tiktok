import { io } from 'socket.io-client';
import server from 'config/server';

export default class SidebarData {
    constructor() {
        this.base = (typeof window !== 'undefined' && window.location && (window.location.port === '9184' || window.location.port === '3000'))
            ? window.location.origin
            : (server.socket.base || 'http://localhost:9184');
        this.lastData = null;
        this.lastRefreshData = null;
        this._onData = () => {};
        this._onRefreshData = () => {};

        try {
            this.socket = io(this.base, {
                reconnection: true,
                reconnectionAttempts: 20,
                timeout: 10000,
            });

            this.socket.on('connect', () => {
                this.getData();
            });

            this.socket.on('main-sidebar-data', (data) => {
                this.lastData = data;
                if (typeof this._onData === 'function') {
                    this._onData(data);
                }
            });

            this.socket.on('refresh-account-data', (data) => {
                this.lastRefreshData = data;
                if (typeof this._onRefreshData === 'function') {
                    this._onRefreshData(data);
                }
            });

            if (this.socket.connected) {
                this.getData();
            }
        } catch (e) {
            console.error('Error creating socket in SidebarData:', e);
        }
    }

    get onData() {
        return this._onData;
    }

    set onData(handler) {
        this._onData = handler;
        if (this.lastData !== null && typeof handler === 'function') {
            handler(this.lastData);
        }
    }

    get onRefreshData() {
        return this._onRefreshData;
    }

    set onRefreshData(handler) {
        this._onRefreshData = handler;
        if (this.lastRefreshData !== null && typeof handler === 'function') {
            handler(this.lastRefreshData);
        }
    }

    getData() {
        if (this.socket) {
            if (this.socket.connected) {
                this.socket.emit('get-main-sidebar-data');
            } else {
                this.socket.once('connect', () => {
                    this.socket.emit('get-main-sidebar-data');
                });
            }
        }
    }
}
