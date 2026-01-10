import MainDataColumn from '../../class/MainDataColumn'
import { Request, Response } from 'express'

export default async function setActive(req: Request, res: Response, mainDataColumn: MainDataColumn): Promise<void> {
    try {
        const {name, index, state}: {
            name: string,
            index: number,
            state: boolean
        } = req.body
        await mainDataColumn.setIsActive(index, name, state)
        res.json({
            error: false,
            msg: null
        })
    }catch(err) {
        res.json({
            error: true,
            msg: err.message || err
        })
    }
}