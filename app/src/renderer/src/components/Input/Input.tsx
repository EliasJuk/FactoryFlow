import { ChangeEvent } from "react"

type InputProps = {
  label: string
  type?: string
  placeholder?: string
  value?: string
  disabled?: boolean
  onChange?: (event: ChangeEvent<HTMLInputElement>) => void
}

function Input({
  label,
  type = "text",
  placeholder,
  value,
  disabled = false,
  onChange
}: InputProps) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-slate-300">
        {label}
      </label>

      <input
        type={type}
        placeholder={placeholder}
        value={value}
        disabled={disabled}
        onChange={onChange}
        className="
          w-full
          rounded-lg
          border
          border-slate-700
          bg-slate-800
          px-4
          py-3
          text-white
          placeholder:text-slate-500
          outline-none
          transition
          focus:border-orange-500
          disabled:cursor-not-allowed
          disabled:opacity-50
        "
      />
    </div>
  )
}

export default Input