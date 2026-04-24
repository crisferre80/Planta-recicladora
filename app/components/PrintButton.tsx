'use client'

import { PrinterIcon } from '@heroicons/react/24/outline'

interface PrintButtonProps {
  label?: string
  className?: string
}

export default function PrintButton({ label = 'Imprimir Informe', className }: PrintButtonProps) {
  return (
    <button
      onClick={() => window.print()}
      className={
        className ||
        'no-print inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 hover:border-slate-300 transition-all'
      }
    >
      <PrinterIcon className="w-4 h-4 text-slate-500" />
      {label}
    </button>
  )
}
