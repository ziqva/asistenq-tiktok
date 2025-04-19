import {Request, Response} from 'express'
import Authenticator from '../../../class/Authenticator'

export default async function remove(req: Request, res: Response, authenticator: Authenticator): Promise<void> {
    try {
        const {ids} = req.body
        for(const id of ids) {
            await authenticator.remove(id)
        }
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