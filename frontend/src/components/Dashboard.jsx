import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import ExpenseForm from './ExpenseForm';
import ExpensesList from './ExpensesList';
import BudgetSummary from './BudgetSummary';

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const handleExpenseAdded = () => {
    // Trigger refresh of expense lists and summary
    setRefreshTrigger((prev) => prev + 1);
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">Budget Dashboard</h1>
            <p className="text-gray-600">Welcome back, {user?.email}!</p>
          </div>
          <button
            onClick={handleLogout}
            className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600"
          >
            Logout
          </button>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Form and Summary */}
          <div className="lg:col-span-2 space-y-6">
            <ExpenseForm onExpenseAdded={handleExpenseAdded} />
            <BudgetSummary refreshTrigger={refreshTrigger} />
          </div>

          {/* Right Column - Expenses List */}
          <div>
            <ExpensesList refreshTrigger={refreshTrigger} />
          </div>
        </div>
      </div>
    </div>
  );
}