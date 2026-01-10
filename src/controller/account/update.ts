import {Request, Response} from 'express'
import Account from '../../class/Account'

export default async function update(req: Request, res: Response, account: Account) {
    try {
        const {
            id,
            name,
            email,
            password,
            secretAutenticator,
            useAuthenticator,
            groupNames
        }: {
            id: number
            name: string
            email: string
            password: string
            secretAutenticator: string
            useAuthenticator: boolean
            groupNames: string
        } = req.body
        await account.update({
            name: name,
            id: id,
            email: email,
            useAuthenticator: useAuthenticator,
            secretAuthenticator: secretAutenticator,
            password: password,
            groupNames: groupNames
        })
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