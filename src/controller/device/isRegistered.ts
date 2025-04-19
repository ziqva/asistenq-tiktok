import { Request, Response } from 'express'
import Device from '../../class/Device'

export default async function isRegistered(req: Request, res: Response, device: Device): Promise<void> {
    try {
        const registered: boolean = await device.refreshIsRegistered()
        res.json({
            error: false,
            registered: registered
        })
    } catch(err) {
        res.json({
            error: true,
            msg: err.message || err
        })
    }
}
