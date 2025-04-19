import { Request, Response } from "express";
import Browser from '../../class/Browser'

export default async function extensions(req: Request, res: Response, browser: Browser) {
    try {
        const data = await browser.extensions()
        res.json({
            error: false,
            msg: null,
            data
        })
    } catch(err: any) {
        res.json({
            error: true,
            msg: err.message
        })
    }
}