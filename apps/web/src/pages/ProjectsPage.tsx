import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { projectsApi } from '../api/client'
import type { Project } from '../types'
import axios from 'axios'

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [showForm, setShowForm] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [error, setError] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    projectsApi.list().then(setProjects).catch(console.error)
  }, [])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    try {
      const project = await projectsApi.create({ name, description })
      setProjects((prev) => [...prev, project])
      setName('')
      setDescription('')
      setShowForm(false)
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.message ?? 'Error al crear proyecto')
      } else {
        setError('Error al crear proyecto')
      }
    }
  }

  return (
    <main className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Mis proyectos</h1>
        <button
          data-testid="create-project-btn"
          onClick={() => setShowForm((v) => !v)}
          className="bg-teal-700 text-white text-sm px-4 py-2 rounded-lg hover:bg-teal-800 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2"
        >
          + Nuevo proyecto
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleCreate}
          className="bg-white border border-gray-200 rounded-xl p-5 mb-6 space-y-3"
        >
          <h2 className="font-semibold text-gray-800">Nuevo proyecto</h2>
          <input
            data-testid="project-name-input"
            type="text"
            placeholder="Nombre"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
          <input
            type="text"
            placeholder="Descripción (opcional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex gap-2">
            <button
              data-testid="project-submit"
              type="submit"
              className="bg-teal-700 text-white text-sm px-4 py-2 rounded-lg hover:bg-teal-800 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2"
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

      <ul data-testid="project-list" className="grid gap-4 sm:grid-cols-2">
        {projects.map((project) => (
          <li
            key={project.id}
            data-testid="project-card"
            onClick={() => navigate(`/projects/${project.id}`)}
            className="bg-white border border-gray-200 rounded-xl p-5 cursor-pointer hover:shadow-md transition-shadow"
          >
            <h2 className="font-semibold text-gray-900">{project.name}</h2>
            {project.description && (
              <p className="text-sm text-gray-500 mt-1">
                {project.description}
              </p>
            )}
          </li>
        ))}
        {projects.length === 0 && (
          <p className="text-gray-500 text-sm col-span-2">
            No tenés proyectos todavía.
          </p>
        )}
      </ul>
    </main>
  )
}
