import { Request, Response } from "express";
import Group from "../../../src/class/Group";

export default async function updateSingle(
  req: Request,
  res: Response,
  group: Group
): Promise<void> {
  try {
    let {
      before,
      after,
    }: {
      before: string;
      after: string;
    } = req.body;
    after = after.trim();
    before = before.trim();

    const exists = await group.exists(before);
    if (!exists) throw new Error("Group tidak ditemukan");
    await group.updateSingle(before, after);
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
