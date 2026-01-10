import Slogan from "../../class/Slogan";
import { Request, Response } from "express";

export default async function detail(
  req: Request,
  res: Response,
  slogan: Slogan
): Promise<void> {
  try {
    const data = await slogan.detail();
    res.json({
      error: false,
      msg: null,
      data,
    });
  } catch (err) {
    res.json({
      error: true,
      msg: err?.toString(),
    });
  }
}
