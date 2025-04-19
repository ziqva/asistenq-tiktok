import { Request, Response } from 'express'
import Account from '../../class/Account'

export default async function get(req: Request, res: Response, account: Account) {
    try {
        const { id }: {id: number} = req.body
        const exists: boolean = await account.exists(id)
        if(!exists) { throw new Error(`Akun tidak ditemukan: ${id}`) }
        const result: StructAccount = await account.get(id)
        res.json({
            error: false,
            msg: null,
            data: result
        })
    } catch(err) {
        res.json({
            error: true,
            msg: err.message || err
        })
    }
}