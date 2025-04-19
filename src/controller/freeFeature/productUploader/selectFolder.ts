import ProductUploader from '../../../class/ProductUploader'
import { Request, Response } from 'express'

export default async function selectFolder(req: Request, res: Response, uploader: ProductUploader): Promise<void> {
    try {
        const folder = await uploader.selectFolder()
        res.json({
            error: false,
            msg: null,
            data: folder
        })
    } catch(err) {
        res.json({
            error: true,
            msg: err.message || err
        })
    }
}