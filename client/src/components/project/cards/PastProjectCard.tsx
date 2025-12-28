import React from 'react';
import { FiStar, FiCalendar } from "react-icons/fi";

interface PastProjectProps {
  id: number;
  title: string;
  completionDate: string;
  rating: number;
  client: string;
}

const PastProjectCard: React.FC<PastProjectProps> = ({ 
  title, completionDate, rating, client 
}) => {
  return (
    <div className="border bg-white hover:bg-blue-50 hover:border-blue-600 border-gray-300 pb-4  p-3 rounded-lg">
      <h4 className="font-bold text-lg mb-2 text-gray-800">{title}</h4>
      <p className="text-sm text-gray-600 mb-3">Müşteri: {client}</p>
      <div className="flex justify-between items-center">
        <div className="flex items-center">
          <FiCalendar className="h-4 w-4 text-gray-500 mr-1" />
          <span className="text-sm text-gray-500">{completionDate}</span>
        </div>
        <div className="flex items-center">
          <FiStar className="h-4 w-4 text-yellow-500 mr-1" />
          <span className="text-sm font-medium">{rating}</span>
        </div>
      </div>
    </div>
  );
};

export default PastProjectCard;