type ButtonProps = {
  children: React.ReactNode
  type?: "button" | "submit" | "reset"
  disabled?: boolean
  onClick?: () => void
}

function Button({
  children,
  type = "button",
  disabled = false,
  onClick
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className="
        w-full
        rounded-lg
        bg-orange-500
        px-4
        py-3
        font-semibold
        text-white
        transition
        hover:bg-orange-600
        disabled:cursor-not-allowed
        disabled:bg-slate-700
        disabled:text-slate-400
      "
    >
      {children}
    </button>
  )
}

export default Button