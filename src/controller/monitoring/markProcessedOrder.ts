import { Request, Response } from "express";
import Monitoring from "../../class/Monitoring";

export default function markProcessedOrder(req: Request, res: Response, monitoring: Monitoring): void {
    try {
        const { invoice } = req.body
        monitoring.markProcessedOrder(invoice)
        res.json({
            error: false,
            msg: null,
            data: []
        })
    } catch(err) {
        res.json({
            error: true,
            msg: err.message || err
        })
    }
}