import Notification from '../../class/Notification'
import { Request, Response } from 'express'

export default async function addNewRingtone(req: Request, res: Response, notification: Notification): Promise<void> {
    try {
        await notification.addNewRingtone()
        res.json({
            error: false,
            msg: null,
            data: []
        })
    } catch(err: any) {
        res.json({
            error: true,
            msg: err.message
        })
    }
}