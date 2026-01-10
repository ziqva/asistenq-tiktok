import { Request, Response } from "express";
import PublicMonitoring from "../../class/PublicMonitoring";

export default async function activeToggle(req: Request, res: Response, publicMonitoring: PublicMonitoring) {
    try {
        await publicMonitoring.activeToggle()
        res.json({
            error: false,
            msg: null,
            data: { active: await publicMonitoring.isActive() }
        })
    } catch(err: any) {
        res.json({
            error: true,
            msg: err.message || err
        })
    }
}