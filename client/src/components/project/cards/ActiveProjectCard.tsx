import React from "react";

interface ActiveProjectProps {
  id: number;
  title: string;
  progress: number;
  deadline: string;
  client: string;
}

const ActiveProjectCard: React.FC<ActiveProjectProps> = ({
  id,
  title,
  progress,
  deadline,
  client,
}) => {
  return (
    <div
      key={id}
      className="border bg-white hover:bg-blue-50 hover:border-blue-600 border-gray-300 pb-4  p-3 rounded-lg"
    >
      <div className="flex justify-between items-center mb-2">
        <h4 className="font-bold text-gray-700">{title}</h4>
        <span className="text-sm text-red-600 ">{deadline}</span>
      </div>
      <p className="text-sm text-gray-600 mb-2">Müşteri: {client}</p>
      <div className="w-full bg-gray-200 rounded-full h-2.5">
        <div
          className="bg-blue-600 h-2.5 rounded-full"
          style={{ width: `${progress}%` }}
        ></div>
      </div>
      <div className="flex justify-between items-center mt-2">
        <span className="text-sm text-gray-500">İlerleme: {progress}%</span>
        <button className="text-sm bg-indigo-100 hover:bg-indigo-200 text-indigo-700 py-1 mt-4 px-3 rounded-full transition-colors duration-200">
          Detaylar
        </button>
      </div>
    </div>
  );
};

export default ActiveProjectCard;
