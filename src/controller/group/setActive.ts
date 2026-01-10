import { Request, Response } from 'express'
import Group from '../../class/Group'

export default async function setActive(req: Request, res: Response, group: Group) {
    try {
        const {name, state}: {
            name: string,
            state: boolean
        } = req.body
        await group.setActive(name, state)
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