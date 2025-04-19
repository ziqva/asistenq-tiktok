import {Request, Response} from 'express'
import Group from '../../class/Group'

export default async function setActiveForAll(req: Request, res: Response, group: Group) {
    try {
        const {state}: {state: boolean} = req.body
        group.setActiveForAll(state)
        res.json({
            error: false,
            msg: null
        })
    } catch(error) {
        res.json({
            error: true,
            msg: error.message || error
        })
    }
}