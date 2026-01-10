import {Request, Response} from 'express'
import Authenticator from '../../../class/Authenticator'

export default async function update(req: Request, res: Response, auth: Authenticator): Promise<void> {
    try {
        const {id, label, email, secret} = req.body
        await auth.update({id, email, secret, label})
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