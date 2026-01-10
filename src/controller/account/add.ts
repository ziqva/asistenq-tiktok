import {Request, Response} from 'express'
import Account from '../../class/Account'

export default async function add(req: Request, res: Response, account: Account) {
    try {
        const {name, email, password, authenticator, useAuthenticator, labels} = req.body
        await account.add({ name, email, password, authenticator, useAuthenticator, labels, authenticated: false, cookies: [] })
        res.json({
            error: false,
            msg: 'akun telah berhasil ditambahkan'
        })
    } catch(err) {
        res.json({
            error: true,
            msg: err.message || err
        })
    }
}
