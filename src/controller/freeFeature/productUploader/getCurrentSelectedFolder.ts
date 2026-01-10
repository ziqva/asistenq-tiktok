import { Request, Response } from "express";
import ProductUploader from "../../../class/ProductUploader";

export default async function getCurrentSelectedFolder(
  req: Request,
  res: Response,
  productUploader: ProductUploader
): Promise<void> {
  try {
    res.json({
      error: false,
      data: await productUploader.getCurrentSelectedFolder(),
    });
  } catch (err) {
    res.json({
      error: true,
      msg: err?.toString(),
    });
  }
}
