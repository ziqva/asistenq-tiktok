import {Request, Response} from 'express'
import Notification from '../../class/Notification'

export default async function get(req: Request, res: Response, notification: Notification): Promise<void> {
    try {
        res.json({
            error: false,
            msg: null,
            data: await notification.get()
        })
    } catch(err) {
        res.json({
            error: true,
            msg: err.message || err
        })
    }
}