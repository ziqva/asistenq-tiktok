import { useEffect, useState } from 'react'
import axios from 'axios'

export default function News() {
    const [text, setText] = useState(null)

    const loadNews = () => {
            // Fetch marquee
            const url = 'https://admin.ziqva.com/news/get'
            axios.get(url)
            .then(({data}) => {
                if(data.length > 0) {
                    const selected = data[Math.floor(Math.random() * data.length)]
                    setText(selected.message)
                }
            })
            .catch(err => {
                console.error(err)
        }, [])
    }
    
    useEffect(() => {
        loadNews()
    }, [])

    return typeof text === 'string' && (
        <div className="news-container">
            <marquee className="text">{text}</marquee>
        </div>
    )
}