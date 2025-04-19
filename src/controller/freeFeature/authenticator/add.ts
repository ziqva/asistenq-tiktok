import Authenticator from '../../../class/Authenticator'
import {Request, Response} from 'express'

export default async function add(req: Request, res: Response, auth: Authenticator): Promise<void> {
    try {   
        const {authenticator, label, email} = req.body
        await auth.add({
            label: label,
            email: email,
            secret: authenticator,
            throwOnError: true
        })
        res.json({
            error: false,
            msg: null
        })
    } catch(err) {
        res.json({
            error: true,
            msg: err.message
        })
    }
}