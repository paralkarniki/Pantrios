import PageHeader from './PageHeader'

export default function FeaturePage({
  title,
  subtitle,
  intro,
  badge = 'New',
  actions = null,
  highlights = [],
  children = null,
}) {
  return (
    <div className="app-container">
      <PageHeader title={title} subtitle={subtitle} actions={actions} />

      <section className="card fade-in-up" style={{ marginTop: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>
          <span className="badge">{badge}</span>
          <p style={{ margin: 0, fontSize: '1rem', lineHeight: 1.7, color: '#44403c', maxWidth: 760 }}>
            {intro}
          </p>
        </div>

        {!!highlights.length && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginTop: 18 }}>
            {highlights.map((item) => (
              <div key={item.title} className="stat-card">
                <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #fff7ed, #fde68a)', color: '#92400e' }}>
                  {item.icon || '✨'}
                </div>
                <div>
                  <div style={{ fontWeight: 800, color: '#1c1917' }}>{item.title}</div>
                  <div className="small-muted" style={{ marginTop: 4 }}>{item.text}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {children}
    </div>
  )
}
