import { Request, Response } from 'express'
import LiveChat from '../../class/LiveChat'

export default function isActive(req: Request, res: Response, liveChat: LiveChat): void {
   res.json({
      error: false,
      msg: null,
      data: liveChat.isActive()
   })
}