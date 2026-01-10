import {Request, Response} from 'express'
import Monitoring from '../../class/Monitoring'

export default function PMTypeSetActiveForAll(req: Request, res: Response, monitoring: Monitoring): void {
    try {
        const {state}: {
            state: boolean
        } = req.body
        monitoring.PMTypeSetActiveForAll(state)
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