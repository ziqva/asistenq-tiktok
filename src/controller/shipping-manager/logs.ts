import { Request, Response } from "express";
import ShippingManager from '../../class/ShippingManager';

export default function logs(req: Request, res: Response, shippingManager: ShippingManager) {
    res.json(shippingManager.logs)
}