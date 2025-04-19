import {Request, Response} from 'express'
import App from '../../class/App'

export default function openExternalLink(req: Request, res: Response, app: App): void {
    try {
        const url = req.body?.url
        if (url) {
            app.openExternalLink(url)
        }
        res.json({
            error: false,
            msg: null,
            success: true
        })
    } catch (err) {
        res.json({
            error: true,
            msg: err.message || err
        })
    }
}