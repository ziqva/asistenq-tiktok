import DeleteProduct from '../../../class/DeleteProduct'
import { Request, Response } from 'express'

export default async function getAvailableAccounts(req: Request, res: Response, deleteProduct: DeleteProduct): Promise<void> {
    try {   
        const search = req.query.search.toString()
        const data = await deleteProduct.getAvailableAccounts({search: search})
        res.json({
            error: false,
            msg: null,
            data
        })
    } catch(err) {
        res.json({
            error: true,
            msg: err.message || err
        })
    }
}