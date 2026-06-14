'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { CheckSquare, Plus, Clock, AlertCircle, CheckCircle, Calendar, Filter, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { DashboardLayout } from '@/components/layout/dashboard-layout';

export default function Tasks() {
  const [filter, setFilter] = useState('all');
  const [priority, setPriority] = useState('all');
  const [newTaskDescription, setNewTaskDescription] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState('medium');
  
  const [tasks, setTasks] = useState([
    {
      id: 1,
      title: 'Restock napkins and utensils',
      description: 'Check all tables and refill napkin dispensers and utensil holders',
      priority: 'high',
      status: 'pending',
      assignedBy: 'Manager',
      dueTime: '11:00 AM',
      category: 'Setup',
      completed: false
    },
    {
      id: 2,
      title: 'Clean coffee machine',
      description: 'Deep clean the espresso machine and refill beans',
      priority: 'medium',
      status: 'in_progress',
      assignedBy: 'Shift Lead',
      dueTime: '12:00 PM',
      category: 'Cleaning',
      completed: false
    },
    {
      id: 3,
      title: 'Update daily specials board',
      description: 'Write today\'s specials on the board near entrance',
      priority: 'high',
      status: 'completed',
      assignedBy: 'Chef',
      dueTime: '10:30 AM',
      category: 'Setup',
      completed: true
    },
    {
      id: 4,
      title: 'Check inventory levels',
      description: 'Count and record inventory for beverages',
      priority: 'medium',
      status: 'pending',
      assignedBy: 'Manager',
      dueTime: '2:00 PM',
      category: 'Inventory',
      completed: false
    },
    {
      id: 5,
      title: 'Set up patio area',
      description: 'Arrange tables and chairs, clean surfaces',
      priority: 'low',
      status: 'pending',
      assignedBy: 'Shift Lead',
      dueTime: '3:00 PM',
      category: 'Setup',
      completed: false
    }
  ]);

  const toggleTaskComplete = (taskId: number) => {
    setTasks(prev => prev.map(task => 
      task.id === taskId 
        ? { ...task, completed: !task.completed, status: !task.completed ? 'completed' : 'pending' }
        : task
    ));
  };

  const addTask = () => {
    if (newTaskDescription.trim()) {
      const newTask = {
        id: Math.max(...tasks.map(t => t.id)) + 1,
        title: newTaskDescription,
        description: '',
        priority: newTaskPriority,
        status: 'pending',
        assignedBy: 'Self',
        dueTime: 'Today',
        category: 'Personal',
        completed: false
      };
      setTasks(prev => [...prev, newTask]);
      setNewTaskDescription('');
    }
  };

  const filteredTasks = tasks.filter(task => {
    const matchesFilter = filter === 'all' || task.status === filter;
    const matchesPriority = priority === 'all' || task.priority === priority;
    return matchesFilter && matchesPriority;
  });

  const stats = {
    total: tasks.length,
    completed: tasks.filter(t => t.completed).length,
    pending: tasks.filter(t => t.status === 'pending').length,
    inProgress: tasks.filter(t => t.status === 'in_progress').length
  };

  const completionRate = (stats.completed / stats.total) * 100;

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'in_progress': return <Clock className="h-4 w-4 text-blue-500" />;
      case 'pending': return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      default: return null;
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Daily Tasks</h1>
            <p className="text-muted-foreground">Manage your assigned tasks and responsibilities</p>
          </div>
          <Dialog>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Task
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Task</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="task">Task Description</Label>
                  <Textarea
                    id="task"
                    value={newTaskDescription}
                    onChange={(e) => setNewTaskDescription(e.target.value)}
                    placeholder="Enter task description..."
                    rows={3}
                  />
                </div>
                <div>
                  <Label htmlFor="priority">Priority</Label>
                  <Select value={newTaskPriority} onValueChange={setNewTaskPriority}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={addTask} className="w-full">
                  Add Task
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Tasks</p>
                    <h3 className="text-2xl font-bold mt-2">{stats.total}</h3>
                  </div>
                  <CheckSquare className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Completed</p>
                    <h3 className="text-2xl font-bold mt-2 text-green-600">{stats.completed}</h3>
                  </div>
                  <CheckCircle className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">In Progress</p>
                    <h3 className="text-2xl font-bold mt-2 text-blue-600">{stats.inProgress}</h3>
                  </div>
                  <Clock className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Completion</p>
                    <h3 className="text-2xl font-bold mt-2">{completionRate.toFixed(0)}%</h3>
                  </div>
                  <div className="w-12 h-12">
                    <Progress value={completionRate} className="h-2" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Filters */}
        <div className="flex items-center space-x-4">
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-48">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Tasks</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>
          <Select value={priority} onValueChange={setPriority}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priorities</SelectItem>
              <SelectItem value="high">High Priority</SelectItem>
              <SelectItem value="medium">Medium Priority</SelectItem>
              <SelectItem value="low">Low Priority</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Task List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Calendar className="h-5 w-5 mr-2" />
                Today's Tasks
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredTasks.map((task, index) => (
                  <motion.div
                    key={task.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={`p-4 border rounded-lg ${task.completed ? 'bg-gray-50 opacity-75' : 'hover:bg-gray-50'}`}
                  >
                    <div className="flex items-start space-x-4">
                      <Checkbox
                        checked={task.completed}
                        onCheckedChange={() => toggleTaskComplete(task.id)}
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className={`font-semibold ${task.completed ? 'line-through text-gray-500' : ''}`}>
                              {task.title}
                            </h3>
                            {task.description && (
                              <p className="text-sm text-gray-600 mt-1">{task.description}</p>
                            )}
                            <div className="flex items-center space-x-4 mt-3 text-sm">
                              <div className="flex items-center space-x-1">
                                <User className="h-3 w-3 text-gray-400" />
                                <span className="text-gray-500">{task.assignedBy}</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <Clock className="h-3 w-3 text-gray-400" />
                                <span className="text-gray-500">{task.dueTime}</span>
                              </div>
                              <Badge variant="outline" className="text-xs">
                                {task.category}
                              </Badge>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Badge className={getPriorityColor(task.priority)}>
                              {task.priority}
                            </Badge>
                            {getStatusIcon(task.status)}
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Shift Notes */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Shift Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-start space-x-2">
                    <AlertCircle className="h-4 w-4 text-yellow-600 mt-1" />
                    <div>
                      <p className="text-sm font-medium text-yellow-900">Priority for Today</p>
                      <p className="text-sm text-yellow-800 mt-1">
                        Focus on dining room setup before lunch rush. We have a large reservation at 12:30 PM.
                      </p>
                    </div>
                  </div>
                </div>
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-start space-x-2">
                    <AlertCircle className="h-4 w-4 text-blue-600 mt-1" />
                    <div>
                      <p className="text-sm font-medium text-blue-900">Special Event</p>
                      <p className="text-sm text-blue-800 mt-1">
                        Birthday party in private dining room at 6:00 PM. Ensure cake is ready by 7:30 PM.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </DashboardLayout>
  );
}