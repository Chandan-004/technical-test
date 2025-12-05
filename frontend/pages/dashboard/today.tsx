import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
)

interface Task {
  id: string
  type: string
  application_id: string
  due_at: string
  status: string
}

export default function TodayTasks() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchTasks()
  }, [])

  const fetchTasks = async () => {
    const startOfDay = new Date();
    startOfDay.setHours(0,0,0,0);
    
    const endOfDay = new Date();
    endOfDay.setHours(23,59,59,999);

    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .neq('status', 'completed')
      .gte('due_at', startOfDay.toISOString())
      .lte('due_at', endOfDay.toISOString())

    if (error) {
      console.error('Error fetching tasks:', error)
    } else {
      setTasks((data as any) as Task[] || []) 
    }
    
    setLoading(false)
  }

  const markComplete = async (taskId: string) => {
    const { error } = await supabase
      .from('tasks')
      .update({ status: 'completed' })
      .eq('id', taskId)

    if (error) {
      alert('Error updating task')
    } else {
      setTasks(tasks.filter(t => t.id !== taskId))
    }
  }

  if (loading) return <div>Loading today's tasks...</div>

  return (
    <div style={{ padding: '20px' }}>
      <h1>Tasks Due Today</h1>
      
      {tasks.length === 0 ? (
        <p>No tasks due today.</p>
      ) : (
        <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th>Type</th>
              <th>Application ID</th>
              <th>Due At</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {tasks.map((task) => (
              <tr key={task.id} style={{ borderBottom: '1px solid #ccc' }}>
                <td>{task.type ? task.type.toUpperCase() : 'N/A'}</td>
                <td>{task.application_id}</td>
                <td>{new Date(task.due_at).toLocaleTimeString()}</td>
                <td>{task.status}</td>
                <td>
                  <button 
                    onClick={() => markComplete(task.id)}
                    style={{ padding: '5px 10px', cursor: 'pointer', background: 'green', color: 'white', border: 'none', borderRadius: '4px' }}
                  >
                    Mark Complete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}

