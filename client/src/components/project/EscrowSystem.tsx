import React from 'react';
import { FiShield, FiDollarSign, FiLock, FiUnlock, FiClock, FiCheckCircle, FiAlertTriangle } from 'react-icons/fi';

export interface EscrowTransaction {
  id: string;
  milestoneId: string;
  milestoneName: string;
  amount: number;
  status: 'pending' | 'held' | 'released' | 'refunded';
  createdAt: Date;
  releasedAt?: Date;
  description: string;
}

interface EscrowSystemProps {
  transactions: EscrowTransaction[];
  totalProjectValue: number;
  totalHeld: number;
  totalReleased: number;
  userRole: 'client' | 'freelancer';
}

const EscrowSystem: React.FC<EscrowSystemProps> = ({
  transactions,
  totalProjectValue,
  totalHeld,
  totalReleased,
  userRole
}) => {
  const getStatusColor = (status: EscrowTransaction['status']) => {
    switch (status) {
      case 'pending': return 'text-gray-600 bg-gray-100';
      case 'held': return 'text-blue-600 bg-blue-100';
      case 'released': return 'text-green-600 bg-green-100';
      case 'refunded': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusText = (status: EscrowTransaction['status']) => {
    switch (status) {
      case 'pending': return 'Beklemede';
      case 'held': return 'Güvende Tutuluyor';
      case 'released': return 'Serbest Bırakıldı';
      case 'refunded': return 'İade Edildi';
      default: return 'Bilinmiyor';
    }
  };

  const getStatusIcon = (status: EscrowTransaction['status']) => {
    switch (status) {
      case 'pending': return <FiClock className="w-4 h-4" />;
      case 'held': return <FiLock className="w-4 h-4" />;
      case 'released': return <FiUnlock className="w-4 h-4" />;
      case 'refunded': return <FiAlertTriangle className="w-4 h-4" />;
      default: return <FiClock className="w-4 h-4" />;
    }
  };

  const progressPercentage = totalProjectValue > 0 ? (totalReleased / totalProjectValue) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Escrow Overview */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-4">
          <FiShield className="w-6 h-6 text-blue-600" />
          <h2 className="text-xl font-semibold text-gray-900">
            Güvenli Ödeme Sistemi (Escrow)
          </h2>
        </div>
        
        <p className="text-gray-600 mb-6">
          {userRole === 'client' 
            ? 'Ödemeleriniz güvenli bir şekilde saklanır ve sadece işi onayladığınızda freelancer\'a aktarılır.'
            : 'Müşteri ödemelerini güvenli bir şekilde yatırdı. İşi teslim ettiğinizde ödemeniz serbest bırakılacak.'
          }
        </p>

        {/* Financial Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <FiDollarSign className="w-4 h-4 text-gray-600" />
              <span className="text-sm font-medium text-gray-600">Toplam Proje</span>
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {totalProjectValue.toLocaleString('tr-TR')} TL
            </div>
          </div>

          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <FiLock className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-600">Güvende Tutulan</span>
            </div>
            <div className="text-2xl font-bold text-blue-700">
              {totalHeld.toLocaleString('tr-TR')} TL
            </div>
          </div>

          <div className="bg-green-50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <FiUnlock className="w-4 h-4 text-green-600" />
              <span className="text-sm font-medium text-green-600">Serbest Bırakılan</span>
            </div>
            <div className="text-2xl font-bold text-green-700">
              {totalReleased.toLocaleString('tr-TR')} TL
            </div>
          </div>

          <div className="bg-purple-50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <FiCheckCircle className="w-4 h-4 text-purple-600" />
              <span className="text-sm font-medium text-purple-600">İlerleme</span>
            </div>
            <div className="text-2xl font-bold text-purple-700">
              %{progressPercentage.toFixed(0)}
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-6">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>Proje İlerlemesi</span>
            <span>{progressPercentage.toFixed(1)}% Tamamlandı</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div 
              className="bg-gradient-to-r from-blue-500 to-green-500 h-3 rounded-full transition-all duration-500"
              style={{ width: `${progressPercentage}%` }}
            ></div>
          </div>
        </div>

        {/* Trust Indicators */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg border border-green-200">
            <FiShield className="w-5 h-5 text-green-600" />
            <div>
              <div className="font-medium text-green-800">Güvenli Ödeme Garantisi</div>
              <div className="text-sm text-green-600">Ödemeleriniz 256-bit SSL ile korunur</div>
            </div>
          </div>
          
          <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <FiCheckCircle className="w-5 h-5 text-blue-600" />
            <div>
              <div className="font-medium text-blue-800">Onay Sistemi</div>
              <div className="text-sm text-blue-600">Her aşama onayınızla ilerler</div>
            </div>
          </div>
        </div>
      </div>

      {/* Transaction History */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">İşlem Geçmişi</h3>
        
        <div className="space-y-3">
          {transactions.map((transaction) => (
            <div
              key={transaction.id}
              className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className={`p-2 rounded-full ${getStatusColor(transaction.status)}`}>
                  {getStatusIcon(transaction.status)}
                </div>
                
                <div>
                  <div className="font-medium text-gray-900">{transaction.milestoneName}</div>
                  <div className="text-sm text-gray-600">{transaction.description}</div>
                  <div className="text-xs text-gray-500 mt-1">
                    {transaction.createdAt.toLocaleDateString('tr-TR', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                </div>
              </div>

              <div className="text-right">
                <div className="font-semibold text-gray-900">
                  {transaction.amount.toLocaleString('tr-TR')} TL
                </div>
                <div className={`text-sm px-2 py-1 rounded-full ${getStatusColor(transaction.status)}`}>
                  {getStatusText(transaction.status)}
                </div>
                {transaction.releasedAt && (
                  <div className="text-xs text-gray-500 mt-1">
                    Serbest bırakıldı: {transaction.releasedAt.toLocaleDateString('tr-TR')}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {transactions.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <FiDollarSign className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>Henüz işlem bulunmuyor</p>
            <p className="text-sm">İlk aşama finanse edildiğinde işlemler burada görünecek</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default EscrowSystem;
