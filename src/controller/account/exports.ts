import {Request, Response} from 'express'
import Account from '../../class/Account'

export default async function _exports(req: Request, res: Response, account: Account) {
    try {
        const {type, selected} = req.body
        const resBuffer: Buffer = await account._exports({ type, selectedAccounts: selected })
        res.json({
            error: false,
            msg: null
        })
    } catch(error) {
        res.json({
            error: true,
            msg: error.message || error
        })
    }
}