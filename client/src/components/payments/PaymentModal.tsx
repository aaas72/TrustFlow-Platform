import React, { useState, useEffect } from "react";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import {
  createPaymentIntent,
  confirmPaymentBackend,
} from "../../services/paymentService";

// Replace with your publishable key
const stripePromise = loadStripe("pk_test_placeholder");

interface SimulatedCheckoutFormProps {
  clientSecret: string;
  amount: number;
  onSuccess: () => void;
  onCancel: () => void;
}

const SimulatedCheckoutForm: React.FC<SimulatedCheckoutFormProps> = ({
  clientSecret,
  amount,
  onSuccess,
  onCancel,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleSimulatePayment = async () => {
    setIsLoading(true);
    // clientSecret format: pi_simulated_..._secret_fake
    // We need the ID part (everything before _secret_)
    const paymentIntentId = clientSecret.split("_secret_")[0];

    try {
      const confirmRes = await confirmPaymentBackend(paymentIntentId);
      if (confirmRes.success) {
        setMessage("Ödeme başarılı (Simülasyon)!");
        setTimeout(() => {
          onSuccess();
        }, 1500);
      } else {
        setMessage("Simülasyon hatası: " + confirmRes.message);
        setIsLoading(false);
      }
    } catch (err: any) {
      setMessage("Simülasyon hatası: " + err.message);
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="mb-4">
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
          <div className="flex">
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                Bu bir ödeme simülasyonudur. Gerçek para çekilmeyecektir.
              </p>
            </div>
          </div>
        </div>
        <p className="text-sm text-gray-600 mb-2">Ödenecek Tutar:</p>
        <p className="text-2xl font-bold text-gray-900">
          {amount.toLocaleString("tr-TR", {
            style: "currency",
            currency: "TRY",
          })}
        </p>
      </div>

      {message && (
        <div
          className={`text-sm mt-2 ${
            message.includes("başarılı") ? "text-green-600" : "text-red-500"
          }`}
        >
          {message}
        </div>
      )}

      <div className="flex justify-end space-x-3 mt-6">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          İptal
        </button>
        <button
          type="button"
          onClick={handleSimulatePayment}
          disabled={isLoading}
          className="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
        >
          {isLoading ? "İşleniyor..." : "Simüle Et ve Öde"}
        </button>
      </div>
    </div>
  );
};

interface CheckoutFormProps {
  milestoneId: number;
  amount: number;
  onSuccess: () => void;
  onCancel: () => void;
}

const CheckoutForm: React.FC<CheckoutFormProps> = ({
  amount,
  onSuccess,
  onCancel,
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const [message, setMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsLoading(true);

    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: window.location.href,
      },
      redirect: "if_required",
    });

    if (error) {
      setMessage(error.message || "An unexpected error occurred.");
      setIsLoading(false);
    } else if (paymentIntent && paymentIntent.status === "succeeded") {
      // Manually confirm on backend if redirect didn't happen (e.g. card payments)
      // Or if using "if_required", it might succeed immediately.
      const confirmRes = await confirmPaymentBackend(paymentIntent.id);
      if (confirmRes.success) {
        setMessage("Ödeme başarılı!");
        setTimeout(() => {
          onSuccess();
        }, 1500);
      } else {
        setMessage(
          "Ödeme Stripe tarafında başarılı oldu ancak sistemde güncellenemedi."
        );
        setIsLoading(false);
      }
    } else {
      setMessage("Ödeme durumu beklenmiyor.");
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="mb-4">
        <p className="text-sm text-gray-600 mb-2">Ödenecek Tutar:</p>
        <p className="text-2xl font-bold text-gray-900">
          {amount.toLocaleString("tr-TR", {
            style: "currency",
            currency: "TRY",
          })}
        </p>
      </div>
      <PaymentElement />
      {message && <div className="text-red-500 text-sm mt-2">{message}</div>}
      <div className="flex justify-end space-x-3 mt-6">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          İptal
        </button>
        <button
          type="submit"
          disabled={isLoading || !stripe || !elements}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
        >
          {isLoading ? "İşleniyor..." : "Ödeme Yap"}
        </button>
      </div>
    </form>
  );
};

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  milestoneId: number;
  amount: number;
  onSuccess: () => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  milestoneId,
  amount,
  onSuccess,
}) => {
  const [clientSecret, setClientSecret] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && milestoneId) {
      createPaymentIntent(milestoneId).then((res) => {
        if (res.success && res.clientSecret) {
          setClientSecret(res.clientSecret);
        } else {
          // Handle error
          console.error("Failed to init payment:", res.message);
        }
      });
    } else {
      setClientSecret(null);
    }
  }, [isOpen, milestoneId]);

  if (!isOpen) return null;

  const isSimulated = clientSecret && clientSecret.startsWith("pi_simulated_");

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto"
      aria-labelledby="modal-title"
      role="dialog"
      aria-modal="true"
    >
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
          aria-hidden="true"
          onClick={onClose}
        ></div>

        <span
          className="hidden sm:inline-block sm:align-middle sm:h-screen"
          aria-hidden="true"
        >
          &#8203;
        </span>

        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <h3
              className="text-lg leading-6 font-medium text-gray-900 mb-4"
              id="modal-title"
            >
              Güvenli Ödeme
            </h3>
            {clientSecret ? (
              isSimulated ? (
                <SimulatedCheckoutForm
                  clientSecret={clientSecret}
                  amount={amount}
                  onSuccess={onSuccess}
                  onCancel={onClose}
                />
              ) : (
                <Elements
                  stripe={stripePromise}
                  options={{ clientSecret, appearance: { theme: "stripe" } }}
                >
                  <CheckoutForm
                    milestoneId={milestoneId}
                    amount={amount}
                    onSuccess={onSuccess}
                    onCancel={onClose}
                  />
                </Elements>
              )
            ) : (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

