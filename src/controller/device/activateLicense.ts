import {Response, Request} from 'express'
import Device from '../../class/Device'

export default async function activateLicense(req: Request, res: Response, device: Device): Promise<void> {
    try {
        const {license} = req.body
        await device.activateLicense(license)
        res.json({
            error: false,
            msg: null
        })
    } catch(err) {
        res.json({
            error: true,
            msg: err.message || err
        })
    }
}