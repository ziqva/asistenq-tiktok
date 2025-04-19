import TemplateChat from "../../class/TemplateChat";
import { Request, Response } from "express";

export default async function set(
  req: Request,
  res: Response,
  templateChat: TemplateChat
): Promise<void> {
  try {
    const name: string = req.params.name as string;
    const chats: string[] = req.body.chats;
    await templateChat.set(name, chats);
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
