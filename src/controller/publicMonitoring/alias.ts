import { Request, Response } from "express";
import PublicMonitoring from "../../class/PublicMonitoring";

export default async function alias(req: Request, res: Response, publicMonitoring: PublicMonitoring) {
    try {
        const alias = await publicMonitoring.getAlias()
        res.json({
            error: false,
            msg: null,
            data: { alias }
        })
    } catch(err: any) {
        res.json({
            error: true,
            msg: err.message || err,
            data: []
        })
    }
}