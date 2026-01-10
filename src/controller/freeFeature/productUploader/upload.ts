import {Request, Response} from 'express'
import ProductUploader from '../../../class/ProductUploader'

export default async function upload(req: Request, res: Response, productUploader: ProductUploader): Promise<void> {
    try {
        const {
            id,
            maxFile,
            afterUploaded,
            dirPath
        } = req.body
        productUploader.upload({
            id: parseInt(id),
            maxFile: parseInt(maxFile),
            afterUploaded: afterUploaded,
            dirPath: dirPath
        })
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