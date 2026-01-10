import {Request, Response} from 'express'
import * as fs from 'fs'
import * as path from 'path'

const frontendPath: string = path.join(__dirname, 'frontend')
const indexFile: string = path.join(frontendPath, 'index.html')

export default function renderFrontend(req: Request, res: Response) {
    const targetRender: string = path.join(frontendPath, req.path)
    const existsFile = fs.existsSync(targetRender) && fs.statSync(targetRender).isFile()
    if(existsFile) {
        res.sendFile(targetRender)
    } else {
        res.sendFile(indexFile)
    }
}