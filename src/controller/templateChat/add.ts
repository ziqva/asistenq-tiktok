import { Request, Response } from "express";
import TemplateChat from "../../class/TemplateChat";

export default async function add(
  req: Request,
  res: Response,
  templateChat: TemplateChat
): Promise<void> {
  try {
    const { name } = req.params;
    const { chat } = req.body;
    await templateChat.add(name, chat);
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
