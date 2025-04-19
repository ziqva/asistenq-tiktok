import { Request, Response } from "express";
import Browser from "../../class/Browser";

export default async function addExtension(req: Request, res: Response, browser: Browser) {
    try {
        const { url } = req.body
        console.log(url)
        await browser.addExtension(url)
        res.json({
            error: false,
            msg: null,
            data: []
        })
    } catch(err:  any) {
        res.json({
            error: true,
            msg: err.message
        })
    }
}