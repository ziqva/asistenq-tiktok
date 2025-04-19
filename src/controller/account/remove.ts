import {Request, Response} from 'express'
import Account from '../../class/Account'

export default async function remove(req: Request, res: Response, account: Account) {
    try {
        const {ids} = req.body
        await account.remove({ids})
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
