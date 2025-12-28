import { useState, useEffect } from 'react';
import axios from 'axios';

interface HealthCheckProps {
  apiUrl?: string;
}

const HealthCheck: React.FC<HealthCheckProps> = ({ apiUrl = 'http://localhost:3000/api/health' }) => {
  const [isConnected, setIsConnected] = useState<boolean | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  const checkHealth = async () => {
    if (isChecking) return;
    
    setIsChecking(true);
    setIsVisible(true);
    
    try {
      const response = await axios.get(apiUrl, { timeout: 5000 });
      setIsConnected(response.status === 200);
    } catch (error) {
      setIsConnected(false);
    } finally {
      setIsChecking(false);
      
      // Sonucu 3 saniye sonra gizle
      setTimeout(() => {
        setIsVisible(false);
      }, 3000);
    }
  };

  // Bileşen yüklendiğinde bağlantıyı kontrol et
  useEffect(() => {
    checkHealth();
  }, []);

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <button
        onClick={checkHealth}
        className="bg-blue-600 hover:bg-blue-700 text-white rounded-full w-12 h-12 flex items-center justify-center shadow-lg"
        aria-label="Bağlantı Kontrolü"
      >
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor" 
          className="w-6 h-6"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M8 16l2.879-2.879m0 0a3 3 0 104.243-4.242 3 3 0 00-4.243 4.242zM21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
          />
        </svg>
      </button>
      
      {isVisible && (
        <div className={`
          mt-2 p-3 rounded-lg shadow-lg text-white text-sm
          ${isChecking ? 'bg-gray-600' : isConnected ? 'bg-green-600' : 'bg-red-600'}
          transition-opacity duration-300 ease-in-out
        `}>
          {isChecking ? (
            <div className="flex items-center">
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Bağlantı kontrol ediliyor...
            </div>
          ) : isConnected ? (
            <div className="flex items-center">
              <svg className="w-4 h-4 mr-2 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
              </svg>
              Sunucuya bağlı
            </div>
          ) : (
            <div className="flex items-center">
              <svg className="w-4 h-4 mr-2 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
              Sunucuya bağlı değil
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default HealthCheck;