'use client'

import { Button } from './ui/button'
import { Download } from 'lucide-react'
import { useState } from 'react'
import { MonoText } from './ui/mono-text'

interface ExportButtonProps {
  data: unknown[]
  filename?: string
  format?: 'csv' | 'json'
}

export function ExportButton({
  data,
  filename = 'export',
  format = 'csv',
}: ExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false)

  const handleExport = async () => {
    setIsExporting(true)
    try {
      if (format === 'csv') {
        if (data.length === 0) return

        const headers = Object.keys(data[0] as object)
        const csvContent = [
          headers.join(','),
          ...data.map((row) =>
            headers.map((header) => {
              const value = (row as Record<string, unknown>)[header]
              const stringValue = String(value ?? '')
              if (stringValue.includes(',') || stringValue.includes('"')) {
                return `"${stringValue.replace(/"/g, '""')}"`
              }
              return stringValue
            }).join(',')
          ),
        ].join('\n')

        const blob = new Blob([csvContent], { type: 'text/csv' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${filename}.csv`
        a.click()
        URL.revokeObjectURL(url)
      } else {
        const jsonContent = JSON.stringify(data, null, 2)
        const blob = new Blob([jsonContent], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${filename}.json`
        a.click()
        URL.revokeObjectURL(url)
      }
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <Button
      variant="glass"
      size="sm"
      onClick={handleExport}
      disabled={isExporting || data.length === 0}
    >
      <Download className="h-4 w-4" strokeWidth={1.5} />
      <MonoText>EXPORT {format.toUpperCase()}</MonoText>
    </Button>
  )
}
