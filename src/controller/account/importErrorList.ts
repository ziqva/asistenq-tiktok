import { Request, Response } from "express";
import Account from "../../class/Account";

export default function importErrorList(req: Request, res: Response, account: Account) {
    let txt: string = ''
    let i = 1
    for (const item of account.accountImportErrors) {
        txt += `${i}. ${item.name}<${item.email}> - ${item.reason}\n`
        i++
    }
    res.setHeader('content-type', 'text/plain')
    if (account.accountImportErrors.length < 1) {
        res.send(`Tidak ada kesalahan saat import akun 🎉🎉`)
        return
    }

    res.send(txt)
}