import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Card } from '../../components/ui/Card';
import { Badge, StatusBadge } from '../../components/ui/Badge';
import { MOCK_TRACKER_ENTRIES } from '../../data/mockData';
import { useAuth } from '../../context/AuthContext';
import { CheckCircle2, Clock, AlertCircle, Calendar, List } from 'lucide-react';
import { clsx } from 'clsx';

type ViewMode = 'list' | 'calendar';

function TrackerCard({ entry }: { entry: any }) {
    const [open, setOpen] = useState(false);
    const isLate = entry.feedback?.is_approved === false;
    
    return (
        <div className="border border-gray-100 rounded-lg hover:border-primary-200 hover:shadow-card transition-all duration-200">
            <button
                onClick={() => setOpen(!open)}
                className="w-full flex items-center gap-3 p-3 text-left"
            >
                <div className={clsx(
                    'w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0',
                    isLate ? 'bg-amber-100' : 'bg-green-100'
                )}>
                    {isLate ? <Clock size={16} className="text-amber-600" /> : <CheckCircle2 size={16} className="text-green-600" />}
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-gray-800">
                            {new Date(entry.entry_date).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}
                        </p>
                        {isLate && <Badge variant="yellow">Needs Improvement</Badge>}
                    </div>
                    <p className="text-xs text-muted truncate">
                        {entry.submitted_at ? `Submitted at ${new Date(entry.submitted_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}` : 'Not submitted'}
                    </p>
                </div>
                {entry.feedback && <AlertCircle size={14} className="text-primary-400 flex-shrink-0" />}
            </button>

            {open && (
                <div className="px-3 pb-3 border-t border-gray-50 pt-3 space-y-2 animate-fadeIn">
                    <div className="bg-blue-50 rounded-lg p-3">
                        <p className="text-xs font-medium text-blue-600 mb-0.5">Learning Summary</p>
                        <p className="text-sm text-gray-700">{entry.learning_summary || '—'}</p>
                    </div>
                    <div className="bg-amber-50 rounded-lg p-3">
                        <p className="text-xs font-medium text-amber-600 mb-0.5">Challenges</p>
                        <p className="text-sm text-gray-700">{entry.challenges || '—'}</p>
                    </div>
                    <div className="bg-green-50 rounded-lg p-3">
                        <p className="text-xs font-medium text-green-600 mb-0.5">Tasks Completed</p>
                        <p className="text-sm text-gray-700">{entry.tasks_completed || '—'}</p>
                    </div>
                    <div className="bg-purple-50 rounded-lg p-3">
                        <p className="text-xs font-medium text-purple-600 mb-0.5">Hours Spent</p>
                        <p className="text-sm text-gray-700">{entry.hours_spent || 0} hours</p>
                    </div>
                    {entry.feedback && (
                        <div className="bg-primary-50 rounded-lg p-3 flex items-start gap-2">
                            <AlertCircle size={14} className="text-primary-500 flex-shrink-0 mt-0.5" />
                            <div>
                                <p className="text-xs font-medium text-primary-600 mb-0.5">
                                    Facilitator Feedback {entry.feedback.facilitator_name && `by ${entry.feedback.facilitator_name}`}
                                </p>
                                <p className="text-sm text-gray-700">{entry.feedback.feedback}</p>
                                {entry.feedback.rating && (
                                    <p className="text-xs text-gray-600 mt-1">Rating: {entry.feedback.rating}/5</p>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

export default function StudentTrackerHistory() {
    const { currentUser } = useAuth();
    const [view, setView] = useState<ViewMode>('list');
    const [entries, setEntries] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentMonth, setCurrentMonth] = useState(new Date());

    useEffect(() => {
        loadTrackerHistory();
    }, []);

    const loadTrackerHistory = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const response = await fetch('/api/student/tracker-history?limit=90', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            if (data.success) {
                setEntries(data.data || []);
            }
        } catch (error) {
            console.error('Failed to load tracker history:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <DashboardLayout title="Tracker History" subtitle="All past reflections">
                <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
            </DashboardLayout>
        );
    }

    const submitted = entries.length;
    const late = entries.filter(e => e.feedback?.is_approved === false).length;
    
    // Calculate streak
    let streak = 0;
    const sortedEntries = [...entries].sort((a, b) => 
        new Date(b.entry_date).getTime() - new Date(a.entry_date).getTime()
    );
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    for (let i = 0; i < sortedEntries.length; i++) {
        const entryDate = new Date(sortedEntries[i].entry_date);
        entryDate.setHours(0, 0, 0, 0);
        const expectedDate = new Date(today);
        expectedDate.setDate(today.getDate() - i);
        expectedDate.setHours(0, 0, 0, 0);
        
        if (entryDate.getTime() === expectedDate.getTime()) {
            streak++;
        } else {
            break;
        }
    }

    // Get calendar days for current month
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const calendarDays = [];
    // Add empty cells for days before month starts
    for (let i = 0; i < startingDayOfWeek; i++) {
        calendarDays.push(null);
    }
    // Add days of month
    for (let day = 1; day <= daysInMonth; day++) {
        calendarDays.push(day);
    }

    return (
        <DashboardLayout title="Tracker History" subtitle="All past reflections">
            <div className="max-w-3xl mx-auto space-y-4">
                {/* Summary */}
                <div className="grid grid-cols-3 gap-3">
                    {[
                        { label: 'Submitted', value: submitted, color: 'text-green-600' },
                        { label: 'Late', value: late, color: 'text-amber-600' },
                        { label: 'Streak', value: `${streak}d`, color: 'text-primary-600' },
                    ].map(s => (
                        <div key={s.label} className="card text-center py-4">
                            <p className={clsx('text-2xl font-bold', s.color)}>{s.value}</p>
                            <p className="text-xs text-muted mt-1">{s.label}</p>
                        </div>
                    ))}
                </div>

                {/* View toggle */}
                <Card>
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="section-title">Entry History</h3>
                        <div className="flex border border-gray-200 rounded-lg overflow-hidden">
                            <button onClick={() => setView('list')} className={clsx('px-3 py-1.5 text-xs font-medium flex items-center gap-1 transition-colors', view === 'list' ? 'bg-primary-600 text-white' : 'text-gray-500 hover:bg-gray-50')}>
                                <List size={13} /> List
                            </button>
                            <button onClick={() => setView('calendar')} className={clsx('px-3 py-1.5 text-xs font-medium flex items-center gap-1 transition-colors', view === 'calendar' ? 'bg-primary-600 text-white' : 'text-gray-500 hover:bg-gray-50')}>
                                <Calendar size={13} /> Calendar
                            </button>
                        </div>
                    </div>

                    {view === 'list' ? (
                        <div className="space-y-2">
                            {entries.length > 0 ? (
                                entries.map(e => <TrackerCard key={e.id} entry={e} />)
                            ) : (
                                <div className="text-center py-12 text-gray-500">
                                    <p>No tracker entries yet</p>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div>
                            <div className="flex items-center justify-between mb-4">
                                <button
                                    onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
                                    className="px-3 py-1 text-sm text-gray-600 hover:bg-gray-100 rounded"
                                >
                                    ← Prev
                                </button>
                                <h4 className="text-sm font-semibold text-gray-900">
                                    {currentMonth.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
                                </h4>
                                <button
                                    onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
                                    className="px-3 py-1 text-sm text-gray-600 hover:bg-gray-100 rounded"
                                >
                                    Next →
                                </button>
                            </div>
                            <div className="grid grid-cols-7 gap-1">
                                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                                    <div key={d} className="text-center text-xs text-muted font-medium py-1">{d}</div>
                                ))}
                                {calendarDays.map((day, i) => {
                                    if (day === null) {
                                        return <div key={`empty-${i}`} className="py-2"></div>;
                                    }
                                    
                                    const dateStr = new Date(year, month, day).toISOString().split('T')[0];
                                    const entry = entries.find(e => e.entry_date === dateStr);
                                    const isLate = entry?.feedback?.is_approved === false;
                                    
                                    return (
                                        <div key={i} className="flex items-center justify-center py-2">
                                            <div 
                                                className={clsx(
                                                    'w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium',
                                                    entry ? (isLate ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700') : 'text-gray-400'
                                                )}
                                                title={entry ? `${entry.hours_spent}h - ${entry.learning_summary.substring(0, 50)}...` : ''}
                                            >
                                                {day}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </Card>
            </div>
        </DashboardLayout>
    );
}
