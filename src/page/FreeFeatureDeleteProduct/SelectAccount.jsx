import {
    Input,
    Button
} from 'antd'

export default function SelectAccount({
    accounts,
    onSearchValueChange,
    selected,
    onSelectedChange
}) {
    return (
        <div className="select-account">
            <div className="search-container">
                <Input 
                    placeholder='Cari'
                    className='search-field'
                    onChange={sender => onSearchValueChange(sender.target.value)}
                />
            </div>

            <div className="accounts">
                {accounts.map((account, index) => (
                    <div className="account"
                        key={index}
                        data-selected={selected === account}
                        data-id={account.id}
                    >
                        <img 
                            src={account.avatar} 
                            alt={account.name} 
                            className="avatar"
                            draggable={false}
                            />  
                        <div className="information">
                            <div className="name">{account.name}</div>
                            <div className="email">{account.email}</div>
                        </div>
                        <Button
                            size='small'
                            type='primary'
                            className='select-btn'
                            onClick={() => onSelectedChange(account)}
                        >{selected === account ? 'Terpilih' : 'Pilih'}</Button>
                    </div>
                ))}
            </div>
        </div>
    )
}