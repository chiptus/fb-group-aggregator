import { useState, useEffect, FormEvent } from 'react';
import { useNavigate } from '@tanstack/react-router';

export function LoginPage() {
  const [apiKey, setApiKey] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // Redirect if API key already exists
  useEffect(() => {
    const existingKey = localStorage.getItem('apiKey');
    if (existingKey) {
      navigate({ to: '/' });
    }
  }, [navigate]);

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    // Validation
    if (!apiKey.trim()) {
      setError('API key is required');
      return;
    }

    // Store API key
    localStorage.setItem('apiKey', apiKey);

    // Navigate to home page
    navigate({ to: '/' });
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8">
        <h1 className="text-2xl font-bold text-center mb-6">
          FB Group Aggregator
        </h1>
        <p className="text-gray-600 text-center mb-8">
          Enter your API key to access your synced posts
        </p>

        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <label
              htmlFor="apiKey"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              API Key
            </label>
            <input
              type="text"
              id="apiKey"
              value={apiKey}
              onChange={(e) => {
                setApiKey(e.target.value);
                setError('');
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter your API key"
            />
            {error && (
              <p className="mt-2 text-sm text-red-600">{error}</p>
            )}
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Continue
          </button>
        </form>

        <p className="mt-6 text-sm text-gray-500 text-center">
          Get your API key from the browser extension
        </p>
      </div>
    </div>
  );
}
