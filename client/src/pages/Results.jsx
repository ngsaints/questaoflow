import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { CheckCircle, XCircle, ChevronDown, ChevronUp, Edit2, Save, AlertTriangle, Download } from 'lucide-react'

const fetchQuestions = async ({ queryKey }) => {
  const [, filters] = queryKey
  const params = new URLSearchParams(filters).toString()
  const { data } = await axios.get(`/api/questions${params ? '?' + params : ''}`)
  return data
}

const updateQuestion = async ({ id, ...updates }) => {
  const { data } = await axios.put(`/api/questions/${id}`, updates)
  return data
}

const exportQuestions = async (ids) => {
  const { data } = await axios.post('/api/questions/export', { ids })
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `questoes_${Date.now()}.json`
  a.click()
  URL.revokeObjectURL(url)
}

export default function Results() {
  const queryClient = useQueryClient()
  const [expandedId, setExpandedId] = useState(null)
  const [editingId, setEditingId] = useState(null)
  const [editData, setEditData] = useState({})
  const [filters, setFilters] = useState({})

  const { data, isLoading } = useQuery({
    queryKey: ['questions', filters],
    queryFn: fetchQuestions
  })

  const updateMutation = useMutation({
    mutationFn: updateQuestion,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['questions'] })
      setEditingId(null)
    }
  })

  const handleExport = () => {
    if (data?.questions?.length > 0) {
      exportQuestions(data.questions.map(q => q.id))
    }
  }

  const startEdit = (question) => {
    setEditingId(question.id)
    setEditData({ ...question })
  }

  const saveEdit = () => {
    updateMutation.mutate({ id: editingId, ...editData })
  }

  const getConfidenceBadge = (confidence) => {
    if (confidence >= 0.8) return { class: 'high', label: `${Math.round(confidence * 100)}%` }
    if (confidence >= 0.6) return { class: 'medium', label: `${Math.round(confidence * 100)}%` }
    return { class: 'low', label: `${Math.round(confidence * 100)}%` }
  }

  const questions = data?.questions || []

  return (
    <div>
      <div className="page-header">
        <h1>Resultados</h1>
        <p>Questões extraídas e validadas</p>
      </div>

      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
        <button className="btn btn-primary" onClick={handleExport}>
          <Download size={18} />
          Exportar JSON
        </button>
      </div>

      {questions.length === 0 && !isLoading && (
        <div className="empty-state">
          <CheckCircle size={80} />
          <h3>Nenhuma questão processada</h3>
          <p>Processe arquivos para extrair questões</p>
        </div>
      )}

      <div className="questions-list">
        {questions.map((question, index) => {
          const badge = getConfidenceBadge(question.confidence || 0.5)
          const validation = question.validation || {}

          return (
            <div
              key={question.id}
              className={`question-card ${expandedId === question.id ? 'expanded' : ''}`}
            >
              <div
                className="question-header"
                onClick={() => setExpandedId(expandedId === question.id ? null : question.id)}
              >
                <div className="question-number">{index + 1}</div>
                <div className="question-content">
                  <div style={{ fontWeight: 500, marginBottom: '4px' }}>
                    {question.enunciado?.substring(0, 80)}
                    {question.enunciado?.length > 80 ? '...' : ''}
                  </div>
                  <div className="question-meta">
                    {question.disciplina && (
                      <span className="question-tag">{question.disciplina}</span>
                    )}
                    {question.assunto && (
                      <span className="question-tag">{question.assunto}</span>
                    )}
                    {question.banca && (
                      <span className="question-tag">{question.banca}</span>
                    )}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span className={`confidence-badge ${badge.class}`}>
                    {badge.label}
                  </span>
                  {expandedId === question.id ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </div>
              </div>

              <div className="question-body">
                {editingId === question.id ? (
                  <div className="edit-form">
                    <div className="form-group" style={{ marginBottom: '12px' }}>
                      <label>Enunciado</label>
                      <textarea
                        value={editData.enunciado || ''}
                        onChange={(e) => setEditData({ ...editData, enunciado: e.target.value })}
                        rows={3}
                      />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '8px', marginBottom: '12px' }}>
                      {['A', 'B', 'C', 'D', 'E'].map(alt => (
                        <div key={alt} className="form-group">
                          <label>Alternativa {alt}</label>
                          <input
                            type="text"
                            value={editData.alternativas?.[alt] || ''}
                            onChange={(e) => setEditData({
                              ...editData,
                              alternativas: { ...editData.alternativas, [alt]: e.target.value }
                            })}
                          />
                        </div>
                      ))}
                    </div>
                    <div className="form-group" style={{ marginBottom: '12px' }}>
                      <label>Resposta Correta</label>
                      <select
                        value={editData.resposta_correta || ''}
                        onChange={(e) => setEditData({ ...editData, resposta_correta: e.target.value })}
                      >
                        <option value="A">A</option>
                        <option value="B">B</option>
                        <option value="C">C</option>
                        <option value="D">D</option>
                        <option value="E">E</option>
                      </select>
                    </div>
                    <div className="form-group" style={{ marginBottom: '12px' }}>
                      <label>Resolução</label>
                      <textarea
                        value={editData.resolucao || ''}
                        onChange={(e) => setEditData({ ...editData, resolucao: e.target.value })}
                        rows={2}
                      />
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button className="btn btn-primary" onClick={saveEdit}>
                        <Save size={16} />
                        Salvar
                      </button>
                      <button className="btn btn-secondary" onClick={() => setEditingId(null)}>
                        Cancelar
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="question-text">
                      <strong>Enunciado:</strong><br />
                      {question.enunciado}
                    </div>

                    <div className="alternatives-grid">
                      {['A', 'B', 'C', 'D', 'E'].map(alt => {
                        const isCorrect = question.resposta_correta === alt
                        return (
                          <div key={alt} className={`alternative-item ${isCorrect ? 'correct' : ''}`}>
                            <div className="alt-letter">{alt}</div>
                            <div className="alt-text">
                              {question.alternativas?.[alt] || 'Não identificado'}
                            </div>
                            {isCorrect && <CheckCircle size={18} color="var(--success)" />}
                          </div>
                        )
                      })}
                    </div>

                    {question.resolucao && (
                      <div style={{ marginTop: '16px' }}>
                        <strong style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                          Resolução:
                        </strong>
                        <div className="question-text" style={{ marginTop: '8px' }}>
                          {question.resolucao}
                        </div>
                      </div>
                    )}

                    <div className="validation-section">
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                        <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                          Validação
                        </span>
                        {validation.valid ? (
                          <span className="validation-item success">
                            <CheckCircle size={16} />
                            Válida
                          </span>
                        ) : (
                          <span className="validation-item error">
                            <AlertTriangle size={16} />
                            Com erros
                          </span>
                        )}
                      </div>

                      {validation.errors?.map((error, i) => (
                        <div key={i} className="validation-item error">
                          <XCircle size={14} />
                          {error}
                        </div>
                      ))}
                      {validation.warnings?.map((warning, i) => (
                        <div key={i} className="validation-item warning">
                          <AlertTriangle size={14} />
                          {warning}
                        </div>
                      ))}
                    </div>

                    <div style={{ marginTop: '16px', display: 'flex', gap: '8px' }}>
                      <button className="btn btn-ghost" onClick={() => startEdit(question)}>
                        <Edit2 size={16} />
                        Editar
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
