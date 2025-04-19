import {Request, Response} from 'express'
import Setting from '../../class/Setting'

export default async function getValue(req: Request, res: Response, setting: Setting): Promise<void> {
    try{
        const {name} = req.body
        const value = await setting.get(name)
        res.json({
            error: false,
            msg: null,
            value
        })        
    } catch(err) {
        res.json({
            error: true,
            msg: err.message || err
        })
    }
}