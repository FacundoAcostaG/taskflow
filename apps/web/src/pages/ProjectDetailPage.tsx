import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { projectsApi, tasksApi } from '../api/client'
import type { Project, Task, TaskStatus } from '../types'
import TaskCard from '../components/TaskCard'
import axios from 'axios'

const STATUS_OPTIONS: TaskStatus[] = ['TODO', 'IN_PROGRESS', 'DONE']
const PRIORITY_OPTIONS = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']

export default function ProjectDetailPage() {
  const { projectId } = useParams<{ projectId: string }>()
  const [project, setProject] = useState<Project | null>(null)
  const [tasks, setTasks] = useState<Task[]>([])
  const [statusFilter, setStatusFilter] = useState('')
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [title, setTitle] = useState('')
  const [priority, setPriority] = useState('MEDIUM')
  const [formError, setFormError] = useState('')

  useEffect(() => {
    if (!projectId) return
    projectsApi.get(projectId).then(setProject).catch(console.error)
  }, [projectId])

  useEffect(() => {
    if (!projectId) return
    const params: { status?: string; search?: string } = {}
    if (statusFilter) params.status = statusFilter
    if (search) params.search = search
    tasksApi.list(projectId, params).then(setTasks).catch(console.error)
  }, [projectId, statusFilter, search])

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!projectId) return
    setFormError('')
    try {
      const task = await tasksApi.create(projectId, { title, priority })
      setTasks((prev) => [...prev, task])
      setTitle('')
      setPriority('MEDIUM')
      setShowForm(false)
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setFormError(err.response?.data?.message ?? 'Error al crear tarea')
      } else {
        setFormError('Error al crear tarea')
      }
    }
  }

  return (
    <main className="max-w-4xl mx-auto px-4 py-8">
      {project && (
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">{project.name}</h1>
          {project.description && (
            <p className="text-sm text-gray-500 mt-1">{project.description}</p>
          )}
        </div>
      )}

      <div className="flex flex-wrap gap-3 items-center mb-4">
        <select
          data-testid="task-status-filter"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
        >
          <option value="">Todos los estados</option>
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <input
          data-testid="task-search-input"
          type="text"
          placeholder="Buscar tareas..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
        />
        <button
          data-testid="create-task-btn"
          onClick={() => setShowForm((v) => !v)}
          className="ml-auto bg-teal-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-teal-700"
        >
          + Nueva tarea
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleCreateTask}
          className="bg-white border border-gray-200 rounded-xl p-5 mb-6 space-y-3"
        >
          <h2 className="font-semibold text-gray-800">Nueva tarea</h2>
          <input
            data-testid="task-title-input"
            type="text"
            placeholder="Título"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
          >
            {PRIORITY_OPTIONS.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
          {formError && <p className="text-sm text-red-600">{formError}</p>}
          <div className="flex gap-2">
            <button
              data-testid="task-submit"
              type="submit"
              className="bg-teal-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-teal-700"
            >
              Crear
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="text-sm px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      <ul data-testid="task-list" className="space-y-3">
        {tasks.map((task) => (
          <li key={task.id}>
            <TaskCard task={task} projectId={projectId!} />
          </li>
        ))}
        {tasks.length === 0 && (
          <p className="text-gray-500 text-sm">
            No hay tareas en este proyecto.
          </p>
        )}
      </ul>
    </main>
  )
}
