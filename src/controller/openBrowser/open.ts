import {Request, Response} from 'express'
import OpenBrowser from '../../class/OpenBrowser'

export default async function open(req: Request, res: Response, openBrowser: OpenBrowser) {
    try {
        const {id, targetUrl} = req.body
        await openBrowser.open(id, targetUrl)
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