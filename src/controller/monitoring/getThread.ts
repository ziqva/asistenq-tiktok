import { Request, Response } from "express"
import Monitoring from '../../class/Monitoring'

export default async function getThread(req: Request, res: Response, monitoring: Monitoring): Promise<void> {
    try {
        const thread: number = await monitoring.getThread()
        res.json({
            error: false,
            msg: null,
            thread: thread
        })
    } catch(err) {
        res.json({
            error: true,
            msg: err.message || err
        })
    }
}