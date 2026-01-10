import {Request, Response} from 'express'
import Monitoring from '../../class/Monitoring'

export default async function getDelay(req: Request, res: Response, monitoring: Monitoring) {
    try {
        const delay: number = await monitoring.getDelay()
        res.json({
            error: false,
            msg: null,
            delay: {
                ms: delay
            }
        })
    } catch(err) {
        res.json({
            error: true,
            msg: err.message || err
        })        
    }
}