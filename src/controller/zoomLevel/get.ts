import ZoomLevel from "../../class/ZoomLevel";
import {Request, Response} from 'express'

export default async function get(req: Request, res: Response, zoomLevel: ZoomLevel): Promise<void> {
    try {
        res.json({
            error: false,
            data: {
                size: await zoomLevel.get() 
            },
            msg: null
        })
    } catch(err) {
        res.json({
            error: true,
            msg: err.message || err
        })
    }
}
