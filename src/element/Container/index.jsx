import './container.scss'

export default function Container({children, className, id}) {
    return (
        <div className="main-container element">
            {children}
        </div>
    )
}