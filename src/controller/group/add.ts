import {Request, Response} from 'express'
import Group from '../../class/Group'

export default async function add(req: Request, res: Response, group: Group): Promise<void> {
    try {
        const {name}: {name: string} = req.body
        await group.add(name)
        res.json({
            error: false,
            msg: null
        })
    } catch(err) {
        res.json({
            error: true,
            msg: err.message || err
        })
    }
}