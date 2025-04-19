import { Request, Response } from "express";
import Browser from "../../class/Browser";
import fs from 'fs'

export default async function extIcon(req: Request, res: Response, browser: Browser) {
    try {
        const id = req.query.id as string
        const extensions = await browser.extensions()
        const exists = extensions.find(x => x.id === id)
        if(!exists) { throw new Error('Extension is not installed!') }
        // const file = fs.readFileSync(exists.icon)
        res.sendFile(exists.icon)
    } catch(err: any) {
        res.json({
            error: true,
            msg: err.message
        })
    }
}