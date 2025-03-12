"use client"

import { useState, useEffect } from "react"
import { X, AlertCircle } from "lucide-react"
import api from "../services/api"
import "./Modal.css"

const CreateTaskModal = ({ isOpen, onClose, onCreate, isSubtask, parentTaskTitle, listId }) => {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [existingTasks, setExistingTasks] = useState([])
  const [error, setError] = useState("")

  useEffect(() => {
    // Fetch existing tasks to check for duplicates within the same level
    if (isOpen && listId) {
      const fetchTasks = async () => {
        try {
          const response = await api.get(`/api/todos/tasks/${listId}`)

          // Extract task titles at the current level (top-level or under the same parent)
          let relevantTasks = []

          if (isSubtask) {
            // Find the parent task and get its subtasks
            const findParentAndSubtasks = (tasks, parentTitle) => {
              for (const task of tasks) {
                if (task.title === parentTitle) {
                  return task.subtasks || []
                }
                if (task.subtasks && task.subtasks.length > 0) {
                  const result = findParentAndSubtasks(task.subtasks, parentTitle)
                  if (result.length > 0) return result
                }
              }
              return []
            }

            relevantTasks = findParentAndSubtasks(response.data, parentTaskTitle)
          } else {
            // Get top-level tasks
            relevantTasks = response.data
          }

          // Store task titles in lowercase for case-insensitive comparison
          setExistingTasks(relevantTasks.map((task) => task.title.toLowerCase()))
        } catch (error) {
          console.error("Failed to fetch tasks:", error)
        }
      }

      fetchTasks()
    }
  }, [isOpen, listId, isSubtask, parentTaskTitle])

  useEffect(() => {
    // Reset form when modal opens
    if (isOpen) {
      setTitle("")
      setDescription("")
      setError("")
    }
  }, [isOpen])

  if (!isOpen) return null

  const validateTitle = (title) => {
    const trimmedTitle = title.trim()

    if (!trimmedTitle) {
      setError("Task title cannot be empty")
      return false
    }

    if (trimmedTitle.length < 3) {
      setError("Task title must be at least 3 characters")
      return false
    }

    if (trimmedTitle.length > 100) {
      setError("Task title must be less than 100 characters")
      return false
    }

    // Only check for duplicates at the same level
    if (existingTasks.includes(trimmedTitle.toLowerCase())) {
      setError(`A ${isSubtask ? "subtask" : "task"} with this name already exists at this level`)
      return false
    }

    setError("")
    return true
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!validateTitle(title)) return

    setIsSubmitting(true)
    try {
      await onCreate({ title, description })
      setTitle("")
      setDescription("")
      setError("")
      onClose()
    } catch (error) {
      setError(error.response?.data?.error || "Failed to create task. Please try again.")
      console.error(error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-header">
          <h2>{isSubtask ? `Add Subtask to "${parentTaskTitle}"` : "Create New Task"}</h2>
          <button onClick={onClose} className="close-button" aria-label="Close">
            <X size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {error && (
              <div className="modal-error">
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}

            <div className="form-group">
              <label htmlFor="title">
                Title <span className="required">*</span>
              </label>
              <input
                type="text"
                id="title"
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value)
                  // Clear error when user types
                  if (error) validateTitle(e.target.value)
                }}
                placeholder="Task title"
                autoFocus
                className={error ? "input-error" : ""}
                maxLength={100}
              />
              <div className="input-help">
                <span className={error ? "text-error" : ""}>{error || "Enter a unique title for this task"}</span>
                <span className="char-count">{title.length}/100</span>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="description">Description (optional)</label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Add details about this task"
                rows={4}
                maxLength={500}
              />
              <div className="input-help">
                <span>Add any additional details</span>
                <span className="char-count">{description.length}/500</span>
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="button secondary" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </button>
            <button type="submit" className="button primary" disabled={isSubmitting || !title.trim()}>
              {isSubmitting ? "Creating..." : isSubtask ? "Add Subtask" : "Create Task"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default CreateTaskModal;

