import Account from '../../class/Account'
import {Request, Response} from 'express'

export default async function imports(req: Request, res: Response, account: Account): Promise<void> {
    try {
        await account.imports(req.file.buffer)
        res.json({
            error: false,
            msg: null,
        })
    } catch(err) {
        res.json({
            error: true,
            msg: err.message || err
        })
    }
}