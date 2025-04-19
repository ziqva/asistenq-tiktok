export default function TypingUsers({users}) {
    return (
        <div className="typing-users">
            {users.map((user, index) => (
                <div className="text" key={index}><b>{user.userName}</b> sedang mengetik...</div>
            ))}
        </div>
    )
}