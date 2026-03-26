import { useMemo, useState } from 'react'
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  getFilteredRowModel,
  flexRender,
  createColumnHelper,
  SortingState,
} from '@tanstack/react-table'
import { ChevronUp, ChevronDown, ChevronsUpDown, Zap, CheckCircle2, Building2, MapPin } from 'lucide-react'
import { Feature, FeatureProperties } from '../types'

interface DataTableProps {
  features: Feature[]
  loading: boolean
  selectedFeature: Feature | null
  onSelectFeature: (feature: Feature | null) => void
  onRowClick?: (feature: Feature) => void
}

const columnHelper = createColumnHelper<FeatureProperties>()

// Company color mapping
const COMPANY_COLORS: Record<string, string> = {
  'AWS': 'text-orange-400',
  'Microsoft': 'text-green-400',
  'Google': 'text-red-400',
  'Meta': 'text-blue-400',
  'Apple': 'text-gray-400',
  'Oracle': 'text-red-500',
  'Alibaba': 'text-orange-500',
}

// Status badge colors
const STATUS_BADGES: Record<string, string> = {
  'Active': 'badge-emerald',
  'Under Construction': 'badge-amber',
  'Announced': 'badge-blue',
  'Planned': 'badge-purple',
  'Land Acquisition': 'badge-cyan',
  'Cancelled': 'badge-rose',
  'Unknown': 'badge-gray',
}

// Region colors
const REGION_COLORS: Record<string, string> = {
  'AMER': 'text-green-400',
  'EMEA': 'text-blue-400',
  'APAC': 'text-purple-400',
}

// Format date helper
const formatDate = (val: string | undefined) => {
  if (!val) return '-'
  try {
    return new Date(val).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' })
  } catch {
    return val
  }
}

// Format number helper
const formatNumber = (val: number | undefined, decimals = 1) => {
  if (val === undefined || val === null || val === 0) return '-'
  return val.toFixed(decimals)
}

export default function DataTable({ features, loading, selectedFeature, onSelectFeature, onRowClick }: DataTableProps) {
  const [sorting, setSorting] = useState<SortingState>([])
  const [globalFilter, setGlobalFilter] = useState('')

  // Extract properties from features
  const data = useMemo(() =>
    features.map(f => f.properties),
    [features]
  )

  // Define ALL columns - organized by category
  const columns = useMemo(() => [
    // ========================================================================
    // CATEGORY 1: IDENTIFIERS
    // ========================================================================
    columnHelper.accessor('record_level', {
      header: () => <span className="flex items-center gap-1"><Building2 size={12} /> Level</span>,
      cell: info => {
        const val = info.getValue()
        const isCampus = val === 'Campus'
        return (
          <span className={`text-xs font-medium ${isCampus ? 'text-purple-400' : 'text-cyan-400'}`}>
            {val || '-'}
          </span>
        )
      },
      size: 80,
    }),
    columnHelper.accessor('ucid', {
      header: 'UCID',
      cell: info => (
        <span className="font-mono text-xs text-white/70">{info.getValue() || '-'}</span>
      ),
      size: 160,
    }),
    columnHelper.accessor('building_ucid', {
      header: 'Bldg UCID',
      cell: info => (
        <span className="font-mono text-xs text-white/50">{info.getValue() || '-'}</span>
      ),
      size: 140,
    }),
    columnHelper.accessor('unique_id', {
      header: 'Source ID',
      cell: info => (
        <span className="font-mono text-xs text-white/40">{info.getValue()?.slice(0, 20) || '-'}</span>
      ),
      size: 140,
    }),

    // ========================================================================
    // CATEGORY 2: COMPANY
    // ========================================================================
    columnHelper.accessor('company_source', {
      header: 'Company (Original)',
      cell: info => (
        <span className="text-white/60 text-xs truncate max-w-[150px] block">{info.getValue() || '-'}</span>
      ),
      size: 150,
    }),
    columnHelper.accessor('company_clean', {
      header: 'Company (Std)',
      cell: info => (
        <span className="text-white/80">{info.getValue() || '-'}</span>
      ),
      size: 130,
    }),
    columnHelper.accessor('company_clean_filter', {
      header: 'Company (Filter)',
      cell: info => {
        const company = info.getValue()
        return (
          <span className={`font-medium ${COMPANY_COLORS[company || ''] || 'text-white/80'}`}>
            {company || '-'}
          </span>
        )
      },
      size: 130,
    }),
    columnHelper.accessor('developer', {
      header: 'Developer',
      cell: info => <span className="text-white/60">{info.getValue() || '-'}</span>,
      size: 120,
    }),
    columnHelper.accessor('tenant', {
      header: 'Tenant',
      cell: info => <span className="text-white/60">{info.getValue() || '-'}</span>,
      size: 120,
    }),
    columnHelper.accessor('end_user', {
      header: 'End User',
      cell: info => <span className="text-white/60">{info.getValue() || '-'}</span>,
      size: 120,
    }),

    // ========================================================================
    // CATEGORY 3: LOCATION
    // ========================================================================
    columnHelper.accessor('campus_name', {
      header: () => <span className="flex items-center gap-1"><MapPin size={12} /> Campus</span>,
      cell: info => (
        <span className="text-white/90 truncate max-w-[200px] block font-medium">{info.getValue() || '-'}</span>
      ),
      size: 200,
    }),
    columnHelper.accessor('building_name', {
      header: 'Building',
      cell: info => (
        <span className="text-white/80 truncate max-w-[150px] block">{info.getValue() || '-'}</span>
      ),
      size: 150,
    }),
    columnHelper.accessor('address', {
      header: 'Address',
      cell: info => (
        <span className="text-white/60 truncate max-w-[180px] block text-xs">{info.getValue() || '-'}</span>
      ),
      size: 180,
    }),
    columnHelper.accessor('city', {
      header: 'City',
      cell: info => <span className="text-white/70">{info.getValue() || '-'}</span>,
      size: 110,
    }),
    columnHelper.accessor('county', {
      header: 'County',
      cell: info => <span className="text-white/60">{info.getValue() || '-'}</span>,
      size: 100,
    }),
    columnHelper.accessor('state', {
      header: 'State',
      cell: info => <span className="text-white/70">{info.getValue() || '-'}</span>,
      size: 100,
    }),
    columnHelper.accessor('state_abbr', {
      header: 'ST',
      cell: info => <span className="text-white/70 font-medium">{info.getValue() || '-'}</span>,
      size: 50,
    }),
    columnHelper.accessor('country', {
      header: 'Country',
      cell: info => <span className="text-white/70">{info.getValue() || '-'}</span>,
      size: 110,
    }),
    columnHelper.accessor('region', {
      header: 'Region',
      cell: info => {
        const region = info.getValue()
        return <span className={REGION_COLORS[region || ''] || 'text-white/60'}>{region || '-'}</span>
      },
      size: 70,
    }),
    columnHelper.accessor('market', {
      header: 'Market',
      cell: info => <span className="text-white/60">{info.getValue() || '-'}</span>,
      size: 100,
    }),
    columnHelper.accessor('postal_code', {
      header: 'ZIP',
      cell: info => <span className="text-white/50 text-xs">{info.getValue() || '-'}</span>,
      size: 70,
    }),

    // ========================================================================
    // CATEGORY 4: CAPACITY - POWER
    // ========================================================================
    columnHelper.accessor('commissioned_power_mw', {
      header: () => <span className="flex items-center gap-1"><CheckCircle2 size={12} className="text-emerald-400" /> Comm MW</span>,
      cell: info => (
        <span className="font-medium text-emerald-400">{formatNumber(info.getValue())}</span>
      ),
      size: 95,
    }),
    columnHelper.accessor('capacity_under_construction_mw', {
      header: 'UC MW',
      cell: info => (
        <span className="font-medium text-amber-400">{formatNumber(info.getValue())}</span>
      ),
      size: 75,
    }),
    columnHelper.accessor('planned_capacity_mw', {
      header: 'Plan MW',
      cell: info => (
        <span className="font-medium text-blue-400">{formatNumber(info.getValue())}</span>
      ),
      size: 80,
    }),
    columnHelper.accessor('full_capacity_mw', {
      header: () => <span className="flex items-center gap-1"><Zap size={12} className="text-accent-amber" /> Total MW</span>,
      cell: info => (
        <span className="font-bold text-accent-amber">{formatNumber(info.getValue())}</span>
      ),
      size: 95,
    }),
    columnHelper.accessor('it_load_total', {
      header: 'IT Load',
      cell: info => (
        <span className="text-cyan-400">{formatNumber(info.getValue())}</span>
      ),
      size: 75,
    }),

    // ========================================================================
    // CATEGORY 5: CAPACITY - AREA
    // ========================================================================
    columnHelper.accessor('facility_sqft', {
      header: 'Sq Ft',
      cell: info => {
        const val = info.getValue()
        return <span className="text-white/70">{val ? val.toLocaleString() : '-'}</span>
      },
      size: 90,
    }),
    columnHelper.accessor('whitespace_sqft', {
      header: 'Whitespace',
      cell: info => {
        const val = info.getValue()
        return <span className="text-white/50">{val ? val.toLocaleString() : '-'}</span>
      },
      size: 95,
    }),

    // ========================================================================
    // CATEGORY 6: STATUS
    // ========================================================================
    columnHelper.accessor('facility_status', {
      header: 'Status',
      cell: info => {
        const status = info.getValue()
        return (
          <span className={`badge ${STATUS_BADGES[status || ''] || 'badge-gray'}`}>
            {status || 'Unknown'}
          </span>
        )
      },
      size: 130,
    }),
    columnHelper.accessor('is_essential', {
      header: 'Essential',
      cell: info => {
        const val = info.getValue()
        const isEssential = val === 1 || val === true
        return isEssential ? (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-medium">
            <CheckCircle2 size={10} />
            Yes
          </span>
        ) : (
          <span className="text-white/30 text-xs">-</span>
        )
      },
      size: 80,
    }),
    columnHelper.accessor('tier', {
      header: 'Tier',
      cell: info => {
        const tier = info.getValue()
        const colors: Record<string, string> = {
          'Hyperscaler': 'text-purple-400',
          'Major Colo': 'text-blue-400',
          'Other': 'text-white/50',
        }
        return <span className={colors[tier || ''] || 'text-white/50'}>{tier || '-'}</span>
      },
      size: 90,
    }),
    columnHelper.accessor('owned_leased', {
      header: 'Own/Lease',
      cell: info => <span className="text-white/60">{info.getValue() || '-'}</span>,
      size: 85,
    }),

    // ========================================================================
    // CATEGORY 7: DATES
    // ========================================================================
    columnHelper.accessor('actual_live_date', {
      header: 'Live Date',
      cell: info => <span className="text-white/60 text-xs">{formatDate(info.getValue())}</span>,
      size: 90,
    }),
    columnHelper.accessor('construction_start_date', {
      header: 'Const Start',
      cell: info => <span className="text-white/50 text-xs">{formatDate(info.getValue())}</span>,
      size: 90,
    }),
    columnHelper.accessor('construction_end_date', {
      header: 'Const End',
      cell: info => <span className="text-white/50 text-xs">{formatDate(info.getValue())}</span>,
      size: 90,
    }),
    columnHelper.accessor('data_vintage', {
      header: 'Vintage',
      cell: info => <span className="text-white/40 text-xs">{formatDate(info.getValue())}</span>,
      size: 85,
    }),
    columnHelper.accessor('ingest_date', {
      header: 'Ingested',
      cell: info => <span className="text-white/40 text-xs">{formatDate(info.getValue())}</span>,
      size: 85,
    }),

    // ========================================================================
    // CATEGORY 8: ENERGY
    // ========================================================================
    columnHelper.accessor('energy_source', {
      header: 'Energy',
      cell: info => <span className="text-white/60">{info.getValue() || '-'}</span>,
      size: 90,
    }),
    columnHelper.accessor('pue', {
      header: 'PUE',
      cell: info => <span className="text-white/60">{formatNumber(info.getValue(), 2)}</span>,
      size: 60,
    }),
    columnHelper.accessor('ai_gpu_indicator', {
      header: 'AI/GPU',
      cell: info => <span className="text-white/60">{info.getValue() || '-'}</span>,
      size: 70,
    }),

    // ========================================================================
    // CATEGORY 9: AGGREGATES
    // ========================================================================
    columnHelper.accessor('building_count', {
      header: 'Bldgs',
      cell: info => {
        const val = info.getValue()
        return <span className="text-white/70 font-medium">{val || '-'}</span>
      },
      size: 55,
    }),
    columnHelper.accessor('source_count', {
      header: 'Srcs',
      cell: info => {
        const val = info.getValue()
        return <span className="text-white/50">{val || '-'}</span>
      },
      size: 50,
    }),

    // ========================================================================
    // CATEGORY 10: SOURCE
    // ========================================================================
    columnHelper.accessor('source', {
      header: 'Source(s)',
      cell: info => {
        const source = info.getValue()
        const shortSource = source?.split(';')[0]?.trim() || source
        const hasMultiple = source?.includes(';')
        const sourceCount = source?.split(';').length ?? 0
        return (
          <span className="text-xs text-white/50" title={source}>
            {shortSource && shortSource.length > 18 ? shortSource.slice(0, 18) + '...' : shortSource || '-'}
            {hasMultiple && <span className="text-purple-400 ml-1">+{sourceCount - 1}</span>}
          </span>
        )
      },
      size: 130,
    }),
    columnHelper.accessor('source_id', {
      header: 'Src Rec ID',
      cell: info => (
        <span className="font-mono text-xs text-white/40">{info.getValue()?.slice(0, 15) || '-'}</span>
      ),
      size: 110,
    }),

    // ========================================================================
    // CATEGORY 11: NOTES
    // ========================================================================
    columnHelper.accessor('notes', {
      header: 'Notes',
      cell: info => (
        <span className="text-white/50 text-xs truncate max-w-[150px] block">{info.getValue() || '-'}</span>
      ),
      size: 150,
    }),
  ], [])

  // Create table instance
  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      globalFilter,
    },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    initialState: {
      pagination: {
        pageSize: 50,
      },
    },
  })

  if (loading) {
    return (
      <div className="h-[calc(100vh-340px)] flex items-center justify-center bg-transparent">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-3 border-white/10 border-t-accent-blue rounded-full animate-spin" />
          <span className="text-sm text-white/60">Loading data...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="h-[calc(100vh-340px)] flex flex-col bg-transparent">
      {/* Table Header Info */}
      <div className="flex items-center justify-between p-4 border-b border-white/5">
        <div className="text-sm text-white/60">
          Showing <span className="text-white font-medium">{table.getRowModel().rows.length.toLocaleString()}</span> of{' '}
          <span className="text-white font-medium">{data.length.toLocaleString()}</span> records
          <span className="text-white/40 ml-2">• {columns.length} columns</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-xs text-white/30 flex items-center gap-1">
            <span className="text-accent-blue">←</span> Scroll horizontally <span className="text-accent-blue">→</span>
          </span>
          <div className="flex items-center gap-2">
            <span className="text-xs text-white/40">Rows:</span>
            <select
              value={table.getState().pagination.pageSize}
              onChange={(e) => table.setPageSize(Number(e.target.value))}
              className="bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-sm text-white/80"
            >
              {[25, 50, 100, 200].map(size => (
                <option key={size} value={size} className="bg-navy-800">{size}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Scrollable Table - BOTH horizontal and vertical */}
      <div className="flex-1 overflow-auto">
        <table className="data-table" style={{ minWidth: '3500px' }}>
          <thead>
            {table.getHeaderGroups().map(headerGroup => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map(header => (
                  <th
                    key={header.id}
                    onClick={header.column.getToggleSortingHandler()}
                    style={{ width: header.getSize(), minWidth: header.getSize() }}
                    className="cursor-pointer hover:bg-white/5 whitespace-nowrap"
                  >
                    <div className="flex items-center gap-1.5">
                      {flexRender(header.column.columnDef.header, header.getContext())}
                      {{
                        asc: <ChevronUp size={12} className="text-accent-blue" />,
                        desc: <ChevronDown size={12} className="text-accent-blue" />,
                      }[header.column.getIsSorted() as string] ?? (
                        <ChevronsUpDown size={12} className="text-white/20" />
                      )}
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
                onClick={() => {
                  const feature = features.find(f => f.properties.ucid === row.original.ucid)
                  onSelectFeature(feature || null)
                }}
                onDoubleClick={() => {
                  const feature = features.find(f => f.properties.ucid === row.original.ucid)
                  if (feature && onRowClick) onRowClick(feature)
                }}
                className={`cursor-pointer ${
                  selectedFeature?.properties.ucid === row.original.ucid ? 'selected' : ''
                }`}
              >
                {row.getVisibleCells().map(cell => (
                  <td key={cell.id} className="whitespace-nowrap">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between p-4 border-t border-white/5">
        <div className="flex items-center gap-2">
          <button
            onClick={() => table.setPageIndex(0)}
            disabled={!table.getCanPreviousPage()}
            className="neo-button text-xs disabled:opacity-30 disabled:cursor-not-allowed"
          >
            First
          </button>
          <button
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            className="neo-button text-xs disabled:opacity-30 disabled:cursor-not-allowed"
          >
            Previous
          </button>
        </div>

        <span className="text-sm text-white/60">
          Page <span className="text-white font-medium">{table.getState().pagination.pageIndex + 1}</span> of{' '}
          <span className="text-white font-medium">{table.getPageCount()}</span>
        </span>

        <div className="flex items-center gap-2">
          <button
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            className="neo-button text-xs disabled:opacity-30 disabled:cursor-not-allowed"
          >
            Next
          </button>
          <button
            onClick={() => table.setPageIndex(table.getPageCount() - 1)}
            disabled={!table.getCanNextPage()}
            className="neo-button text-xs disabled:opacity-30 disabled:cursor-not-allowed"
          >
            Last
          </button>
        </div>
      </div>
    </div>
  )
}
