import { ReactNode } from "react"

type MenuCardProps = {
  title: string
  description: string
  icon: ReactNode
  onClick?: () => void
}

function MenuCard({
  title,
  description,
  icon,
  onClick
}: MenuCardProps) {
  return (
    <button
      onClick={onClick}
      className="
        flex
        flex-col
        items-center
        justify-center
        gap-4
        rounded-2xl
        bg-white
        p-8
        shadow
        transition-all
        duration-200
        hover:-translate-y-1
        hover:shadow-xl
      "
    >
      <div className="text-blue-600">
        {icon}
      </div>

      <div className="text-center">
        <h2 className="text-lg font-semibold text-slate-800">
          {title}
        </h2>

        <p className="mt-1 text-sm text-slate-500">
          {description}
        </p>
      </div>
    </button>
  )
}

export default MenuCard