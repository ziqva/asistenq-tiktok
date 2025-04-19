import { Request, Response } from "express";
import Browser from "../../class/Browser";

export default async function removeExtension(req: Request, res: Response, browser: Browser) {
    try {
        const { id } = req.body
        await browser.removeExtension(id)
        res.json({
            error: false,
            msg: null,
            data: []
        })
    } catch(err) {
        res.json({
            error: true,
            msg: err.message
        })
    }
}