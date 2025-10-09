import React from 'react';
import { TaskStatus } from '../types';
import Card from '../components/Card';
import ProductivityChart from '../components/ProductivityChart';
import type { Task, Project, TaskCompletionData } from '../types';

const getStatusColor = (status: TaskStatus) => {
  switch (status) {
    case TaskStatus.Done: return 'text-green-500';
    case TaskStatus.InProgress: return 'text-blue-500';
    case TaskStatus.Overdue: return 'text-red-500';
    case TaskStatus.ToDo: return 'text-gray-500';
    default: return 'text-gray-500';
  }
};

const TaskItem: React.FC<{ task: Task }> = ({ task }) => (
  <div className="flex items-center justify-between py-2 border-b border-slate-200 last:border-b-0">
    <span className="text-slate-700">{task.title}</span>
    <span className={`text-sm font-semibold ${getStatusColor(task.status)}`}>{task.status}</span>
  </div>
);

interface DashboardProps {
  projects: Project[];
  tasks: Task[];
  taskCompletionData: TaskCompletionData[];
}

const Dashboard: React.FC<DashboardProps> = ({ projects, tasks, taskCompletionData }) => {
  const activeProjects = projects.length;
  const overdueTasks = tasks.filter(t => t.status === TaskStatus.Overdue).length;
  const upcomingDeadlines = tasks.filter(t => t.status !== TaskStatus.Done && new Date(t.dueDate) > new Date() && new Date(t.dueDate) < new Date(new Date().setDate(new Date().getDate() + 7))).length;

  const urgentTasks = tasks.filter(t => t.status === TaskStatus.Overdue || t.status === TaskStatus.InProgress).slice(0, 5);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card title="Active Projects" className="bg-gradient-to-br from-blue-500 to-brand-blue text-white">
            <p className="text-4xl font-bold">{activeProjects}</p>
            <p className="text-blue-200">Currently managed</p>
        </Card>
        <Card title="Overdue Tasks" className="bg-gradient-to-br from-red-500 to-red-700 text-white">
            <p className="text-4xl font-bold">{overdueTasks}</p>
            <p className="text-red-200">Require immediate attention</p>
        </Card>
        <Card title="Upcoming Deadlines" className="bg-gradient-to-br from-amber-400 to-amber-600 text-white">
            <p className="text-4xl font-bold">{upcomingDeadlines}</p>
            <p className="text-amber-100">In the next 7 days</p>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
            <Card title="Task Completion This Week">
                <ProductivityChart data={taskCompletionData} />
            </Card>
        </div>
        <div>
            <Card title="Urgent Tasks">
                <div className="space-y-2">
                    {urgentTasks.map(task => <TaskItem key={task.id} task={task} />)}
                     {urgentTasks.length === 0 && <p className="text-slate-500 text-sm">No urgent tasks. Well done!</p>}
                </div>
            </Card>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;