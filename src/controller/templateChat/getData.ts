import { Request, Response } from "express";
import TemplateChat from "../../class/TemplateChat";

export default async function getData(
  req: Request,
  res: Response,
  templateChat: TemplateChat
): Promise<void> {
  try {
    const name = req.params.name as string;
    const data = await templateChat.getData(name);

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
