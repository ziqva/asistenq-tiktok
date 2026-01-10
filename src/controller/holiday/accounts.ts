import { Request, Response } from "express";
import Holiday from "../../class/Holiday";

export default async function accounts(
  req: Request,
  res: Response,
  holiday: Holiday
): Promise<void> {
  try {
    const { search } = req.params;
    const { group }: any = req.query;
    res.json({
      error: false,
      msg: null,
      data: {
        accounts: await holiday.accounts(search || "", group || "all"),
      },
    });
  } catch (err) {
    res.json({
      error: true,
      msg: err?.toString(),
    });
  }
}
