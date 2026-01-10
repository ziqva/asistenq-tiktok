import { Request, Response } from "express";
import OperationalSchedule from "../../class/OperasionalSchedule";

export default async function accounts(
  req: Request,
  res: Response,
  operationalSchedule: OperationalSchedule
): Promise<void> {
  try {
    const { search } = req.params;
    const { group }: any = req.query;
    res.json({
      error: false,
      msg: null,
      data: {
        accounts: await operationalSchedule.accounts(
          search || "",
          group || "all"
        ),
      },
    });
  } catch (err) {
    res.json({
      error: true,
      msg: err?.toString(),
    });
  }
}
