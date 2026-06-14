'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  ChevronUp, ChevronDown, Search, Filter, 
  Download, RefreshCw, ChevronLeft, ChevronRight,
  MoreVertical, Edit, Trash2, Eye
} from 'lucide-react'

interface Column<T> {
  key: keyof T
  label: string
  sortable?: boolean
  width?: string
  render?: (value: any, item: T) => React.ReactNode
}

interface DataTableProps<T> {
  columns: Column<T>[]
  data: T[]
  searchable?: boolean
  filterable?: boolean
  exportable?: boolean
  refreshable?: boolean
  onRefresh?: () => void
  onRowClick?: (item: T) => void
  actions?: {
    onView?: (item: T) => void
    onEdit?: (item: T) => void
    onDelete?: (item: T) => void
  }
  pageSize?: number
}

export function DataTable<T extends { id: string | number }>({
  columns,
  data,
  searchable = true,
  filterable = true,
  exportable = true,
  refreshable = true,
  onRefresh,
  onRowClick,
  actions,
  pageSize = 10
}: DataTableProps<T>) {
  const [searchTerm, setSearchTerm] = useState('')
  const [sortConfig, setSortConfig] = useState<{
    key: keyof T | null
    direction: 'asc' | 'desc'
  }>({ key: null, direction: 'asc' })
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedRows, setSelectedRows] = useState<Set<string | number>>(new Set())
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Filter data based on search term
  const filteredData = data.filter(item =>
    Object.values(item).some(value =>
      String(value).toLowerCase().includes(searchTerm.toLowerCase())
    )
  )

  // Sort data
  const sortedData = [...filteredData].sort((a, b) => {
    if (!sortConfig.key) return 0

    const aValue = a[sortConfig.key]
    const bValue = b[sortConfig.key]

    if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1
    if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1
    return 0
  })

  // Paginate data
  const totalPages = Math.ceil(sortedData.length / pageSize)
  const startIndex = (currentPage - 1) * pageSize
  const paginatedData = sortedData.slice(startIndex, startIndex + pageSize)

  const handleSort = (key: keyof T) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }))
  }

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await onRefresh?.()
    setTimeout(() => setIsRefreshing(false), 1000)
  }

  const toggleRowSelection = (id: string | number) => {
    const newSelection = new Set(selectedRows)
    if (newSelection.has(id)) {
      newSelection.delete(id)
    } else {
      newSelection.add(id)
    }
    setSelectedRows(newSelection)
  }

  const toggleAllSelection = () => {
    if (selectedRows.size === paginatedData.length) {
      setSelectedRows(new Set())
    } else {
      setSelectedRows(new Set(paginatedData.map(item => item.id)))
    }
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
          {searchable && (
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          )}
          
          <div className="flex items-center gap-2">
            {filterable && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <Filter className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </motion.button>
            )}
            
            {exportable && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <Download className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </motion.button>
            )}
            
            {refreshable && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleRefresh}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <motion.div
                  animate={isRefreshing ? { rotate: 360 } : {}}
                  transition={{ duration: 1, repeat: isRefreshing ? Infinity : 0 }}
                >
                  <RefreshCw className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                </motion.div>
              </motion.button>
            )}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-900/50">
            <tr>
              <th className="px-6 py-3">
                <input
                  type="checkbox"
                  checked={selectedRows.size === paginatedData.length && paginatedData.length > 0}
                  onChange={toggleAllSelection}
                  className="rounded border-gray-300 dark:border-gray-600"
                />
              </th>
              {columns.map((column) => (
                <th
                  key={String(column.key)}
                  className={`px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider ${
                    column.sortable ? 'cursor-pointer select-none' : ''
                  }`}
                  style={{ width: column.width }}
                  onClick={() => column.sortable && handleSort(column.key)}
                >
                  <div className="flex items-center gap-1">
                    {column.label}
                    {column.sortable && (
                      <div className="flex flex-col">
                        <ChevronUp 
                          className={`w-3 h-3 ${
                            sortConfig.key === column.key && sortConfig.direction === 'asc'
                              ? 'text-primary-500'
                              : 'text-gray-400'
                          }`}
                        />
                        <ChevronDown 
                          className={`w-3 h-3 -mt-1 ${
                            sortConfig.key === column.key && sortConfig.direction === 'desc'
                              ? 'text-primary-500'
                              : 'text-gray-400'
                          }`}
                        />
                      </div>
                    )}
                  </div>
                </th>
              ))}
              {actions && <th className="px-6 py-3 w-20"></th>}
            </tr>
          </thead>
          
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            <AnimatePresence>
              {paginatedData.map((item, index) => (
                <motion.tr
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ delay: index * 0.05 }}
                  className={`
                    hover:bg-gray-50 dark:hover:bg-gray-700/50
                    ${onRowClick ? 'cursor-pointer' : ''}
                    ${selectedRows.has(item.id) ? 'bg-primary-50 dark:bg-primary-900/20' : ''}
                  `}
                  onClick={() => onRowClick?.(item)}
                >
                  <td className="px-6 py-4">
                    <input
                      type="checkbox"
                      checked={selectedRows.has(item.id)}
                      onChange={() => toggleRowSelection(item.id)}
                      onClick={(e) => e.stopPropagation()}
                      className="rounded border-gray-300 dark:border-gray-600"
                    />
                  </td>
                  {columns.map((column) => (
                    <td
                      key={String(column.key)}
                      className="px-6 py-4 text-sm text-gray-900 dark:text-gray-100"
                    >
                      {column.render
                        ? column.render(item[column.key], item)
                        : String(item[column.key])}
                    </td>
                  ))}
                  {actions && (
                    <td className="px-6 py-4">
                      <DropdownMenu actions={actions} item={item} />
                    </td>
                  )}
                </motion.tr>
              ))}
            </AnimatePresence>
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Showing {startIndex + 1} to {Math.min(startIndex + pageSize, filteredData.length)} of {filteredData.length} results
          </div>
          
          <div className="flex items-center gap-2">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-5 h-5" />
            </motion.button>
            
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNumber
                if (totalPages <= 5) {
                  pageNumber = i + 1
                } else if (currentPage <= 3) {
                  pageNumber = i + 1
                } else if (currentPage >= totalPages - 2) {
                  pageNumber = totalPages - 4 + i
                } else {
                  pageNumber = currentPage - 2 + i
                }
                
                return (
                  <motion.button
                    key={i}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setCurrentPage(pageNumber)}
                    className={`
                      w-8 h-8 rounded-lg text-sm font-medium
                      ${currentPage === pageNumber
                        ? 'bg-primary-500 text-white'
                        : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                      }
                    `}
                  >
                    {pageNumber}
                  </motion.button>
                )
              })}
            </div>
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-5 h-5" />
            </motion.button>
          </div>
        </div>
      </div>
    </div>
  )
}

function DropdownMenu<T>({ actions, item }: { actions: any, item: T }) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="relative">
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={(e) => {
          e.stopPropagation()
          setIsOpen(!isOpen)
        }}
        className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
      >
        <MoreVertical className="w-5 h-5 text-gray-500 dark:text-gray-400" />
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-10"
              onClick={() => setIsOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="absolute right-0 mt-2 w-48 rounded-lg bg-white dark:bg-gray-800 shadow-xl border border-gray-200 dark:border-gray-700 z-20"
            >
              {actions.onView && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    actions.onView(item)
                    setIsOpen(false)
                  }}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2"
                >
                  <Eye className="w-4 h-4" />
                  View
                </button>
              )}
              {actions.onEdit && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    actions.onEdit(item)
                    setIsOpen(false)
                  }}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2"
                >
                  <Edit className="w-4 h-4" />
                  Edit
                </button>
              )}
              {actions.onDelete && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    actions.onDelete(item)
                    setIsOpen(false)
                  }}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2 text-danger-600"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}