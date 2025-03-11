"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { Plus, Loader } from "lucide-react"
import TaskItem from "./TaskItem"
import CreateTaskModal from "./CreateTaskModal"
import MoveTaskModal from "./MoveTaskModal"
import api from "../services/api"
import { toast } from "react-toastify"
import "react-toastify/dist/ReactToastify.css"
import "./TodoList.css"

const TodoList = ({ list, lists }) => {
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showMoveModal, setShowMoveModal] = useState(false)
  const [selectedTask, setSelectedTask] = useState(null)
  const [parentTaskId, setParentTaskId] = useState(null)
  const [parentTaskTitle, setParentTaskTitle] = useState("")
  const [completedTasksCount, setCompletedTasksCount] = useState(0)
  const [totalTasksCount, setTotalTasksCount] = useState(0)

  // Use a ref to track if component is mounted
  const isMounted = useRef(true)
  // Use a ref to track if an update is in progress
  const statusUpdateInProgress = useRef({})
  // Use a ref to track if we're currently updating the progress bar
  const progressUpdateInProgress = useRef(false)

  // Set isMounted to false when component unmounts
  useEffect(() => {
    isMounted.current = true
    return () => {
      isMounted.current = false
    }
  }, [])

  // Helper function to count tasks and completed tasks
  const countTasksAndCompleted = useCallback((taskList) => {
    let total = 0
    let completed = 0

    const countRecursive = (items) => {
      for (const item of items) {
        total++
        if (item.status === "Done") completed++

        if (item.subtasks && item.subtasks.length > 0) {
          countRecursive(item.subtasks)
        }
      }
    }

    countRecursive(taskList)
    return { total, completed }
  }, [])

  // Helper function to update progress stats
  const updateProgressStats = useCallback(() => {
    if (progressUpdateInProgress.current) return
    progressUpdateInProgress.current = true

    try {
      const { total, completed } = countTasksAndCompleted(tasks)

      if (total !== totalTasksCount || completed !== completedTasksCount) {
        setTotalTasksCount(total)
        setCompletedTasksCount(completed)
        console.log(
          `Progress updated: ${completed}/${total} tasks completed (${Math.round((completed / total || 0) * 100)}%)`,
        )
      }
    } finally {
      progressUpdateInProgress.current = false
    }
  }, [tasks, countTasksAndCompleted, totalTasksCount, completedTasksCount])

  // Update progress whenever tasks change
  useEffect(() => {
    updateProgressStats()
  }, [tasks, updateProgressStats])

  // Memoize fetchTasks to prevent infinite loops
  const fetchTasks = useCallback(async () => {
    if (!list || !list.id) return

    try {
      setLoading(true)
      const response = await api.get(`/api/todos/tasks/${list.id}`)

      if (!isMounted.current) return

      // Map backend response to our frontend structure
      const mappedTasks = response.data.map((task) => ({
        id: task.id,
        title: task.title,
        description: task.description || "",
        status: task.status,
        subtasks: task.subtasks || [],
      }))

      setTasks(mappedTasks)
    } catch (error) {
      console.error("Failed to fetch tasks:", error)
      if (isMounted.current) {
        toast.error("Failed to load tasks")
      }
    } finally {
      if (isMounted.current) {
        setLoading(false)
      }
    }
  }, [list])

  useEffect(() => {
    if (list && list.id) {
      fetchTasks()
    }

    // Clear the status update tracking when list changes
    return () => {
      statusUpdateInProgress.current = {}
    }
  }, [list, fetchTasks])

  // Helper function to find a task by ID in the task hierarchy
  const findTaskById = useCallback((taskList, taskId) => {
    for (const task of taskList) {
      if (task.id === taskId) {
        return task
      }
      if (task.subtasks && task.subtasks.length > 0) {
        const found = findTaskById(task.subtasks, taskId)
        if (found) return found
      }
    }
    return null
  }, [])

  // Helper function to find a parent task by child ID
  const findParentTask = useCallback((taskList, childId, parentTask = null) => {
    for (const task of taskList) {
      if (task.subtasks && task.subtasks.some((st) => st.id === childId)) {
        return task
      }
      if (task.subtasks && task.subtasks.length > 0) {
        const found = findParentTask(task.subtasks, childId, task)
        if (found) return found
      }
    }
    return null
  }, [])

  const handleCreateTask = async (taskData) => {
    try {
      const payload = {
        title: taskData.title,
        description: taskData.description || "",
        status: "Todo",
        list_id: list.id,
        parent_id: parentTaskId,
      }

      // If we're adding a subtask to a completed parent, we need to update the parent status
      if (parentTaskId) {
        const parentTask = findTaskById(tasks, parentTaskId)

        // If parent is marked as done, update its status to Todo
        if (parentTask && parentTask.status === "Done") {
          await api.patch(`/api/todos/task/${parentTaskId}/status`, { status: "Todo" })
          toast.info("Parent task reopened because a new subtask was added")
        }
      }

      await api.post("/api/todos/task", payload)
      if (isMounted.current) {
        toast.success(`${parentTaskId ? "Subtask" : "Task"} created successfully`)
        fetchTasks() // This will update the progress bar as well
      }
      return true
    } catch (error) {
      console.error("Failed to create task:", error)
      if (isMounted.current) {
        toast.error(error.response?.data?.error || "Failed to create task")
      }
      throw error
    }
  }

  const handleStatusChange = useCallback(
    async (taskId, newStatus) => {
      // Prevent duplicate updates for the same task
      if (statusUpdateInProgress.current[taskId]) return
      statusUpdateInProgress.current[taskId] = true

      try {
        // Find the task in our state
        const task = findTaskById(tasks, taskId)
        if (!task) {
          console.error(`Task with ID ${taskId} not found`)
          return
        }

        // If task has subtasks and not all are completed, prevent manual completion
        if (
          newStatus === "Done" &&
          task.subtasks &&
          task.subtasks.length > 0 &&
          !task.subtasks.every((st) => st.status === "Done")
        ) {
          toast.error("Complete all subtasks before marking this task as done", {
            position: "bottom-center",
            autoClose: 3000,
          })
          return
        }

        // Make the API call to update the database
        await api.patch(`/api/todos/task/${taskId}/status`, { status: newStatus })

        // Update our local state
        setTasks((prevTasks) => {
          const updateTaskStatus = (taskList) => {
            return taskList.map((t) => {
              if (t.id === taskId) {
                return { ...t, status: newStatus }
              }
              if (t.subtasks && t.subtasks.length > 0) {
                return { ...t, subtasks: updateTaskStatus(t.subtasks) }
              }
              return t
            })
          }
          return updateTaskStatus(prevTasks)
        })

        // If we're reopening a task, check if it has a parent that needs to be reopened
        if (newStatus === "Todo") {
          const parentTask = findParentTask(tasks, taskId)
          if (parentTask && parentTask.status === "Done") {
            // Wait a bit to avoid race conditions
            setTimeout(() => {
              handleStatusChange(parentTask.id, "Todo")
            }, 100)
          }
        }

        // If we're completing a task, check if all siblings are also complete
        // to potentially mark the parent as complete
        if (newStatus === "Done") {
          const parentTask = findParentTask(tasks, taskId)
          if (parentTask && parentTask.status !== "Done") {
            const allSiblingsComplete = parentTask.subtasks.every((st) =>
              st.id === taskId ? newStatus === "Done" : st.status === "Done",
            )

            if (allSiblingsComplete) {
              // Wait a bit to avoid race conditions
              setTimeout(() => {
                handleStatusChange(parentTask.id, "Done")
              }, 100)
            }
          }
        }

        // If we're marking a task as Todo and it has subtasks that are Done,
        // ask the user if they want to reopen all subtasks as well
        if (
          newStatus === "Todo" &&
          task.subtasks &&
          task.subtasks.length > 0 &&
          task.subtasks.some((st) => st.status === "Done")
        ) {
          const shouldReopenSubtasks = window.confirm("Do you want to reopen all subtasks as well?")

          if (shouldReopenSubtasks) {
            // Reopen all subtasks recursively
            const reopenSubtasks = async (subtasks) => {
              for (const subtask of subtasks) {
                if (subtask.status === "Done") {
                  await api.patch(`/api/todos/task/${subtask.id}/status`, { status: "Todo" })

                  // Update our local state for this subtask
                  setTasks((prevTasks) => {
                    const updateSubtaskStatus = (taskList) => {
                      return taskList.map((t) => {
                        if (t.id === subtask.id) {
                          return { ...t, status: "Todo" }
                        }
                        if (t.subtasks && t.subtasks.length > 0) {
                          return { ...t, subtasks: updateSubtaskStatus(t.subtasks) }
                        }
                        return t
                      })
                    }
                    return updateSubtaskStatus(prevTasks)
                  })
                }

                // Recursively reopen nested subtasks
                if (subtask.subtasks && subtask.subtasks.length > 0) {
                  await reopenSubtasks(subtask.subtasks)
                }
              }
            }

            await reopenSubtasks(task.subtasks)
          }
        }

        toast.success(`Task ${newStatus === "Done" ? "completed" : "reopened"}`)
      } catch (error) {
        console.error("Failed to update task status:", error)
        toast.error("Failed to update task status")
      } finally {
        // Clear the update flag after a delay
        setTimeout(() => {
          statusUpdateInProgress.current[taskId] = false
        }, 300)
      }
    },
    [tasks, findTaskById, findParentTask],
  )

  const handleCreateSubtask = (parentId, parentTitle) => {
    setParentTaskId(parentId)
    setParentTaskTitle(parentTitle)
    setShowCreateModal(true)
  }

  const handleMoveTask = (task) => {
    setSelectedTask(task)
    setShowMoveModal(true)
  }

  const getMotivationalQuote = () => {
    const quotes = [
      "The secret of getting ahead is getting started.",
      "Don't wait. The time will never be just right.",
      "Start where you are. Use what you have. Do what you can.",
      "The beginning is always the hardest. Keep going!",
      "Small progress is still progress.",
    ]

    return quotes[Math.floor(Math.random() * quotes.length)]
  }

  const calculateProgress = () => {
    if (totalTasksCount === 0) return 0
    return (completedTasksCount / totalTasksCount) * 100
  }

  return (
    <div className="todo-list">
      <div className="todo-list-header">
        <h2 className="todo-list-title">{list?.title || "Tasks"}</h2>
        <button
          className="button primary"
          onClick={() => {
            setParentTaskId(null)
            setParentTaskTitle("")
            setShowCreateModal(true)
          }}
        >
          <Plus size={16} />
          <span>Add Task</span>
        </button>
      </div>

      {totalTasksCount > 0 && (
        <div className="progress-container">
          <div className="progress-info">
            <span>
              {completedTasksCount} of {totalTasksCount} tasks completed
            </span>
            <span>{Math.round(calculateProgress())}%</span>
          </div>
          <div className="progress-bar-container">
            <div
              className="progress-bar-fill"
              style={{ width: `${calculateProgress()}%` }}
              data-progress={`${Math.round(calculateProgress())}%`}
            ></div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="loading-container">
          <Loader className="loading-spinner" />
        </div>
      ) : tasks.length === 0 ? (
        <div className="empty-tasks">
          <p>No tasks yet. Create your first task to get started!</p>
          <button
            className="button primary"
            onClick={() => {
              setParentTaskId(null)
              setParentTaskTitle("")
              setShowCreateModal(true)
            }}
          >
            <Plus size={16} />
            <span>Create Task</span>
          </button>
          <p className="motivational-quote">{getMotivationalQuote()}</p>
        </div>
      ) : (
        <div className="tasks-container">
          {tasks.map((task) => (
            <TaskItem
              key={task.id}
              task={task}
              onStatusChange={handleStatusChange}
              onCreateSubtask={handleCreateSubtask}
              depth={0}
              fetchTasks={fetchTasks}
              listId={list.id}
              onMoveTask={handleMoveTask}
            />
          ))}
        </div>
      )}

      <CreateTaskModal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false)
          setParentTaskId(null)
          setParentTaskTitle("")
        }}
        onCreate={handleCreateTask}
        isSubtask={!!parentTaskId}
        parentTaskTitle={parentTaskTitle}
        listId={list.id}
      />

      {selectedTask && (
        <MoveTaskModal
          isOpen={showMoveModal}
          onClose={() => {
            setShowMoveModal(false)
            setSelectedTask(null)
          }}
          lists={lists}
          currentListId={list.id}
          taskTitle={selectedTask.title}
          task={selectedTask}
          fetchTasks={fetchTasks}
        />
      )}
    </div>
  )
}

export default TodoList;

