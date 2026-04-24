import { useState, useCallback } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { useDropzone } from 'react-dropzone'
import { Upload as UploadIcon, File, Trash2, X, CheckCircle, AlertCircle } from 'lucide-react'

const fetchFiles = async () => {
  const { data } = await axios.get('/api/upload')
  return data.files
}

const uploadFiles = async (files) => {
  const formData = new FormData()
  files.forEach(file => formData.append('files', file))
  const { data } = await axios.post('/api/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
  return data
}

const deleteFile = async (id) => {
  await axios.delete(`/api/upload/${id}`)
}

export default function Upload() {
  const queryClient = useQueryClient()
  const [uploadProgress, setUploadProgress] = useState({})

  const { data: files = [], isLoading } = useQuery({
    queryKey: ['files'],
    queryFn: fetchFiles
  })

  const uploadMutation = useMutation({
    mutationFn: uploadFiles,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['files'] })
      setUploadProgress({})
    }
  })

  const deleteMutation = useMutation({
    mutationFn: deleteFile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['files'] })
    }
  })

  const onDrop = useCallback((acceptedFiles) => {
    if (acceptedFiles.length > 0) {
      uploadMutation.mutate(acceptedFiles)
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png']
    },
    maxSize: 50 * 1024 * 1024,
    disabled: uploadMutation.isPending
  })

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  return (
    <div>
      <div className="page-header">
        <h1>Upload de Arquivos</h1>
        <p>Envie arquivos PDF ou imagens para processamento</p>
      </div>

      <div
        {...getRootProps()}
        className={`upload-zone ${isDragActive ? 'dragover' : ''}`}
      >
        <input {...getInputProps()} />
        <UploadIcon size={64} />
        <h3>Arraste arquivos aqui ou clique para selecionar</h3>
        <p>Suporta PDF, JPG, PNG (máximo 50MB)</p>
        {uploadMutation.isPending && (
          <div style={{ marginTop: '16px' }}>
            <div className="spinner" />
          </div>
        )}
      </div>

      {uploadMutation.isError && (
        <div className="toast error" style={{ marginTop: '16px' }}>
          <AlertCircle size={20} />
          <span>Erro ao fazer upload dos arquivos</span>
        </div>
      )}

      {uploadMutation.isSuccess && (
        <div className="toast success" style={{ marginTop: '16px' }}>
          <CheckCircle size={20} />
          <span>Upload realizado com sucesso!</span>
        </div>
      )}

      {files.length > 0 && (
        <div style={{ marginTop: '32px' }}>
          <h2 style={{ marginBottom: '16px', fontSize: '1.25rem' }}>
            Arquivos Enviados ({files.length})
          </h2>

          <div className="files-grid">
            {files.map((file) => (
              <div key={file.id} className="file-card">
                <div className="file-icon">
                  <File size={24} />
                </div>
                <div className="file-info">
                  <div className="file-name" title={file.originalName}>
                    {file.originalName}
                  </div>
                  <div className="file-meta">
                    {formatFileSize(file.size)} • {new Date(file.uploadedAt).toLocaleDateString('pt-BR')}
                  </div>
                </div>
                <span className={`status-badge ${file.status}`}>
                  {file.status === 'pending' && 'Pendente'}
                  {file.status === 'processing' && 'Processando'}
                  {file.status === 'processed' && 'Processado'}
                  {file.status === 'error' && 'Erro'}
                </span>
                <button
                  className="btn btn-ghost"
                  onClick={() => deleteMutation.mutate(file.id)}
                  disabled={deleteMutation.isPending}
                  style={{ padding: '8px' }}
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {files.length === 0 && !isLoading && (
        <div className="empty-state" style={{ marginTop: '48px' }}>
          <File size={80} />
          <h3>Nenhum arquivo enviado</h3>
          <p>Arraste arquivos ou clique na zona de upload para começar</p>
        </div>
      )}
    </div>
  )
}
