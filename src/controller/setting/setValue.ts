import {Request, Response} from 'express'
import Setting from '../../class/Setting'

export default async function setValue(req: Request, res: Response, setting: Setting): Promise<void> {
    try {
        const {name, value} = req.body
        await setting.set(name, value)
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