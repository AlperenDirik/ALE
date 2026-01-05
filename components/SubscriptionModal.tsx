
import React from 'react';
import { Crown, Check, X } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onUpgrade: () => void;
}

export const SubscriptionModal: React.FC<Props> = ({ isOpen, onClose, onUpgrade }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-3xl max-w-sm w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
        <div className="p-6 gradient-bg text-white relative">
          <button onClick={onClose} className="absolute top-4 right-4 text-white/70 hover:text-white transition-colors">
            <X size={24} />
          </button>
          <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mb-4">
            <Crown size={32} className="text-white" />
          </div>
          <h2 className="text-2xl font-bold">ALE Premium</h2>
          <p className="text-white/80 text-sm mt-1">Unlock the full power of practice.</p>
        </div>

        <div className="p-6 space-y-4">
          <div className="space-y-3">
            {[
              "Unlimited Translations",
              "Unlimited Voice Messages",
              "Unlimited Daily Chats",
              "Aesthetic Vocab Cards",
              "Priority Matching"
            ].map(item => (
              <div key={item} className="flex items-center gap-3 text-sm text-gray-700">
                <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center text-green-600">
                  <Check size={12} />
                </div>
                {item}
              </div>
            ))}
          </div>

          <button 
            onClick={onUpgrade}
            className="w-full gradient-bg text-white font-bold py-4 rounded-xl shadow-lg hover:opacity-90 transition-opacity mt-2"
          >
            Upgrade for $4.99/mo
          </button>
          <p className="text-center text-[10px] text-gray-400">Cancel anytime. 7-day free trial included.</p>
        </div>
      </div>
    </div>
  );
};
