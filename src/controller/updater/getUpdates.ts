import {Request, Response} from 'express'
import Updater from '../../class/Updater'

export default async function getUpdates(req: Request, res: Response, updater: Updater): Promise<void> {
    try {
        const updates: Update[] = await updater.getUpdates()
        res.json({
            error: false,
            msg: null,
            data: updates
        })        
    } catch(err) {  
        res.json({
            error: true,
            msg: err.message || err
        })
    }
}