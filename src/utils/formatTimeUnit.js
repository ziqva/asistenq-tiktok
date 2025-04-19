const fromMs = number => {
    const formats = [
        { unit: 'ms', min: 0, max: 1000 },
        { unit: 'detik', min: 1000, max: 60000 },
        { unit: 'menit', min: 60000, max: 3.6e+6 },
        { unit: 'jam', min: 3.6e+6, max: 8.64e+7 },
        { unit: 'hari', min: 8.64e+7, max: Infinity }
    ]
    for(const format of formats) {
        if(number >= format.min && number <= format.max) {
            const value = format.unit === 'ms' ? parseInt(number/format.min) : (number/format.min).toFixed(1)
            return `${isNaN(value) ? number : value} ${format.unit}`
        }
    }
}   

export default {fromMs}