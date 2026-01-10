import {Request, Response} from 'express'
import Updater from '../../class/Updater'

export default async function update(req: Request, res: Response, updater: Updater): Promise<void> {
    try {
        const {zip_file}: {zip_file: string} = req.body
        await updater.update({zipFile: zip_file})
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