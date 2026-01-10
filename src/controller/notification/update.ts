import {Request, Response} from 'express'
import Notification from '../../class/Notification'

export default async function update(req: Request, res:  Response, notification: Notification): Promise<void> {
    try {
        const {soundActive, toastActive, soundVolume, soundFilename}: {
            soundActive: boolean
            toastActive: boolean
            soundVolume: number
            soundFilename: string
        } = req.body
        await notification.update({
            soundActive,
            toastActive,
            soundVolume,
            soundFilename,
            customList: []
        })
        res.json({
            error: false,
            msg: null,
            data: null
        })
    } catch(err) {
        res.json({
            error: true,
            msg: err.message || err
        })
    }
}