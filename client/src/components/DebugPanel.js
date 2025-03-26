import React, { useState, useEffect } from 'react';

const DebugPanel = ({ enabled = true }) => {
  const [logs, setLogs] = useState([]);
  const [isVisible, setIsVisible] = useState(false);
  const [apiCalls, setApiCalls] = useState([]);
  const [networkStatus, setNetworkStatus] = useState(navigator.onLine);

  // Monitor console.log/warn/error and keep a record
  useEffect(() => {
    if (!enabled) return;
    
    // Save original console methods
    const originalLog = console.log;
    const originalWarn = console.warn;
    const originalError = console.error;
    
    // Override console methods
    console.log = (...args) => {
      originalLog(...args);
      setLogs(prev => [
        { type: 'log', message: args.map(a => typeof a === 'object' ? JSON.stringify(a) : a).join(' '), time: new Date() },
        ...prev.slice(0, 99)
      ]);
    };
    
    console.warn = (...args) => {
      originalWarn(...args);
      setLogs(prev => [
        { type: 'warn', message: args.map(a => typeof a === 'object' ? JSON.stringify(a) : a).join(' '), time: new Date() },
        ...prev.slice(0, 99)
      ]);
    };
    
    console.error = (...args) => {
      originalError(...args);
      setLogs(prev => [
        { type: 'error', message: args.map(a => typeof a === 'object' ? JSON.stringify(a) : a).join(' '), time: new Date() },
        ...prev.slice(0, 99)
      ]);
    };
    
    // Monitor network status
    const handleOnline = () => setNetworkStatus(true);
    const handleOffline = () => setNetworkStatus(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Monitor fetch API calls
    const originalFetch = window.fetch;
    window.fetch = async (url, options = {}) => {
      const start = performance.now();
      const apiCall = {
        url: url.toString(),
        method: options.method || 'GET',
        startTime: new Date(),
        status: 'pending'
      };
      
      setApiCalls(prev => [apiCall, ...prev.slice(0, 19)]);
      
      try {
        const response = await originalFetch(url, options);
        const duration = performance.now() - start;
        
        const updatedCall = {
          ...apiCall,
          status: response.ok ? 'success' : 'error',
          statusCode: response.status,
          duration: `${duration.toFixed(2)}ms`,
        };
        
        setApiCalls(prev => 
          prev.map(call => 
            call === apiCall ? updatedCall : call
          )
        );
        
        return response;
      } catch (error) {
        const duration = performance.now() - start;
        
        const updatedCall = {
          ...apiCall,
          status: 'failed',
          error: error.message,
          duration: `${duration.toFixed(2)}ms`,
        };
        
        setApiCalls(prev => 
          prev.map(call => 
            call === apiCall ? updatedCall : call
          )
        );
        
        throw error;
      }
    };
    
    // Cleanup
    return () => {
      console.log = originalLog;
      console.warn = originalWarn;
      console.error = originalError;
      window.fetch = originalFetch;
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [enabled]);

  if (!enabled) return null;

  const toggleVisibility = () => setIsVisible(!isVisible);
  const clearLogs = () => setLogs([]);

  return (
    <>
      <button
        onClick={toggleVisibility}
        className="fixed bottom-4 right-4 z-50 bg-gray-800 text-white p-2 rounded-full shadow-lg"
        style={{ opacity: 0.7 }}
      >
        🐛
      </button>

      {isVisible && (
        <div className="fixed bottom-16 right-4 w-96 h-96 bg-gray-900 text-white rounded-lg shadow-lg overflow-hidden z-50 flex flex-col">
          <div className="flex justify-between items-center p-3 bg-gray-800 border-b border-gray-700">
            <h3>Debug Console</h3>
            <div>
              <span className={`inline-block w-3 h-3 rounded-full mr-2 ${networkStatus ? 'bg-green-500' : 'bg-red-500'}`}></span>
              <button onClick={clearLogs} className="px-2 py-1 bg-red-600 rounded text-xs">Clear</button>
              <button onClick={toggleVisibility} className="ml-2 px-2 py-1 bg-gray-700 rounded text-xs">Close</button>
            </div>
          </div>

          <div className="flex-grow flex">
            <div className="w-1/2 overflow-auto p-2 border-r border-gray-700">
              <h4 className="text-xs text-gray-400 mb-2">Console Logs</h4>
              {logs.map((log, i) => (
                <div 
                  key={i} 
                  className={`text-xs mb-1 p-1 rounded ${
                    log.type === 'error' ? 'bg-red-900/30' : 
                    log.type === 'warn' ? 'bg-yellow-900/30' : 'bg-gray-800'
                  }`}
                >
                  <span className="opacity-50 text-xxs">{log.time.toLocaleTimeString()}: </span>
                  <span>{log.message.substring(0, 200)}{log.message.length > 200 ? '...' : ''}</span>
                </div>
              ))}
            </div>

            <div className="w-1/2 overflow-auto p-2">
              <h4 className="text-xs text-gray-400 mb-2">API Calls</h4>
              {apiCalls.map((call, i) => (
                <div 
                  key={i} 
                  className={`text-xs mb-2 p-1 rounded ${
                    call.status === 'error' || call.status === 'failed' ? 'bg-red-900/30' : 
                    call.status === 'pending' ? 'bg-yellow-900/30' : 'bg-green-900/30'
                  }`}
                >
                  <div className="flex justify-between">
                    <span className="font-bold">{call.method}</span>
                    {call.duration && <span>{call.duration}</span>}
                  </div>
                  <div className="truncate">{call.url}</div>
                  <div className="flex justify-between mt-1">
                    <span>
                      {call.status === 'pending' ? '⏳' : 
                       call.status === 'success' ? '✅' : '❌'}
                      {call.statusCode && ` ${call.statusCode}`}
                    </span>
                    <span className="opacity-50 text-xxs">
                      {call.startTime.toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default DebugPanel;