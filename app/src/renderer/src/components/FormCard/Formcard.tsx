type FormCardProps = {
  children: React.ReactNode
}

function FormCard({ children }: FormCardProps) {
  return (
    <div className="rounded-xl bg-white p-6 shadow">
      {children}
    </div>
  )
}

export default FormCard