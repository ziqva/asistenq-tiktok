import {Request, Response} from 'express'
import Account from '../../class/Account'

export default async function forceLogoutAllDevice(req: Request, res: Response, account: Account): Promise<void> {
    try {
        const {ids}: {
            ids: number[]
        } = req.body
        await account.forceLogoutAllDevice(ids)
        res.json({
            error: false,
            msg: null,
            data: null
        })
    } catch(err) {
        res.json({
            error: true,
            msg: err.message || err
        })
    }
}