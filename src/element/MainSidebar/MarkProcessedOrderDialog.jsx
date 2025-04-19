import { Dialog, DialogActions, DialogContent, DialogTitle } from "@mui/material";
import { useEffect, useState } from "react";
import icon from 'static/icon/processing-box.png'
import { Button, Input } from 'antd'
import markProcessedOrder from "utils/order/markProcessedOrder";

const tokopediaInvoicePattern = /^INV\/\d{8}\/MPL\/\d+$/;


export default function MarkProcessedOrderDialog({ open, onClose }) {
    const [invoice, setInvoice] = useState('')
    const [valid, setValid] = useState(true)
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        if(invoice.length < 1) {
            return setValid(true)
        }

        setValid(tokopediaInvoicePattern.test(invoice))
    }, [invoice])

    useEffect(() => {
        setInvoice('')
    }, [open])

    const submit = () => {
        setLoading(true)
        markProcessedOrder(invoice)
            .catch(err => {})
            .finally(() => {
                onClose()
                setLoading(false)
            })
    }

    return (
        <Dialog
            open={open}
            onClose={onClose}
        >
            <DialogTitle className="mark-processed-dialog-title">
                <div className="flex">
                    <img src={icon} alt="Processed Order Icon" />
                    <div className="text">Tandai Pesanan Dikemas</div>
                </div>
            </DialogTitle>
            <DialogContent className="mark-processed-dialog-content">
                <Input 
                    placeholder="Masukkan Invoice"
                    autoFocus
                    value={invoice}
                    onChange={e => setInvoice(e.target.value.trim().toUpperCase())}
                    status={valid ? '' : 'error'}
                    disabled={loading}
                />
                {!valid && (
                    <div className="error-text">• Invoice tidak valid</div>
                )}
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}
                    type='primary'
                    danger
                    disabled={loading}
                >Batal</Button>
                <Button
                    disabled={!valid || invoice.length < 1}
                    type='primary'
                    loading={loading}
                    onClick={submit}
                >Submit</Button>
            </DialogActions>
        </Dialog>
    )
}