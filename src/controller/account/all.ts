import {Request, Response} from 'express'
import Account from "../../class/Account";

/**
 * Executes the "all" function to retrieve all accounts based on the provided search query.
 *
 * @param {Request} req - The request object.
 * @param {Response} res - The response object.
 * @param {Account} account - The account object.
 * @return {Promise<void>} - Returns a Promise that resolves with void.
 */
export default async function all(req: Request, res: Response, account: Account) {
    try {
        const search: any = req.query?.search || ''
        const data: StructAccount[] = await account.all(search)
        res.json({
            error: false,
            query: req.query,
            data: data
        })
    } catch (err) {
        res.json({
            error: true,
            msg: err.message || err
        })
    }
}