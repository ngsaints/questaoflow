import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { FileQuestion, Play, Loader, CheckCircle, AlertCircle } from 'lucide-react'

const DISCIPLINAS = ['Matemática', 'Português', 'História', 'Geografia', 'Ciências', 'Física', 'Química', 'Biologia']
const BANCAS = ['ENEM', 'FUVEST', 'UNICAMP', 'ITA', 'IBMEC', 'CESGRANRIO', 'FCC', 'CESPE', 'OBJETIVA']
const NIVELES = ['Fácil', 'Médio', 'Difícil', 'Expert']

const fetchFiles = async () => {
  const { data } = await axios.get('/api/upload')
  return data.files.filter(f => f.status === 'pending')
}

const processFile = async ({ fileId, metadata }) => {
  const { data } = await axios.post(`/api/process/${fileId}`, { metadata })
  return data
}

export default function Process() {
  const queryClient = useQueryClient()
  const [selectedFile, setSelectedFile] = useState(null)
  const [metadata, setMetadata] = useState({
    disciplina: '',
    assunto: '',
    subassunto: '',
    banca: '',
    ano: '',
    nivel: ''
  })
  const [processingId, setProcessingId] = useState(null)

  const { data: pendingFiles = [], isLoading } = useQuery({
    queryKey: ['pending-files'],
    queryFn: fetchFiles
  })

  const processMutation = useMutation({
    mutationFn: processFile,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['files'] })
      queryClient.invalidateQueries({ queryKey: ['metrics'] })
      queryClient.invalidateQueries({ queryKey: ['questions'] })
      setProcessingId(null)
      if (data.requiresOcr) {
        setSelectedFile(null)
      } else {
        setSelectedFile(null)
        setMetadata({ disciplina: '', assunto: '', subassunto: '', banca: '', ano: '', nivel: '' })
      }
    },
    onError: () => {
      setProcessingId(null)
    }
  })

  const handleProcess = () => {
    if (!selectedFile) return
    setProcessingId(selectedFile.id)
    processMutation.mutate({ fileId: selectedFile.id, metadata })
  }

  return (
    <div>
      <div className="page-header">
        <h1>Processar Arquivos</h1>
        <p>Selecione um arquivo e defina os metadados para processamento</p>
      </div>

      {pendingFiles.length === 0 && !isLoading && (
        <div className="empty-state">
          <FileQuestion size={80} />
          <h3>Não há arquivos pendentes</h3>
          <p>Faça upload de novos arquivos na página de Upload</p>
        </div>
      )}

      {pendingFiles.length > 0 && (
        <div>
          <h2 style={{ marginBottom: '16px', fontSize: '1.25rem' }}>Arquivos Disponíveis</h2>
          <div className="files-grid">
            {pendingFiles.map((file) => (
              <div
                key={file.id}
                className={`file-card ${selectedFile?.id === file.id ? 'selected' : ''}`}
                onClick={() => setSelectedFile(file)}
                style={{
                  cursor: 'pointer',
                  borderColor: selectedFile?.id === file.id ? 'var(--accent)' : 'var(--border)'
                }}
              >
                <div className="file-icon">
                  <FileQuestion size={24} />
                </div>
                <div className="file-info">
                  <div className="file-name">{file.originalName}</div>
                  <div className="file-meta">
                    {(file.size / (1024 * 1024)).toFixed(1)} MB
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {selectedFile && (
        <div className="metadata-form">
          <h2 style={{ marginBottom: '16px', fontSize: '1.25rem' }}>
            Metadados para: {selectedFile.originalName}
          </h2>

          <div className="form-grid">
            <div className="form-group">
              <label>Disciplina *</label>
              <select
                value={metadata.disciplina}
                onChange={(e) => setMetadata({ ...metadata, disciplina: e.target.value })}
              >
                <option value="">Selecione...</option>
                {DISCIPLINAS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>

            <div className="form-group">
              <label>Assunto *</label>
              <input
                type="text"
                placeholder="Ex: Equações"
                value={metadata.assunto}
                onChange={(e) => setMetadata({ ...metadata, assunto: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label>Subassunto</label>
              <input
                type="text"
                placeholder="Ex: Equações de 1º grau"
                value={metadata.subassunto}
                onChange={(e) => setMetadata({ ...metadata, subassunto: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label>Banca</label>
              <select
                value={metadata.banca}
                onChange={(e) => setMetadata({ ...metadata, banca: e.target.value })}
              >
                <option value="">Selecione...</option>
                {BANCAS.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>

            <div className="form-group">
              <label>Ano</label>
              <input
                type="number"
                placeholder="2024"
                min="1900"
                max="2030"
                value={metadata.ano}
                onChange={(e) => setMetadata({ ...metadata, ano: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label>Nível</label>
              <select
                value={metadata.nivel}
                onChange={(e) => setMetadata({ ...metadata, nivel: e.target.value })}
              >
                <option value="">Selecione...</option>
                {NIVELES.map(n => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
          </div>

          <div style={{ marginTop: '24px', display: 'flex', gap: '12px' }}>
            <button
              className="btn btn-primary"
              onClick={handleProcess}
              disabled={!metadata.disciplina || !metadata.assunto || processMutation.isPending}
            >
              {processMutation.isPending ? (
                <>
                  <Loader size={18} className="spin" />
                  Processando...
                </>
              ) : (
                <>
                  <Play size={18} />
                  Processar
                </>
              )}
            </button>
          </div>

          {processMutation.isError && (
            <div className="toast error" style={{ marginTop: '16px' }}>
              <AlertCircle size={20} />
              <span>{processMutation.error.message}</span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
