import { Request, Response } from "express";
import Monitoring from "../../class/Monitoring";

export default async function pin(req: Request, res: Response, monitoring: Monitoring) {
    try {
        const {id} = req.body
        await monitoring.pin(id)
        res.json({
            error: false,
            msg: null,
            data: []
        })
    } catch(err) {
        res.json({
            error: true,
            msg: err?.toString(),
        })
    }
}