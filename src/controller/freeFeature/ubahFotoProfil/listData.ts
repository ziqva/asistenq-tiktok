import { Request, Response } from "express";
import BulkUpdateProfilePhoto from "../../../class/BulkUpdateProfilePhoto";

export default async function listData(req: Request, res: Response, bulkUpdateProfilePhoto: BulkUpdateProfilePhoto) {
    try {
        const { selectedIds, folder } = req.body
        const data = await bulkUpdateProfilePhoto.getListData({accountIds: selectedIds, folder})
        res.json({
            error: false,
            msg: null,
            data
        })
    } catch(err: any) { 
        res.json({
            error: true,
            msg: err.message
        })
    }
}