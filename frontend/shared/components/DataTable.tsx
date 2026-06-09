import React from 'react'

interface Column<T> {
  key: string
  header: string
  render?: (row: T) => React.ReactNode
}

interface DataTableProps<T> {
  data: T[]
  columns: Column<T>[]
  keyExtractor: (row: T) => string
}

export function DataTable<T>({ data, columns, keyExtractor }: DataTableProps<T>) {
  return (
    <div className="overflow-x-auto rounded-xl border border-[#2a3150]">
      <table className="w-full">
        <thead className="bg-[#1e2640]">
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                className="px-4 py-3 text-left text-sm font-medium text-[#8b92b4] uppercase tracking-wider"
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-[#2a3150]">
          {data.map((row) => (
            <tr key={keyExtractor(row)} className="hover:bg-[#1e2640]/50 transition-colors">
              {columns.map((col) => (
                <td key={col.key} className="px-4 py-3 text-sm text-[#dce1fb]">
                  {col.render ? col.render(row) : (row as Record<string, unknown>)[col.key] as React.ReactNode}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
