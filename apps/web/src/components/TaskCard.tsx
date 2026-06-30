import { useNavigate } from 'react-router-dom'
import type { Task, TaskPriority } from '../types'

interface Props {
  task: Task
  projectId: string
}

// TODO (estudiante): completar la función que devuelve las clases CSS del badge de prioridad
// Debe retornar:
//   LOW      → badge gris   (bg-gray-100 text-gray-700)
//   MEDIUM   → badge amarillo (bg-yellow-100 text-yellow-700)
//   HIGH     → badge rojo   (bg-red-100 text-red-700)
//   CRITICAL → badge rojo oscuro (bg-red-200 text-red-900)
function getPriorityBadgeClass(_priority: TaskPriority): string {
  // TODO (estudiante): implementar lógica de colores por prioridad
  return 'bg-gray-100 text-gray-700'
}

export default function TaskCard({ task, projectId }: Props) {
  const navigate = useNavigate()

  return (
    <div
      data-testid="task-card"
      onClick={() => navigate(`/projects/${projectId}/tasks/${task.id}`)}
      className="bg-white border border-gray-200 rounded-lg p-4 cursor-pointer hover:shadow-md transition-shadow"
    >
      <div className="flex items-start justify-between gap-2">
        <span data-testid="task-title" className="font-medium text-gray-900">
          {task.title}
        </span>
        {/* TODO (estudiante): usar getPriorityBadgeClass(task.priority) para colorear el badge */}
        <span
          className={`text-xs px-2 py-0.5 rounded-full font-medium ${getPriorityBadgeClass(task.priority)}`}
        >
          {task.priority}
        </span>
      </div>
      <div className="mt-2">
        <span className="text-xs font-medium text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full">
          {task.status}
        </span>
      </div>
    </div>
  )
}
