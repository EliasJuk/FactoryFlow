type TableProps = {
  children: React.ReactNode
}

function Table({ children }: TableProps) {
  return (
    <div className="overflow-hidden rounded-xl bg-white shadow">
      <table className="min-w-full">
        {children}
      </table>
    </div>
  )
}

export default Table