import { useMemo, useState } from 'react'
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  flexRender,
  createColumnHelper,
  SortingState,
} from '@tanstack/react-table'
import { ChevronUp, ChevronDown, ChevronLeft, ChevronRight, MapPin, ExternalLink, FileText } from 'lucide-react'
import { Feature, FeatureProperties, STATUS_COLORS } from '../types'
import { useTheme } from '../contexts/ThemeContext'

interface DataTableProps {
  features: Feature[]
  loading: boolean
  selectedFeature: Feature | null
  onSelectFeature: (feature: Feature | null) => void
}

const columnHelper = createColumnHelper<FeatureProperties>()

// Helper to count total sources
const getSourceCount = (primary?: string, supporting?: string[]): number => {
  let count = 0
  if (primary) count++
  if (supporting && Array.isArray(supporting)) count += supporting.length
  return count
}

export default function DataTable({ features, loading, selectedFeature, onSelectFeature }: DataTableProps) {
  const { isDark } = useTheme()
  const [sorting, setSorting] = useState<SortingState>([])

  const data = useMemo(() => features.map(f => f.properties), [features])

  const columns = useMemo(() => [
    columnHelper.accessor('current_status', {
      header: 'Status',
      cell: (info) => {
        const status = info.getValue() || 'Unknown'
        const colors = STATUS_COLORS[status] || { bg: 'rgba(107, 114, 128, 0.2)', text: '#6b7280' }
        return (
          <span
            className="px-2 py-1 rounded-full text-xs font-medium"
            style={{ backgroundColor: colors.bg, color: colors.text }}
          >
            {status}
          </span>
        )
      },
    }),
    columnHelper.accessor('facility_name', {
      header: 'Project Name',
      cell: (info) => (
        <div className={`max-w-[200px] truncate font-medium ${isDark ? 'text-white/90' : 'text-slate-800'}`}>
          {info.getValue() || '-'}
        </div>
      ),
    }),
    columnHelper.accessor('developer', {
      header: 'Developer',
      cell: (info) => (
        <div className={`max-w-[150px] truncate ${isDark ? 'text-white/70' : 'text-slate-600'}`}>
          {info.getValue() || '-'}
        </div>
      ),
    }),
    columnHelper.accessor('tenant', {
      header: 'Tenant',
      cell: (info) => (
        <div className={`max-w-[100px] truncate ${isDark ? 'text-white/70' : 'text-slate-600'}`}>
          {info.getValue() || '-'}
        </div>
      ),
    }),
    columnHelper.accessor('city', {
      header: 'Location',
      cell: (info) => {
        const city = info.getValue() || ''
        const state = info.row.original.state || ''
        return (
          <div className={isDark ? 'text-white/70' : 'text-slate-600'}>
            {[city, state].filter(Boolean).join(', ') || '-'}
          </div>
        )
      },
    }),
    columnHelper.accessor('capacity_mw', {
      header: 'Capacity',
      cell: (info) => {
        const value = info.getValue()
        return value ? (
          <span className="text-amber-400 font-medium">{value.toLocaleString()} MW</span>
        ) : '-'
      },
    }),
    columnHelper.accessor('cost_billions_usd', {
      header: 'Investment',
      cell: (info) => {
        const value = info.getValue()
        return value ? (
          <span className="text-green-400 font-medium">${value.toFixed(1)}B</span>
        ) : '-'
      },
    }),
    columnHelper.accessor('stage_gate', {
      header: 'Stage Gate',
      cell: (info) => {
        const stage = info.getValue()
        return stage ? (
          <div className={`text-xs max-w-[120px] truncate ${isDark ? 'text-white/60' : 'text-slate-500'}`}>
            {stage.replace(/_/g, ' ').toLowerCase()}
          </div>
        ) : '-'
      },
    }),
    columnHelper.accessor('has_opposition', {
      header: 'Opposition',
      cell: (info) => {
        const hasOpp = info.getValue()
        return hasOpp ? (
          <span className="text-red-500">⚠️ Yes</span>
        ) : (
          <span className={isDark ? 'text-white/40' : 'text-slate-400'}>No</span>
        )
      },
    }),
    columnHelper.display({
      id: 'sources',
      header: 'Sources',
      cell: (info) => {
        const primarySource = info.row.original.primary_source
        const supportingSources = info.row.original.supporting_sources || []
        const totalCount = getSourceCount(primarySource, supportingSources)

        if (totalCount === 0) {
          return <span className={isDark ? 'text-white/30' : 'text-slate-400'}>-</span>
        }

        return (
          <div className="flex items-center gap-1">
            {primarySource && (
              <a
                href={primarySource}
                target="_blank"
                rel="noopener noreferrer"
                className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium transition-colors ${
                  isDark
                    ? 'bg-blue-500/20 text-blue-400 hover:bg-blue-500/30'
                    : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                }`}
                title={primarySource}
                onClick={(e) => e.stopPropagation()}
              >
                <FileText className="w-3 h-3" />
                Primary
              </a>
            )}
            {supportingSources.length > 0 && (
              <div className="flex items-center gap-0.5">
                {supportingSources.slice(0, 2).map((url, idx) => (
                  <a
                    key={idx}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`inline-flex items-center gap-0.5 px-1.5 py-1 rounded-md text-xs transition-colors ${
                      isDark
                        ? 'bg-slate-500/20 text-slate-400 hover:bg-slate-500/30'
                        : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                    }`}
                    title={url}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <ExternalLink className="w-3 h-3" />
                  </a>
                ))}
                {supportingSources.length > 2 && (
                  <span className={`text-xs ${isDark ? 'text-white/40' : 'text-slate-500'}`}>
                    +{supportingSources.length - 2}
                  </span>
                )}
              </div>
            )}
          </div>
        )
      },
    }),
    columnHelper.display({
      id: 'actions',
      header: '',
      cell: (info) => (
        <button
          onClick={() => {
            const feature = features.find(f => f.properties.uid === info.row.original.uid)
            if (feature) onSelectFeature(feature)
          }}
          className={`p-1.5 rounded-lg transition-all ${isDark ? 'bg-white/5 hover:bg-white/10 text-white/60 hover:text-white' : 'bg-black/5 hover:bg-black/10 text-slate-500 hover:text-slate-800'}`}
          title="Show on map"
        >
          <MapPin className="w-4 h-4" />
        </button>
      ),
    }),
  ], [features, onSelectFeature])

  const table = useReactTable({
    data,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: { pageSize: 25 },
    },
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-10 h-10 border-3 border-white/10 border-t-red-500 rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div>
      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            {table.getHeaderGroups().map(headerGroup => (
              <tr key={headerGroup.id} className={`border-b ${isDark ? 'border-white/10' : 'border-black/10'}`}>
                {headerGroup.headers.map(header => (
                  <th
                    key={header.id}
                    className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide cursor-pointer ${isDark ? 'text-white/50 hover:text-white/80' : 'text-slate-500 hover:text-slate-700'}`}
                    onClick={header.column.getToggleSortingHandler()}
                  >
                    <div className="flex items-center gap-1">
                      {flexRender(header.column.columnDef.header, header.getContext())}
                      {header.column.getIsSorted() === 'asc' && <ChevronUp className="w-3 h-3" />}
                      {header.column.getIsSorted() === 'desc' && <ChevronDown className="w-3 h-3" />}
                    </div>
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map(row => (
              <tr
                key={row.id}
                className={`border-b transition-colors ${
                  isDark
                    ? `border-white/5 hover:bg-white/5 ${selectedFeature?.properties.uid === row.original.uid ? 'bg-white/10' : ''}`
                    : `border-black/5 hover:bg-black/5 ${selectedFeature?.properties.uid === row.original.uid ? 'bg-black/10' : ''}`
                }`}
              >
                {row.getVisibleCells().map(cell => (
                  <td key={cell.id} className="px-4 py-3 text-sm">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className={`flex items-center justify-between mt-4 pt-4 border-t ${isDark ? 'border-white/10' : 'border-black/10'}`}>
        <div className={`text-sm ${isDark ? 'text-white/50' : 'text-slate-500'}`}>
          Showing {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1} to{' '}
          {Math.min(
            (table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize,
            data.length
          )}{' '}
          of {data.length} projects
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            className={`p-2 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed ${isDark ? 'bg-white/5 hover:bg-white/10' : 'bg-black/5 hover:bg-black/10'}`}
          >
            <ChevronLeft className={`w-4 h-4 ${isDark ? 'text-white/70' : 'text-slate-600'}`} />
          </button>
          <span className={`text-sm ${isDark ? 'text-white/60' : 'text-slate-600'}`}>
            Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
          </span>
          <button
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            className={`p-2 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed ${isDark ? 'bg-white/5 hover:bg-white/10' : 'bg-black/5 hover:bg-black/10'}`}
          >
            <ChevronRight className={`w-4 h-4 ${isDark ? 'text-white/70' : 'text-slate-600'}`} />
          </button>
        </div>
      </div>
    </div>
  )
}
