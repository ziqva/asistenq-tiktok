import ProductUploader from '../../../class/ProductUploader'
import {Request, Response} from 'express'

export default async function getAccount(req: Request, res: Response, productUploader: ProductUploader): Promise<void> {
    try {
        const {id}: {
            id: number | string
        } = req.body
        const data = await productUploader.getAccount(typeof id === 'number' ? id : parseInt(id))
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