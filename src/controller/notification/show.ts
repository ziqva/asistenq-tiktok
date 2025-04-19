import Notification from "../../class/Notification";
import {Request, Response} from 'express'
import Setting from '../../class/Setting'

export default async function show(req: Request, res: Response, notification: Notification, setting: Setting): Promise<any> {
    try {
        const {title, message, from}: {
            title: string,
            message: string,
            from: string | null | undefined
        } = req.body
        if(from === 'live_chat-new-message') {
            const active: any = await setting.get('notification_from_chat')
            if(active != 1) { 
                return res.json({
                    error: false,
                    msg: 'inactive the notification state'
                })
            }
        }
        notification.show({
            title: title,
            message
        })
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