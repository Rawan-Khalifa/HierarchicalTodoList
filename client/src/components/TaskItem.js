"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { ChevronDown, ChevronRight, MoreVertical, Check, AlertCircle, ArrowUpDown } from "lucide-react"
import api from "../services/api"
import { toast } from "react-toastify"
import "./TaskItem.css"

// Create a separate component for the error state
const TaskItemError = () => (
  <div className="task-item-error">
    <AlertCircle size={16} className="error-icon" />
    <span>Invalid task data</span>
  </div>
)

const TaskItem = ({ task, onStatusChange, onCreateSubtask, depth = 0, fetchTasks, listId, onMoveTask }) => {
  // All hooks must be called at the top level, before any conditional logic
  const [expanded, setExpanded] = useState(true)
  const [showMenu, setShowMenu] = useState(false)
  const [subtasks, setSubtasks] = useState([])
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false)

  // Use a ref to track if component is mounted
  const isMounted = useRef(true)
  // Use a ref for the dropdown menu to handle clicks outside
  const menuRef = useRef(null)

  // Check if task is valid - but don't return early!
  const isTaskValid = task && task.id

  // Set isMounted to false when component unmounts
  useEffect(() => {
    isMounted.current = true

    // Add click event listener to close dropdown when clicking outside
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowMenu(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)

    return () => {
      isMounted.current = false
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  // Update subtasks state when task changes
  useEffect(() => {
    if (isMounted.current && isTaskValid && task.subtasks) {
      setSubtasks(task.subtasks || [])
    }
  }, [isTaskValid, task?.subtasks])

  // These variables are only used if the task is valid
  const maxDepth = 2 // 0-based index, so this is 3 levels
  const canHaveChildren = isTaskValid && depth < maxDepth
  const hasSubtasks = isTaskValid && subtasks && subtasks.length > 0
  const allSubtasksCompleted = hasSubtasks && subtasks.every((st) => st.status === "Done")

  const handleToggleExpand = () => {
    setExpanded(!expanded)
  }

  const handleStatusChange = useCallback(async () => {
    if (!isTaskValid) return

    // Prevent multiple simultaneous calls
    if (isUpdatingStatus) return

    setIsUpdatingStatus(true)
    try {
      const newStatus = task.status === "Done" ? "Todo" : "Done"

      // If task has subtasks and not all are completed, prevent manual completion
      if (newStatus === "Done" && hasSubtasks && !allSubtasksCompleted) {
        toast.error("Complete all subtasks before marking this task as done", {
          position: "bottom-center",
          autoClose: 3000,
        })
        return
      }

      // Call the parent component's onStatusChange
      await onStatusChange(task.id, newStatus)
    } finally {
      if (isMounted.current) {
        setIsUpdatingStatus(false)
      }
    }
  }, [isTaskValid, task?.status, task?.id, hasSubtasks, allSubtasksCompleted, onStatusChange, isUpdatingStatus])

  const handleSubtaskStatusChange = useCallback(
    async (subtaskId, newStatus) => {
      if (!isTaskValid) return

      // Call the parent component's onStatusChange
      await onStatusChange(subtaskId, newStatus)
    },
    [isTaskValid, onStatusChange],
  )

  const handleDeleteTask = async () => {
    if (!isTaskValid) return

    // Confirm before deleting
    if (!window.confirm(`Are you sure you want to delete "${task.title}"? This cannot be undone.`)) {
      return
    }

    try {
      await api.delete(`/api/todos/task/${task.id}`)
      if (isMounted.current) {
        toast.success("Task deleted successfully")
        fetchTasks()
      }
    } catch (error) {
      if (isMounted.current) {
        toast.error("Failed to delete task")
        console.error(error)
      }
    }
  }

  const handleMoveTask = () => {
    if (!isTaskValid) return

    onMoveTask(task)
    setShowMenu(false)
  }

  const getStatusClass = (status) => {
    switch (status) {
      case "Done":
        return "status-done"
      case "In Progress":
        return "status-progress"
      default:
        return "status-todo"
    }
  }

  // If task is not valid, render the error component
  if (!isTaskValid) {
    console.error("Invalid task object:", task)
    return <TaskItemError />
  }

  // Determine if the checkbox should be disabled
  const isCheckboxDisabled = isUpdatingStatus || (hasSubtasks && !allSubtasksCompleted && task.status !== "Done")

  // Only render the full component if task is valid
  return (
    <div className="task-item-container">
      <div className={`task-item ${task.status === "Done" ? "completed" : ""}`}>
        <div className="task-header">
          {hasSubtasks ? (
            <button
              className="expand-button"
              onClick={handleToggleExpand}
              aria-label={expanded ? "Collapse subtasks" : "Expand subtasks"}
            >
              {expanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
            </button>
          ) : (
            <div className="expand-placeholder"></div>
          )}

          <button
            className={`task-checkbox ${task.status === "Done" ? "checked" : ""} ${isUpdatingStatus ? "updating" : ""}`}
            onClick={handleStatusChange}
            disabled={isCheckboxDisabled}
            aria-label={task.status === "Done" ? "Mark as incomplete" : "Mark as complete"}
            title={isCheckboxDisabled && hasSubtasks ? "Complete all subtasks first" : ""}
            data-task-id={task.id}
          >
            {task.status === "Done" && <Check size={14} className="check-icon" />}
          </button>

          <div className="task-details">
            <h3 className={`task-title ${task.status === "Done" ? "completed" : ""}`}>{task.title}</h3>
            {task.description && <p className="task-description">{task.description}</p>}
            <div className="task-meta">
              <span className={`task-status ${getStatusClass(task.status)}`}>{task.status}</span>
              {hasSubtasks && (
                <span className="task-subtasks-count">
                  {subtasks.filter((st) => st.status === "Done").length}/{subtasks.length} subtasks
                </span>
              )}
              <span className="task-level-indicator">Level: {depth + 1}</span>
            </div>
          </div>

          <div className="task-actions" ref={menuRef}>
            <button className="move-task-button" onClick={handleMoveTask} aria-label="Move task" title="Move this task">
              <ArrowUpDown size={16} />
            </button>
            <div className="dropdown">
              <button
                className="dropdown-button"
                onClick={() => setShowMenu(!showMenu)}
                aria-label="Task options"
                aria-expanded={showMenu}
                aria-haspopup="true"
              >
                <MoreVertical size={18} />
              </button>

              {showMenu && (
                <div className="dropdown-menu" role="menu">
                  {canHaveChildren && (
                    <button
                      className="dropdown-item"
                      onClick={() => {
                        onCreateSubtask(task.id, task.title)
                        setShowMenu(false)
                      }}
                      role="menuitem"
                    >
                      Add Subtask
                    </button>
                  )}
                  <button className="dropdown-item" onClick={handleMoveTask} role="menuitem">
                    Move Task
                  </button>
                  <button className="dropdown-item delete" onClick={handleDeleteTask} role="menuitem">
                    Delete
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {expanded && hasSubtasks && (
        <div className="subtasks-container">
          {subtasks.map((subtask) => (
            <TaskItem
              key={subtask.id}
              task={subtask}
              onStatusChange={handleSubtaskStatusChange}
              onCreateSubtask={onCreateSubtask}
              depth={depth + 1}
              fetchTasks={fetchTasks}
              listId={listId}
              onMoveTask={onMoveTask}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default TaskItem;

