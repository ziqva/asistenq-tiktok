import {Request, Response} from 'express'
import Monitoring from '../../class/Monitoring'

export default async function getPMTypeData(req: Request, res: Response, monitoring: Monitoring): Promise<void> {
    try {
        const data = monitoring.pmType
        res.json({
            error: false,
            msg: null,
            data
        })
    } catch(err) {
        res.json({
            error: true,
            msg: err.message || err
        })
    }
}