import {Request, Response} from 'express'
import Group from '../../class/Group'

export default async function massUpdate(req: Request, res: Response, group: Group): Promise<void> {
    try {
        const {ids, groupNames}: {
            ids: number[],
            groupNames: string
        } = req.body
        await group.massUpdate({ids, groupNames})
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