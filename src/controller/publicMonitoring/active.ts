import { Request, Response } from "express";
import PublicMonitoring from "../../class/PublicMonitoring";

export default async function active(req: Request, res: Response, publicMonitoring: PublicMonitoring) {
    try {
        const active = await publicMonitoring.isActive()
        res.json({
            error: false,
            msg: null,
            data: { active }
        })
    } catch(err: any) {
        res.json({
            error: true,
            msg: err.message || err,
            data: null
        })
    }
}