import { Request, Response } from "express";
import ShippingManager from "../../class/ShippingManager";

export default async function getShippers(
  req: Request,
  res: Response,
  shippingManager: ShippingManager,
) {
  try {
    const data = await shippingManager.getShippers();
    res.json({
      error: false,
      msg: null,
      data,
    });
  } catch (err: any) {
    res.json({
      error: true,
      msg: err.message,
    });
  }
}
