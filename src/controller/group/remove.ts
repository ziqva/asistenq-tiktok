import {Request, Response} from 'express'
import Group from '../../class/Group'

export default async function remove(req: Request, res: Response, group: Group): Promise<void> {
    try {
        const {name}: {name: string} = req.body
        await group.remove(name)
        res.json({
            error: false,
            msg: null
        })
    } catch(er) {
        res.json({
            error: true,
            msg: er.message || er
        })
    }
}