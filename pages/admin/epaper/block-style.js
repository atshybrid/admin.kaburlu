import React from 'react'
import Head from 'next/head'
import dynamic from 'next/dynamic'
import DashboardLayout from '../../../components/dashboard/DashboardLayout'

const BlockStyleWorkbench = dynamic(
  () => import('../../../components/epaper/BlockStyleWorkbench'),
  { ssr: false, loading: () => <div className="p-10 text-center text-slate-600">Loading block style workbench…</div> }
)

export default function EPaperBlockStylePage() {
  return (
    <DashboardLayout title="Epaper Block style">
      <Head>
        <title>Epaper Block style · Admin</title>
      </Head>
      <BlockStyleWorkbench />
    </DashboardLayout>
  )
}
