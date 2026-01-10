import { Request, Response } from "express";
import Slogan from "../../class/Slogan";

export default async function accounts(
  req: Request,
  res: Response,
  slogan: Slogan
): Promise<void> {
  try {
    const { search } = req.params;
    const { group }: any = req.query;
    res.json({
      error: false,
      msg: null,
      data: {
        accounts: await slogan.accounts(search || "", group || "all"),
      },
    });
  } catch (err) {
    res.json({
      error: true,
      msg: err?.toString(),
    });
  }
}
