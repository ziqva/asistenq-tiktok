import {Request, Response} from 'express'
import ProductUploader from '../../../class/ProductUploader'

export default async function stop(req: Request, res: Response, uploader: ProductUploader): Promise<void> {
    try {
        await uploader.stop()
        res.json({
            error: false,
            msg: null
        })
    } catch(err) {
        res.json({
            error: true,
            msg: err.message || err
        })
    }
}