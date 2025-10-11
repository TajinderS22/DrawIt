
export default function ChatLayout ({children}:Readonly<{
    children:React.ReactNode
}>){
    return(
        <div className="min-h-screen dark:bg-black bg-amber-50">
            {children}
        </div>
    )

}