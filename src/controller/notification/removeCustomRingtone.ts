import { Request, Response } from "express";
import Notification from '../../class/Notification'

/**
 * Removes a custom ringtone from the list of custom ringtones and deletes the corresponding file.
 *
 * @param {Request} req - The request object containing the body with the name of the custom ringtone to remove.
 * @param {Response} res - The response object used to send the result of the operation.
 * @param {Notification} notification - The notification object used to remove the custom ringtone.
 * @return {Promise<void>} A promise that resolves when the custom ringtone is successfully removed.
 */
export default async function removeCustomRingtone(req: Request, res: Response, notification: Notification): Promise<void> {
    try {
        const { name } = req.body
        await notification.removeCustomRingtone(name)
        await res.json({
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