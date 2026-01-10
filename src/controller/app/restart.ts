import {Request, Response} from 'express'
import App from '../../class/App'

export default async function restart(req: Request, res: Response, app: App) {
  try {
    await app.restart()
    res.end(200)
  } catch(error) {
    res.json({
      error: true,
      msg: error.message || error
    })
  }
}
