import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { tasksApi, commentsApi } from '../api/client'
import type { Task, Comment, TaskStatus } from '../types'
import CommentList from '../components/CommentList'
import axios from 'axios'

const NEXT_STATUS: Record<TaskStatus, TaskStatus[]> = {
  TODO: ['IN_PROGRESS'],
  IN_PROGRESS: ['TODO', 'DONE'],
  DONE: [],
}

export default function TaskDetailPage() {
  const { projectId, taskId } = useParams<{
    projectId: string
    taskId: string
  }>()
  const [task, setTask] = useState<Task | null>(null)
  const [comments, setComments] = useState<Comment[]>([])
  const [commentBody, setCommentBody] = useState('')
  const [statusError, setStatusError] = useState('')
  const [commentError, setCommentError] = useState('')

  useEffect(() => {
    if (!projectId || !taskId) return
    tasksApi
      .list(projectId)
      .then((tasks) => {
        const found = tasks.find((t) => t.id === taskId)
        if (found) setTask(found)
      })
      .catch(console.error)
    commentsApi.list(projectId, taskId).then(setComments).catch(console.error)
  }, [projectId, taskId])

  const handleStatusChange = async (newStatus: TaskStatus) => {
    if (!taskId) return
    setStatusError('')
    try {
      const updated = await tasksApi.update(taskId, { status: newStatus })
      setTask(updated)
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setStatusError(err.response?.data?.message ?? 'Transición inválida')
      } else {
        setStatusError('Error al actualizar estado')
      }
    }
  }

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!projectId || !taskId || !commentBody.trim()) return
    setCommentError('')
    try {
      const comment = await commentsApi.create(projectId, taskId, {
        body: commentBody,
      })
      setComments((prev) => [...prev, comment])
      setCommentBody('')
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setCommentError(
          err.response?.data?.message ?? 'Error al agregar comentario'
        )
      } else {
        setCommentError('Error al agregar comentario')
      }
    }
  }

  if (!task) return <div className="p-8 text-gray-500">Cargando...</div>

  const nextStatuses = NEXT_STATUS[task.status]

  return (
    <main className="max-w-2xl mx-auto px-4 py-8 space-y-8">
      <section>
        <h1
          data-testid="task-title"
          className="text-2xl font-bold text-gray-900"
        >
          {task.title}
        </h1>
        {task.description && (
          <p className="text-gray-600 mt-2 text-sm">{task.description}</p>
        )}
        <div className="flex gap-3 mt-3 items-center">
          <span className="text-xs font-medium text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full">
            {task.status}
          </span>
          <span className="text-xs font-medium text-gray-600 bg-gray-100 px-2 py-0.5 rounded-full">
            {task.priority}
          </span>
        </div>
      </section>

      <section>
        <h2 className="font-semibold text-gray-800 mb-3">Cambiar estado</h2>
        <div className="flex gap-2 flex-wrap">
          {nextStatuses.length === 0 ? (
            <p className="text-sm text-gray-500">Esta tarea está completada.</p>
          ) : (
            nextStatuses.map((s) => (
              <button
                key={s}
                data-testid="task-status-select"
                onClick={() => handleStatusChange(s)}
                className="text-sm px-4 py-2 rounded-lg border border-teal-600 text-teal-600 hover:bg-teal-50"
              >
                → {s}
              </button>
            ))
          )}
        </div>
        {statusError && (
          <p className="text-sm text-red-600 mt-2">{statusError}</p>
        )}
      </section>

      <section>
        <h2 className="font-semibold text-gray-800 mb-3">Comentarios</h2>
        <CommentList comments={comments} />
        <form onSubmit={handleAddComment} className="mt-4 space-y-2">
          <textarea
            data-testid="comment-input"
            value={commentBody}
            onChange={(e) => setCommentBody(e.target.value)}
            placeholder="Escribí un comentario..."
            rows={3}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
          {commentError && (
            <p className="text-sm text-red-600">{commentError}</p>
          )}
          <button
            data-testid="comment-submit"
            type="submit"
            className="bg-teal-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-teal-700"
          >
            Comentar
          </button>
        </form>
      </section>
    </main>
  )
}
