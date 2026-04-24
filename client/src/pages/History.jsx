import { useQuery } from '@tanstack/react-query'
import axios from 'axios'
import { History as HistoryIcon, Clock, CheckCircle, XCircle } from 'lucide-react'

const fetchHistory = async () => {
  const { data } = await axios.get('/api/metrics/history')
  return data.history
}

export default function History() {
  const { data: history = [], isLoading } = useQuery({
    queryKey: ['history'],
    queryFn: fetchHistory
  })

  const formatTime = (ms) => {
    if (ms < 1000) return `${ms}ms`
    return `${(ms / 1000).toFixed(1)}s`
  }

  return (
    <div>
      <div className="page-header">
        <h1>Histórico de Processamento</h1>
        <p>Lista de arquivos processados anteriormente</p>
      </div>

      {history.length === 0 && !isLoading && (
        <div className="empty-state">
          <HistoryIcon size={80} />
          <h3>Nenhum histórico disponível</h3>
          <p>Arquivos processados aparecerão aqui</p>
        </div>
      )}

      {history.length > 0 && (
        <div className="questions-list">
          {history.map((item) => (
            <div key={item.id} className="question-card expanded">
              <div className="question-header">
                <div className="question-icon" style={{ width: 32, height: 32 }}>
                  {item.status === 'processed' ? (
                    <CheckCircle size={20} color="var(--success)" />
                  ) : (
                    <XCircle size={20} color="var(--error)" />
                  )}
                </div>
                <div className="question-content">
                  <div style={{ fontWeight: 500 }}>{item.filename}</div>
                  <div className="question-meta">
                    <span className="question-tag">
                      {item.questionsCount} questões
                    </span>
                    <span className="question-tag">
                      {formatTime(item.processingTime)}
                    </span>
                  </div>
                </div>
                <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                  {item.processedAt && new Date(item.processedAt).toLocaleString('pt-BR')}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
