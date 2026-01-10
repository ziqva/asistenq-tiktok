import {Request, Response} from 'express'
import Monitoring from '../../class/Monitoring'

export default function PMTypeSetActive(req: Request, res: Response, monitoring: Monitoring): void {
    try {
        const {name, state}: {
            name: string,
            state: boolean
        } = req.body
        monitoring.PMTypeSetActive(name, state)
        res.json({
            error: false,
            msg: null
        })
    } catch(err) {
        res.json({
            error: false,
            msg: err.message || err
        })
    }
}