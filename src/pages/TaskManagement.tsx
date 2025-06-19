import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Plus, Search, Filter, Calendar, Clock, User,
  AlertCircle, CheckCircle, Tag, MoreVertical
} from 'lucide-react';
import { motion } from 'framer-motion';
import { loadTasks, createTask, updateTaskStatus, deleteTask, Task as TaskType } from '../utils/tasks';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';

interface Task {
  id: string;
  title: string;
  description?: string;
  assignee?: string;
  dueDate?: string;
  priority: 'low' | 'medium' | 'high';
  tags: string[];
}

interface Column {
  id: string;
  title: string;
  tasks: Task[];
}

const TaskManagement = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string | null>(null);
  const [columns, setColumns] = useState<Column[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTasks = async () => {
      if (!id) return;
      
      setLoading(true);
      try {
        const tasks = await loadTasks(id);
        
        // Group tasks by status
        const todoTasks = tasks.filter(task => task.status === 'todo');
        const inProgressTasks = tasks.filter(task => task.status === 'in_progress');
        const reviewTasks = tasks.filter(task => task.status === 'review');
        const doneTasks = tasks.filter(task => task.status === 'done');
        
        // Convert TaskType to Task interface
        const convertTask = (task: TaskType): Task => ({
          id: task.id,
          title: task.title,
          description: task.description,
          assignee: task.assignee,
          dueDate: task.dueDate,
          priority: task.priority,
          tags: [] // Tags are not stored in the database, could be added as metadata
        });
        
        setColumns([
          {
            id: 'todo',
            title: 'To Do',
            tasks: todoTasks.map(convertTask)
          },
          {
            id: 'in-progress',
            title: 'In Progress',
            tasks: inProgressTasks.map(convertTask)
          },
          {
            id: 'review',
            title: 'Review',
            tasks: reviewTasks.map(convertTask)
          },
          {
            id: 'done',
            title: 'Done',
            tasks: doneTasks.map(convertTask)
          }
        ]);
      } catch (error) {
        console.error('Error loading tasks:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchTasks();
  }, [id]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = async (event: any) => {
    const { active, over } = event;

    if (!over) return;

    const activeTask = active.data.current;
    const overColumn = over.data.current;

    if (activeTask && overColumn) {
      // Update the task status in the database
      if (id) {
        try {
          const newStatus = overColumn.id as 'todo' | 'in_progress' | 'review' | 'done';
          await updateTaskStatus(activeTask.id, newStatus);
        } catch (error) {
          console.error('Error updating task status:', error);
          return; // Don't update UI if database update fails
        }
      }
      
      // Update the UI
      setColumns(prevColumns => {
        const activeColumn = prevColumns.find(col => 
          col.tasks.find(task => task.id === activeTask.id)
        );
        
        if (!activeColumn) return prevColumns;

        const updatedColumns = prevColumns.map(column => {
          if (column.id === activeColumn.id) {
            return {
              ...column,
              tasks: column.tasks.filter(task => task.id !== activeTask.id)
            };
          }
          if (column.id === overColumn.id) {
            return {
              ...column,
              tasks: [...column.tasks, activeTask]
            };
          }
          return column;
        });

        return updatedColumns;
      });
    }
  };

  const handleAddTask = async () => {
    if (!id) return;
    
    const title = prompt('Enter task title:');
    if (!title) return;
    
    const description = prompt('Enter task description (optional):');
    const dueDate = prompt('Enter due date (YYYY-MM-DD):', new Date().toISOString().split('T')[0]);
    if (!dueDate) return;
    
    const priorityInput = prompt('Enter priority (low, medium, high):', 'medium');
    const priority = ['low', 'medium', 'high'].includes(priorityInput || '') 
      ? priorityInput as 'low' | 'medium' | 'high' 
      : 'medium';
    
    try {
      const newTask = await createTask({
        propertyId: id,
        title,
        description: description || undefined,
        dueDate,
        priority,
        status: 'todo'
      });
      
      if (newTask) {
        // Refresh tasks
        const tasks = await loadTasks(id);
        
        // Group tasks by status
        const todoTasks = tasks.filter(task => task.status === 'todo');
        const inProgressTasks = tasks.filter(task => task.status === 'in_progress');
        const reviewTasks = tasks.filter(task => task.status === 'review');
        const doneTasks = tasks.filter(task => task.status === 'done');
        
        // Convert TaskType to Task interface
        const convertTask = (task: TaskType): Task => ({
          id: task.id,
          title: task.title,
          description: task.description,
          assignee: task.assignee,
          dueDate: task.dueDate,
          priority: task.priority,
          tags: []
        });
        
        setColumns([
          {
            id: 'todo',
            title: 'To Do',
            tasks: todoTasks.map(convertTask)
          },
          {
            id: 'in-progress',
            title: 'In Progress',
            tasks: inProgressTasks.map(convertTask)
          },
          {
            id: 'review',
            title: 'Review',
            tasks: reviewTasks.map(convertTask)
          },
          {
            id: 'done',
            title: 'Done',
            tasks: doneTasks.map(convertTask)
          }
        ]);
      }
    } catch (error) {
      console.error('Error creating task:', error);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!id) return;
    
    if (window.confirm('Are you sure you want to delete this task?')) {
      try {
        const success = await deleteTask(taskId);
        if (success) {
          // Update UI
          setColumns(prevColumns => 
            prevColumns.map(column => ({
              ...column,
              tasks: column.tasks.filter(task => task.id !== taskId)
            }))
          );
        }
      } catch (error) {
        console.error('Error deleting task:', error);
      }
    }
  };

  return (
    <div className="px-4 sm:px-6 py-6">
      <div className="mb-6 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div className="relative w-full sm:w-auto sm:max-w-sm">
          <input
            type="text"
            placeholder="Search tasks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-4 py-2 w-full rounded-lg border border-pastel-pink border-opacity-20 focus:border-pastel-mauve focus:ring-1 focus:ring-pastel-mauve text-pastel-dusty placeholder-pastel-gray"
          />
          <Search size={18} className="absolute left-3 top-2.5 text-pastel-gray" />
        </div>
        
        <div className="flex space-x-3"> 
          <div className="relative">
            <button className="px-4 py-2 border border-pastel-pink border-opacity-20 rounded-lg flex items-center gap-2 text-pastel-dusty hover:border-pastel-mauve">
              <Filter size={16} />
              <span>{filterStatus || 'All Status'}</span>
            </button>
          </div>
          
          <button 
            onClick={handleAddTask}
            className="px-4 py-2 bg-pastel-mauve text-white rounded-lg flex items-center gap-2 hover:bg-pastel-dusty transition-colors"
          >
            <Plus size={16} />
            <span>New Task</span>
          </button>
        </div>
      </div>
      
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-pastel-mauve"></div>
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragEnd={handleDragEnd}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {columns.map((column) => (
              <div
                key={column.id}
                className="bg-white rounded-lg shadow-sm border border-pastel-pink border-opacity-20"
              >
                <div className="p-4 border-b border-pastel-pink border-opacity-20">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium text-pastel-dusty">{column.title}</h3>
                    <span className="text-sm text-pastel-gray">{column.tasks.length}</span>
                  </div>
                </div>
                
                <div className="p-4 space-y-4">
                  <SortableContext
                    items={column.tasks}
                    strategy={verticalListSortingStrategy}
                  >
                    {column.tasks.map((task) => (
                      <motion.div
                        key={task.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-pastel-peach bg-opacity-5 rounded-lg p-4 cursor-pointer hover:bg-opacity-10 transition-colors"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <span className={`w-2 h-2 rounded-full ${
                                task.priority === 'high' ? 'bg-red-500' :
                                task.priority === 'medium' ? 'bg-amber-500' :
                                'bg-green-500'
                              }`} />
                              <h4 className="text-sm font-medium text-pastel-dusty">{task.title}</h4>
                            </div>
                            
                            {task.description && (
                              <p className="text-sm text-pastel-gray mb-3">{task.description}</p>
                            )}
                            
                            {task.tags && task.tags.length > 0 && (
                              <div className="flex flex-wrap gap-2 mb-3">
                                {task.tags.map((tag, index) => (
                                  <span
                                    key={index}
                                    className="px-2 py-1 text-xs rounded-full bg-pastel-peach bg-opacity-10 text-pastel-dusty"
                                  >
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            )}
                            
                            <div className="flex items-center gap-4 text-xs text-pastel-gray">
                              {task.assignee && (
                                <div className="flex items-center">
                                  <User size={12} className="mr-1" />
                                  <span>{task.assignee}</span>
                                </div>
                              )}
                              {task.dueDate && (
                                <div className="flex items-center">
                                  <Calendar size={12} className="mr-1" />
                                  <span>{task.dueDate}</span>
                                </div>
                              )}
                            </div>
                          </div>
                          
                          <button 
                            className="p-1 text-pastel-gray hover:text-red-500"
                            onClick={() => handleDeleteTask(task.id)}
                          >
                            <MoreVertical size={16} />
                          </button>
                        </div>
                      </motion.div>
                    ))}
                    
                    {column.tasks.length === 0 && (
                      <div className="text-center py-8 text-pastel-gray">
                        <p>No tasks</p>
                      </div>
                    )}
                  </SortableContext>
                </div>
              </div>
            ))}
          </div>
        </DndContext>
      )}
    </div>
  );
};

export default TaskManagement;