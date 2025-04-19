import { Request, Response } from "express";
import PublicMonitoring from "../../class/PublicMonitoring";

export default async function changeAlias(req: Request, res: Response, publicMonitoring: PublicMonitoring) {
    try {
        await publicMonitoring.changeAlias(req.body.alias)
        res.json({
            error: false,
            msg: null,
            data: []
        })
    } catch(err: any) {
        res.json({
            error: true,
            msg: err.message || err
        })
    }
}