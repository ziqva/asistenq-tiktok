import { Request, Response } from "express";
import TemplateChat from "../../class/TemplateChat";

export default async function remove(
  req: Request,
  res: Response,
  templateChat: TemplateChat
): Promise<void> {
  try {
    const { name } = req.params;
    const { chat } = req.body;
    await templateChat.remove(name, chat);
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
