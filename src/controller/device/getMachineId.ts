import Device from '../../class/Device'
import {Request, Response} from 'express'

export default async function getMachineId(req: Request, res: Response, device: Device): Promise<void> {
    try {
        res.json({
            error: false,
            msg: null,
            data: {
                machineId: device.getMachineId()
            }
        })
    } catch(err) {
        res.json({
            error: false,
            msg: err?.toString()
        })
    }
}