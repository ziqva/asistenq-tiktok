import { Response, Request } from "express";
import ShippingManager from '../../class/ShippingManager'

export default async function applyActivateShippers(req: Request, res: Response, shippingManager: ShippingManager) {
    try {
        const {accountIds, activeIds}: {
            accountIds: number[],
            activeIds: number[]
        } = req.body as any
        await shippingManager.applyActiveShippers(accountIds, activeIds)
        res.json({
            error: false,
            msg: null,
            data: []
        })
    } catch(err: any) {
        res.json({
            error: true,
            msg: err.message
        })
    }
}