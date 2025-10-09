import React from 'react';
import Card from '../components/Card';
import ProductivityChart from '../components/ProductivityChart';
import type { Task, TaskCompletionData } from '../types';
import { TaskStatus } from '../types';

interface InsightsProps {
    tasks: Task[];
    taskCompletionData: TaskCompletionData[];
}

const Insights: React.FC<InsightsProps> = ({ tasks, taskCompletionData }) => {
    const totalTasksCompleted = tasks.filter(t => t.status === TaskStatus.Done).length;
    
    const mostProductiveDay = [...taskCompletionData].sort((a, b) => b.tasksCompleted - a.tasksCompleted)[0] || { name: 'N/A', tasksCompleted: 0 };

    const tasksCompletedThisWeek = taskCompletionData.reduce((acc, day) => acc + day.tasksCompleted, 0);

  return (
    <div className="space-y-6">
      <Card>
        <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-slate-800">Weekly Task Completion</h3>
        </div>
        <p className="text-slate-600 mb-4">A summary of tasks you've completed over the past week.</p>
        <ProductivityChart data={taskCompletionData} />
      </Card>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card title="Tasks Completed (Week)" className="text-center">
            <p className="text-5xl font-bold text-brand-blue">{tasksCompletedThisWeek}</p>
            <p className="text-slate-500 mt-1">in the last 7 days</p>
        </Card>
        <Card title="Total Tasks Completed" className="text-center">
            <p className="text-5xl font-bold text-green-600">{totalTasksCompleted}</p>
            <p className="text-slate-500 mt-1">across all projects</p>
        </Card>
        <Card title="Most Productive Day" className="text-center">
            <p className="text-5xl font-bold text-purple-600">{mostProductiveDay.name}</p>
            <p className="text-slate-500 mt-1">with {mostProductiveDay.tasksCompleted} tasks completed</p>
        </Card>
      </div>

    </div>
  );
};

export default Insights;