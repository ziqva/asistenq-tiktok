import { Request, Response } from 'express'
import Authenticator from '../../../class/Authenticator'

export default async function sync(req: Request, res: Response, authenticator: Authenticator): Promise<void> {
    try {
        await authenticator.sync()
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