/**
 * Modal Component
 */
interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl'
}

export default function Modal({ isOpen, onClose, title, children, size = 'md' }: ModalProps) {
  if (!isOpen) return null

  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl'
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className={`bg-white rounded-xl shadow-xl w-full ${sizeClasses[size]} relative z-10 max-h-[90vh] overflow-auto`}>
        {title && (
          <div className="flex justify-between items-center p-4 border-b">
            <h3 className="font-semibold">{title}</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
          </div>
        )}
        <div className="p-4">{children}</div>
      </div>
    </div>
  )
}
