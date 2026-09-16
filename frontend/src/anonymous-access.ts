import type { Report } from './types'

const pendingReports = new Map<string, { report: Report; token: string }>()

export function rememberSubmittedReport(report: Report) {
  pendingReports.set(report.id, {
    report: { ...report, access_token: undefined },
    token: report.access_token || '',
  })
}

export function submittedReport(id?: string) {
  return id ? pendingReports.get(id) : undefined
}
