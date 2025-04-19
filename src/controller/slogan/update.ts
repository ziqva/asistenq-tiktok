import { Request, Response } from "express";
import Slogan from "../../class/Slogan";

export default async function update(
  req: Request,
  res: Response,
  slogan: Slogan
): Promise<void> {
  try {
    const { name } = req.query;
    const { values } = req.body;
    await slogan.update(name.toString(), values);
    res.json({
      error: false,
      msg: null,
    });
  } catch (err) {
    res.json({
      error: true,
      msg: err?.toString(),
    });
  }
}
