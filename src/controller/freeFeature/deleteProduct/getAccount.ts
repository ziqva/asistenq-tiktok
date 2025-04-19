import {Request, Response} from 'express'
import DeleteProduct from '../../../class/DeleteProduct'

export default async function getAccount(req: Request, res: Response, deleteProduct: DeleteProduct): Promise<void> {
    try {
        const {id}: {
            id: number
        } = req.body
        const data = await deleteProduct.getAccount(id)
        res.json({
            error: false,
            msg: null,
            data: data
        })
    } catch(err) {
        res.json({
            error: true,
            msg: err.message || err
        })
    }
}