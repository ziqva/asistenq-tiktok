import {Request,  Response} from 'express'
import ZoomLevel from '../..//class/ZoomLevel'

export default async function set(req: Request, res: Response, zoomLevel: ZoomLevel) {
    try {
        const {size}: {size: number} = req.body
        await zoomLevel.set(size)
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