import { useState, useEffect } from 'react';
import axios from 'axios';

export default function BudgetSummary({ refreshTrigger }) {
  const [summary, setSummary] = useState([]);
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(false);

 useEffect(() => {
  const fetchSummary = async () => {
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/expenses/summary', {
        params: { month, year },
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setSummary(response.data.summary);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  fetchSummary();
}, [month, year, refreshTrigger]);

  const totalSpent = summary.reduce((sum, item) => sum + parseFloat(item.total), 0);

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6">Monthly Summary</h2>

      <div className="mb-6 flex gap-4">
        <select
          value={month}
          onChange={(e) => setMonth(parseInt(e.target.value))}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
        >
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((m) => (
            <option key={m} value={m}>
              {new Date(2024, m - 1).toLocaleString('default', { month: 'long' })}
            </option>
          ))}
        </select>

        <select
          value={year}
          onChange={(e) => setYear(parseInt(e.target.value))}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
        >
          {[2024, 2025, 2026].map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <p className="text-center text-gray-500">Loading summary...</p>
      ) : summary.length === 0 ? (
        <p className="text-center text-gray-500">No expenses for this month</p>
      ) : (
        <>
          <div className="space-y-3 mb-6">
            {summary.map((item) => (
              <div key={item.category} className="flex justify-between items-center">
                <span className="font-semibold">{item.category}</span>
                <span className="text-lg font-bold">${parseFloat(item.total).toFixed(2)}</span>
              </div>
            ))}
          </div>

          <div className="border-t pt-4">
            <div className="flex justify-between items-center">
              <span className="text-xl font-bold">Total Spent</span>
              <span className="text-2xl font-bold text-blue-600">${totalSpent.toFixed(2)}</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}