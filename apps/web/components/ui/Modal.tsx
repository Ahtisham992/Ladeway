import * as React from "react"
import { cn } from "@/lib/utils"
import { X } from "lucide-react"

export interface ModalProps extends React.HTMLAttributes<HTMLDivElement> {
  isOpen: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
}

function Modal({ isOpen, onClose, title, children, className, ...props }: ModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm transition-default p-4">
      <div 
        className={cn("bg-white rounded-xl shadow-lg w-full max-w-lg overflow-hidden flex flex-col", className)}
        role="dialog"
        {...props}
      >
        <div className="flex items-center justify-between border-b p-4">
          {title ? <h2 className="text-lg font-semibold text-primary">{title}</h2> : <div></div>}
          <button 
            onClick={onClose}
            className="rounded-full p-1 hover:bg-secondary-100 transition-colors text-secondary-500"
          >
            <X size={20} />
          </button>
        </div>
        <div className="p-4">
          {children}
        </div>
      </div>
    </div>
  )
}

export { Modal }
