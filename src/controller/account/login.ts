import Account from '../../class/Account'
import {Response, Request} from 'express'

export default async function login(req: Request, res: Response, account: Account): Promise<void> {
    try {
        const {ids} = req.body
        await account.login(ids)
        res.json({
            error: false,
            msg: 'Akun telah berhasil login'
        })
    } catch(err) {
        res.json({
            error: true,
            msg: err.message || err
        })
    }
}