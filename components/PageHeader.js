import Link from 'next/link'

export default function PageHeader({ title, subtitle, actions }) {
  return (
    <header className="page-header card">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <div>
          <h1 className="text-3xl font-bold" style={{ margin: 0 }}>{title}</h1>
          {subtitle && <p className="small-muted mt-1" style={{ margin: 0 }}>{subtitle}</p>}
        </div>

        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          {actions}
        </div>
      </div>
    </header>
  )
}
