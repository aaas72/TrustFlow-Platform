import React, { useState } from 'react';
import { FiCheckCircle, FiDownload, FiEye, FiMessageSquare, FiAlertTriangle, FiClock, FiDollarSign } from 'react-icons/fi';
import type { Milestone } from './MilestoneSystem';

interface ApprovalGatewayProps {
  milestone: Milestone;
  onApprove: (milestoneId: string) => void;
  onRequestRevision: (milestoneId: string, notes: string) => void;
  onCancel?: () => void;
}

const ApprovalGateway: React.FC<ApprovalGatewayProps> = ({
  milestone,
  onApprove,
  onRequestRevision,
  onCancel
}) => {
  const [showRevisionForm, setShowRevisionForm] = useState(false);
  const [revisionNotes, setRevisionNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleApprove = async () => {
    setIsSubmitting(true);
    try {
      await onApprove(milestone.id);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRequestRevision = async () => {
    if (!revisionNotes.trim()) {
      alert('Lütfen revizyon notlarınızı girin.');
      return;
    }
    
    setIsSubmitting(true);
    try {
      await onRequestRevision(milestone.id, revisionNotes);
      setRevisionNotes('');
      setShowRevisionForm(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 rounded-t-xl">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold mb-2">Onay Kapısı - Karar Zamanı</h2>
              <p className="text-blue-100">
                Bu aşamayı değerlendirin ve kararınızı verin
              </p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold">{milestone.amount.toLocaleString('tr-TR')} TL</div>
              <div className="text-blue-100">Güvende tutulan miktar</div>
            </div>
          </div>
        </div>

        {/* Milestone Details */}
        <div className="p-6">
          <div className="mb-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-2">{milestone.title}</h3>
            <p className="text-gray-600 mb-4">{milestone.description}</p>
            
            {/* Deliverables */}
            <div className="mb-4">
              <h4 className="font-semibold text-gray-900 mb-2">Beklenen Teslimatlar:</h4>
              <ul className="space-y-2">
                {milestone.deliverables.map((deliverable, idx) => (
                  <li key={idx} className="flex items-center gap-2 text-gray-700">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    {deliverable}
                  </li>
                ))}
              </ul>
            </div>

            {/* Submitted Files */}
            {milestone.submittedFiles && milestone.submittedFiles.length > 0 && (
              <div className="mb-6">
                <h4 className="font-semibold text-gray-900 mb-3">Gönderilen Dosyalar:</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {milestone.submittedFiles.map((file, idx) => (
                    <div key={idx} className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                      <FiDownload className="w-5 h-5 text-blue-600" />
                      <span className="flex-1 text-gray-900">{file}</span>
                      <button className="text-blue-600 hover:text-blue-700 p-1">
                        <FiEye className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Timeline */}
            {milestone.submittedAt && (
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2 text-gray-600 mb-2">
                  <FiClock className="w-4 h-4" />
                  <span className="font-medium">Teslimat Zamanı</span>
                </div>
                <p className="text-gray-900">
                  {milestone.submittedAt.toLocaleDateString('tr-TR', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
            )}
          </div>

          {/* Decision Section */}
          <div className="border-t border-gray-200 pt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Kararınızı Verin
            </h3>
            
            {!showRevisionForm ? (
              <div className="space-y-4">
                {/* Approval Option */}
                <div className="border-2 border-green-200 rounded-lg p-4 bg-green-50">
                  <div className="flex items-start gap-4">
                    <div className="p-2 bg-green-100 rounded-full">
                      <FiCheckCircle className="w-6 h-6 text-green-600" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-green-800 mb-2">
                        Onayla ve Ödemeyi Serbest Bırak
                      </h4>
                      <p className="text-green-700 text-sm mb-3">
                        İş beklentilerinizi karşılıyor ve kaliteli. {milestone.amount.toLocaleString('tr-TR')} TL 
                        anında freelancer'a aktarılacak ve bir sonraki aşama başlayacak.
                      </p>
                      <button
                        onClick={handleApprove}
                        disabled={isSubmitting}
                        className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                      >
                        {isSubmitting ? 'İşleniyor...' : 'Onayla ve Ödemeyi Serbest Bırak'}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Revision Option */}
                <div className="border-2 border-orange-200 rounded-lg p-4 bg-orange-50">
                  <div className="flex items-start gap-4">
                    <div className="p-2 bg-orange-100 rounded-full">
                      <FiMessageSquare className="w-6 h-6 text-orange-600" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-orange-800 mb-2">
                        Revizyon İste
                      </h4>
                      <p className="text-orange-700 text-sm mb-3">
                        İş eksik veya beklentilerinizi karşılamıyor. Detaylı geri bildirim vererek 
                        düzeltilmesini isteyebilirsiniz. Ödeme güvende tutulacak.
                      </p>
                      <button
                        onClick={() => setShowRevisionForm(true)}
                        className="bg-orange-600 text-white px-6 py-2 rounded-lg hover:bg-orange-700 font-medium"
                      >
                        Revizyon Notları Yaz
                      </button>
                    </div>
                  </div>
                </div>

                {/* Warning */}
                <div className="flex items-start gap-3 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <FiAlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
                  <div className="text-sm text-yellow-800">
                    <p className="font-medium mb-1">Önemli Hatırlatma:</p>
                    <p>
                      Bu karar geri alınamaz. Onayladığınızda ödeme anında serbest bırakılır. 
                      Revizyon istediğinizde freelancer düzeltmeleri yapıp tekrar gönderecek.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              /* Revision Form */
              <div className="space-y-4">
                <div className="border-2 border-red-200 rounded-lg p-4 bg-red-50">
                  <h4 className="font-semibold text-red-800 mb-3">Revizyon Notları</h4>
                  <p className="text-red-700 text-sm mb-4">
                    Lütfen neyin değiştirilmesi gerektiğini detaylı bir şekilde açıklayın:
                  </p>
                  
                  <textarea
                    value={revisionNotes}
                    onChange={(e) => setRevisionNotes(e.target.value)}
                    placeholder="Örnek: Wireframe'lerde ana menü eksik, renk paleti çok koyu, logo boyutu küçük..."
                    className="w-full h-32 p-3 border border-red-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 resize-none"
                  />
                  
                  <div className="flex gap-3 mt-4">
                    <button
                      onClick={handleRequestRevision}
                      disabled={isSubmitting || !revisionNotes.trim()}
                      className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                    >
                      {isSubmitting ? 'Gönderiliyor...' : 'Revizyon İste'}
                    </button>
                    <button
                      onClick={() => {
                        setShowRevisionForm(false);
                        setRevisionNotes('');
                      }}
                      className="bg-gray-300 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-400 font-medium"
                    >
                      İptal
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 rounded-b-xl flex justify-between items-center">
          <div className="flex items-center gap-2 text-gray-600">
            <FiDollarSign className="w-4 h-4" />
            <span className="text-sm">
              {milestone.amount.toLocaleString('tr-TR')} TL güvenli escrow sisteminde tutuluyor
            </span>
          </div>
          
          {onCancel && (
            <button
              onClick={onCancel}
              className="text-gray-500 hover:text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Kapat
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ApprovalGateway;