import { useQuery } from '@tanstack/react-query'
import axios from 'axios'
import { FileQuestion, CheckCircle, AlertCircle, Clock, TrendingUp } from 'lucide-react'
import { Link } from 'react-router-dom'

const fetchMetrics = async () => {
  const { data } = await axios.get('/api/metrics')
  return data
}

export default function Dashboard() {
  const { data: metrics, isLoading } = useQuery({
    queryKey: ['metrics'],
    queryFn: fetchMetrics,
    refreshInterval: 5000
  })

  if (isLoading) {
    return (
      <div className="loading-overlay">
        <div className="spinner" />
        <h3>Carregando métricas...</h3>
      </div>
    )
  }

  return (
    <div>
      <div className="page-header">
        <h1>Dashboard</h1>
        <p>Visão geral do sistema de extração de questões</p>
      </div>

      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-icon accent">
            <FileQuestion size={24} />
          </div>
          <h3>Total de Questões</h3>
          <div className="value">{metrics?.totalQuestions || 0}</div>
        </div>

        <div className="metric-card">
          <div className="metric-icon success">
            <CheckCircle size={24} />
          </div>
          <h3>Arquivos Processados</h3>
          <div className="value">{metrics?.processedFiles || 0}</div>
        </div>

        <div className="metric-card">
          <div className="metric-icon warning">
            <AlertCircle size={24} />
          </div>
          <h3>Arquivos com Erro</h3>
          <div className="value">{metrics?.failedFiles || 0}</div>
        </div>

        <div className="metric-card">
          <div className="metric-icon accent">
            <Clock size={24} />
          </div>
          <h3>Arquivos Pendentes</h3>
          <div className="value">{(metrics?.filesByStatus?.pending || 0) + (metrics?.filesByStatus?.processing || 0)}</div>
        </div>
      </div>

      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-icon success">
            <CheckCircle size={24} />
          </div>
          <h3>Questões Validadas</h3>
          <div className="value">{metrics?.questionsByStatus?.approved || 0}</div>
        </div>

        <div className="metric-card">
          <div className="metric-icon warning">
            <TrendingUp size={24} />
          </div>
          <h3>Em Revisão</h3>
          <div className="value">{metrics?.questionsByStatus?.pending || 0}</div>
        </div>
      </div>

      <div className="dashboard-actions" style={{ marginTop: '32px', display: 'flex', gap: '16px' }}>
        <Link to="/upload" className="btn btn-primary">
          <FileQuestion size={18} />
          Novo Upload
        </Link>
        <Link to="/process" className="btn btn-secondary">
          Processar Arquivos
        </Link>
        <Link to="/results" className="btn btn-secondary">
          Ver Questões
        </Link>
      </div>

      {metrics?.disciplineStats && Object.keys(metrics.disciplineStats).length > 0 && (
        <div className="metric-card" style={{ marginTop: '32px' }}>
          <h3 style={{ marginBottom: '16px', color: 'var(--text-secondary)' }}>Questões por Disciplina</h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
            {Object.entries(metrics.disciplineStats).map(([discipline, count]) => (
              <div key={discipline} className="question-tag" style={{ padding: '8px 16px', fontSize: '0.875rem' }}>
                {discipline}: {count}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
