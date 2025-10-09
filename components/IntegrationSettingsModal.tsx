import React, { useState, useEffect, PropsWithChildren } from 'react';
import Modal from './Modal';
import type { Integration } from '../types';
import { SparkleIcon } from './Icons';

interface IntegrationSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConnect: (settings: Record<string, string>) => void;
  integration: Integration;
  isConnecting: boolean;
}

const IntegrationSettingsModal: React.FC<IntegrationSettingsModalProps> = ({ isOpen, onClose, onConnect, integration, isConnecting }) => {
  const [formState, setFormState] = useState<Record<string, string>>({});

  useEffect(() => {
    if (integration.settings) {
      const initialSate = integration.settings.reduce((acc, setting) => {
        acc[setting.id] = '';
        return acc;
      }, {} as Record<string, string>);
      setFormState(initialSate);
    }
  }, [integration]);

  const handleChange = (id: string, value: string) => {
    setFormState(prev => ({ ...prev, [id]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConnect(formState);
  };
  
  if (!integration.settings || integration.settings.length === 0) {
      // Auto-connect integrations without settings
      useEffect(() => {
        if(isOpen) {
            onConnect({});
        }
      }, [isOpen]);
      return null;
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Connect to ${integration.name}`}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <p className="text-sm text-slate-600">Please enter your credentials for {integration.name} to continue.</p>
        {integration.settings.map(setting => (
          <div key={setting.id}>
            <label htmlFor={setting.id} className="block text-sm font-medium text-slate-700">{setting.label}</label>
            <input
              type={setting.type}
              id={setting.id}
              value={formState[setting.id] || ''}
              onChange={(e) => handleChange(setting.id, e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-blue focus:border-brand-blue sm:text-sm"
              required
            />
          </div>
        ))}
        <div className="flex justify-end pt-4">
          <button 
            type="submit" 
            disabled={isConnecting}
            className="bg-brand-blue text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center disabled:bg-slate-400 disabled:cursor-wait"
          >
            <SparkleIcon className={`w-5 h-5 mr-2 ${isConnecting ? 'animate-ping' : ''}`} />
            {isConnecting ? 'Connecting...' : 'Save & Connect'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default IntegrationSettingsModal;