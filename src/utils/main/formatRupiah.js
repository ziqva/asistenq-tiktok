const formatter = new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR'
})

export default function formatRupiah(amount) {
  return formatter.format(amount).split(',')[0]
}