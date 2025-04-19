import {Request, Response} from 'express'
import Account from '../../class/Account'
import Monitoring from '../../class/Monitoring'

export default async function refresh(req: Request, res: Response, monitoring: Monitoring, account: Account) {
    try {
        const {id} = req.body
        const acc: StructAccount = await account.get(id)
        await monitoring.refresh(acc, async () => {
            await monitoring.sendMainData()
            res.json({
                error: false,
                msg: null
            })
        }, true)
    } catch(err) {
        res.json({
            error: true,
            msg: err.message || err
        })
    }
}