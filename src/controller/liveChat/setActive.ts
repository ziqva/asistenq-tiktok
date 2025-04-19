import { Request, Response } from 'express'
import LiveChat from '../../class/LiveChat'

export default async function setActive(req: Request, res: Response, liveChat: LiveChat): Promise<void> {
   try { 
      const {state}: {
         state: boolean
      } = req.body
      await liveChat.setActive(state)
      res.json({
         error: false,
         msg: null,
         data: null
      })
   } catch(err) {
      res.json({
         error: true,
         msg: err?.toString()
      })
   }
}