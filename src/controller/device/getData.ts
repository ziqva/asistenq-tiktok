import { Request, Response } from 'express'
import Device from '../../class/Device'

export default async function getData(req: Request, res: Response, device: Device): Promise<void> {
    try {
        const data = await device.getData()
        res.json({
            error: false,
            msg: null,
            data: data
        })
    } catch(err) {
        res.json({
            error: true,
            msg: err.message || err
        })
    }
}