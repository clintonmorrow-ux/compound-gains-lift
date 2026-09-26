import { NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
/** Identifies the deployed build so an open PWA can notice a newer one. */
export function GET() {
  const id = process.env.VERCEL_GIT_COMMIT_SHA ?? process.env.VERCEL_DEPLOYMENT_ID ?? 'dev'
  return NextResponse.json({ id }, { headers: { 'Cache-Control': 'no-store' } })
}
