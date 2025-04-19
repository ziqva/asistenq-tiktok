import { Request, Response } from "express";
import { dialog } from 'electron'

export default async function selectFolder(req: Request, res: Response) {
    try {
        const result = await dialog.showOpenDialog({
            properties: ['openDirectory'],
            title: "Pilih folder foto profil",
        })
        if(result.canceled || result.filePaths.length < 1) {
            throw new Error("Aksi dibatalkan oleh pengguna")
        }
        res.json({
            error: false,
            msg: null,
            data: result.filePaths[0]
        })
    } catch(err: any) {
        res.json({
            error: true,
            msg: err.message
        })
    }
}