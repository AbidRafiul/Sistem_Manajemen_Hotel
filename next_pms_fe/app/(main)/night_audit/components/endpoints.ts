/**
 * @copyright (c) 2026 PT Marstech Global (info@marstech.co.id)
 * @project Standard
 * @file endpoints.ts
 * @description API Endpoint constants untuk modul Night Audit
 * @author Antigravity
 * @created 2026-10-09
 * @version 1.0.0
 */

export const apiNightAuditStatus = '/night-audit/status';
export const apiNightAuditPreCheck = '/night-audit/pre-check';
export const apiNightAuditStart = '/night-audit/start';
export const apiNightAuditRuns = '/night-audit/runs';
export const apiNightAuditRunDetail = (id: string | number) => `/night-audit/runs/${id}`;
export const apiNightAuditPostings = (id: string | number) => `/night-audit/runs/${id}/postings`;
export const apiNightAuditReport = (id: string | number, type: string) => `/night-audit/runs/${id}/reports/${type}`;
export const apiNightAuditRetryFailed = (id: string | number) => `/night-audit/runs/${id}/retry-failed`;
export const apiNightAuditReopen = (id: string | number) => `/night-audit/runs/${id}/reopen`;
export const apiNightAuditNoShow = '/night-audit/no-show';
export const apiCabangDropdown = '/master/cabang/cabang-data';
