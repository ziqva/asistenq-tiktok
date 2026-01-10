import {Request, Response} from 'express'
import Group from '../../class/Group'

export default function data(req: Request, res: Response, group: Group) {
    try {
        res.json({
            groups: group.groups,
            activeForAll: group.activeForAll,
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