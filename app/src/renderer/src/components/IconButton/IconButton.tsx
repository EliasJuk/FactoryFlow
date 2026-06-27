type IconButtonProps = {
  icon: React.ReactNode
  title: string
  onClick?: () => void
  color?: "blue" | "red" | "green"
}

function IconButton({
  icon,
  title,
  onClick,
  color = "blue"
}: IconButtonProps) {
  const colors = {
    blue: "bg-blue-600 hover:bg-blue-700",
    red: "bg-red-600 hover:bg-red-700",
    green: "bg-green-600 hover:bg-green-700"
  }

  return (
    <button
      title={title}
      onClick={onClick}
      className={`flex h-9 w-9 items-center justify-center rounded-lg text-white transition ${colors[color]}`}
    >
      {icon}
    </button>
  )
}

export default IconButton