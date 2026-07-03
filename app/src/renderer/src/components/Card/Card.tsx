type CardProps = {
  children: React.ReactNode
  className?: string
}

function Card({
  children,
  className = ""
}: CardProps) {
  return (
    <section
      className={`w-full max-w-md rounded-2xl bg-white p-8 shadow-lg ${className}`}
    >
      {children}
    </section>
  )
}

export default Card