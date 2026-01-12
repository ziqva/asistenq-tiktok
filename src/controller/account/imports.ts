import Account from '../../class/Account'
import type { Request, Response } from 'express-serve-static-core'

type MulterRequest = Request<any, any, any, any> & {
    file?: {
        buffer: Buffer
    }
}

export default async function imports(req: MulterRequest, res: Response, account: Account): Promise<void> {
    try {
        if (!req.file?.buffer) {
            throw new Error('No file uploaded')
        }
        await account.imports(req.file.buffer)
        res.json({
            error: false,
            msg: null,
        })
    } catch(err) {
        res.json({
            error: true,
            msg: err.message || err
        })
    }
}