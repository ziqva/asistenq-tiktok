export default function Account({data}) {
    return (
        <div className="account-container"
            data-id={data.id}
        >
            <img 
                src={data.avatar}
                alt={data.name}
                title={data.id}
                className='avatar'
            />

            <div className="personal-information">
                <div className="name">{data.name}</div>
                <div className="email">{data.email}</div>
            </div>
        </div>
    )
}