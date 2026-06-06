'use client'

import { useRef, useState } from 'react'
import Papa from 'papaparse'
import type { UserRole } from '@/lib/supabase/types'

const VALID_ROLES: UserRole[] = [
  'admin',
  'staff',
  'hv_risk',
  'cc_agent',
  'installer',
  'operations',
  'finance',
  'after_sales',
]

interface CsvRow {
  full_name: string
  email: string
  password: string
  role: string
  phone: string
}

interface UserResult {
  email: string
  status: 'Created' | 'Failed'
  error?: string
}

function validateRow(row: Partial<CsvRow>, index: number): string | null {
  const n = index + 1
  if (!row.full_name?.trim()) return `Row ${n}: full_name is required`
  if (!row.email?.trim()) return `Row ${n}: email is required`
  if (!row.password?.trim()) return `Row ${n}: password is required`
  if (!row.role?.trim()) return `Row ${n}: role is required`
  if (!VALID_ROLES.includes(row.role.trim() as UserRole))
    return `Row ${n}: invalid role "${row.role.trim()}" — valid roles: ${VALID_ROLES.join(', ')}`
  if (!row.phone?.trim()) return `Row ${n}: phone is required`
  return null
}

export default function AdminUsersPage() {
  const fileRef = useRef<HTMLInputElement>(null)
  const [results, setResults] = useState<UserResult[]>([])
  const [validationErrors, setValidationErrors] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [fileName, setFileName] = useState('')

  function reset() {
    setResults([])
    setValidationErrors([])
    setFileName('')
    if (fileRef.current) fileRef.current.value = ''
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setFileName(file.name)
    setValidationErrors([])
    setResults([])

    Papa.parse<CsvRow>(file, {
      header: true,
      skipEmptyLines: true,
      complete: async ({ data: rows }) => {
        const errors: string[] = []

        for (let i = 0; i < rows.length; i++) {
          const err = validateRow(rows[i], i)
          if (err) errors.push(err)
        }

        if (errors.length > 0) {
          setValidationErrors(errors)
          return
        }

        setLoading(true)
        try {
          const res = await fetch('/api/admin/create-users', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              users: rows.map(r => ({
                full_name: r.full_name.trim(),
                email: r.email.trim(),
                password: r.password.trim(),
                role: r.role.trim(),
                phone: r.phone.trim(),
              })),
            }),
          })
          const json = await res.json()
          if (!res.ok) {
            setValidationErrors([json.error ?? 'Server error'])
          } else {
            setResults(json.results ?? [])
          }
        } catch {
          setValidationErrors(['Could not reach the server. Please try again.'])
        } finally {
          setLoading(false)
        }
      },
      error: () => {
        setValidationErrors(['Could not parse the CSV file. Check the format and try again.'])
      },
    })
  }

  const createdCount = results.filter(r => r.status === 'Created').length
  const failedCount = results.filter(r => r.status === 'Failed').length

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold">Bulk User Upload</h1>
          <p className="text-sm text-gray-500 mt-1">
            Upload a CSV to create multiple staff accounts at once.
          </p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 space-y-6">
          {/* Expected format */}
          <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-600">
            <p className="font-medium mb-1">Expected CSV columns</p>
            <code className="text-xs">full_name, email, password, role, phone</code>
            <p className="text-xs text-gray-400 mt-2">
              Valid roles: <span className="font-mono">{VALID_ROLES.join(' · ')}</span>
            </p>
          </div>

          {/* Drop zone */}
          <div
            className="border-2 border-dashed border-gray-200 rounded-xl p-10 text-center cursor-pointer hover:border-[#FFE135] hover:bg-yellow-50/30 transition-colors"
            onClick={() => fileRef.current?.click()}
          >
            <input
              ref={fileRef}
              type="file"
              accept=".csv"
              className="hidden"
              onChange={handleFileChange}
            />
            <div className="text-4xl mb-3">📄</div>
            <p className="text-sm font-medium text-gray-700">
              {fileName ? fileName : 'Click to select a CSV file'}
            </p>
            <p className="text-xs text-gray-400 mt-1">Only .csv files accepted</p>
          </div>

          {/* Actions row */}
          {(fileName || results.length > 0 || validationErrors.length > 0) && (
            <div className="flex justify-end">
              <button
                type="button"
                onClick={reset}
                className="text-sm text-gray-500 hover:text-gray-700 underline"
              >
                Clear &amp; start over
              </button>
            </div>
          )}

          {/* Validation errors */}
          {validationErrors.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm font-medium text-red-700 mb-2">Fix the following errors:</p>
              <ul className="list-disc list-inside space-y-1">
                {validationErrors.map((err, i) => (
                  <li key={i} className="text-sm text-red-600">
                    {err}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Loading */}
          {loading && (
            <div className="text-sm text-gray-500 text-center py-2">
              Creating users — this may take a moment…
            </div>
          )}

          {/* Results table */}
          {results.length > 0 && (
            <div>
              <div className="flex items-center gap-3 mb-3">
                <h2 className="text-sm font-semibold text-gray-700">Results</h2>
                <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
                  {createdCount} created
                </span>
                {failedCount > 0 && (
                  <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-medium">
                    {failedCount} failed
                  </span>
                )}
              </div>
              <div className="rounded-lg border border-gray-200 overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                        Email
                      </th>
                      <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                        Status
                      </th>
                      <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                        Note
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {results.map((r, i) => (
                      <tr key={i} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 font-mono text-xs text-gray-700">{r.email}</td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              r.status === 'Created'
                                ? 'bg-green-100 text-green-700'
                                : 'bg-red-100 text-red-700'
                            }`}
                          >
                            {r.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-400">{r.error ?? '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
