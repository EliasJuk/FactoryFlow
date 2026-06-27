type CardProps = {
  children: React.ReactNode
}

function Card({ children }: CardProps) {
  return (
    <section className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg">
      {children}
    </section>
  )
}

export default Card