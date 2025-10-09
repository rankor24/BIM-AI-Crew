import React, { useState } from 'react';
import Card from '../components/Card';
import IntegrationSettingsModal from '../components/IntegrationSettingsModal';
import type { Integration } from '../types';

interface IntegrationCardProps {
    integration: Integration;
    onConnectClick: (integration: Integration) => void;
    onDisconnectClick: (name: string) => void;
}

const IntegrationCard: React.FC<IntegrationCardProps> = ({ integration, onConnectClick, onDisconnectClick }) => {
    let buttonContent;
    let buttonClasses;
    let action;

    if (integration.isLoading) {
        buttonContent = integration.connected ? 'Disconnecting...' : 'Connecting...';
        buttonClasses = 'px-3 py-1 text-sm font-semibold text-slate-500 bg-slate-200 rounded-full cursor-wait';
        action = () => {};
    } else if (integration.connected) {
        buttonContent = 'Disconnect';
        buttonClasses = 'px-3 py-1 text-sm font-semibold text-red-700 bg-red-100 rounded-full hover:bg-red-200';
        action = () => onDisconnectClick(integration.name);
    } else {
        buttonContent = 'Connect';
        buttonClasses = 'px-3 py-1 text-sm font-semibold text-white bg-brand-blue rounded-full hover:bg-blue-700';
        action = () => onConnectClick(integration);
    }

    const colorVariants = [
      'bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-red-500', 
      'bg-amber-500', 'bg-pink-500', 'bg-sky-500', 'bg-indigo-500'
    ];
    const color = colorVariants[integration.name.length % colorVariants.length];

    return (
        <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center">
                <div className={`w-10 h-10 rounded-md mr-4 flex items-center justify-center font-bold text-white text-lg ${color}`}>
                    {integration.name.charAt(0)}
                </div>
                <div>
                    <h4 className="font-semibold text-slate-800">{integration.name}</h4>
                    <p className="text-sm text-slate-500">{integration.description}</p>
                </div>
            </div>
            <button 
                onClick={action} 
                className={buttonClasses}
                disabled={integration.isLoading}
            >
                {buttonContent}
            </button>
        </div>
    );
};


interface SettingsProps {
    integrations: Integration[];
    onConnect: (name: string, settings: Record<string, string>) => void;
    onDisconnect: (name: string) => void;
}

const Settings: React.FC<SettingsProps> = ({ integrations, onConnect, onDisconnect }) => {
  const [configuringIntegration, setConfiguringIntegration] = useState<Integration | null>(null);

  const handleConnect = (settings: Record<string, string>) => {
    if (configuringIntegration) {
      onConnect(configuringIntegration.name, settings);
      setConfiguringIntegration(null);
    }
  };

  const integrationToConfigure = integrations.find(i => i.name === configuringIntegration?.name);

  return (
    <>
    <Card title="App Integrations">
        <p className="text-slate-600 mb-6">Connect your favorite tools to streamline your workflow.</p>
        <div className="space-y-4">
            {integrations.map(integration => 
                <IntegrationCard 
                    key={integration.name} 
                    integration={integration} 
                    onConnectClick={setConfiguringIntegration}
                    onDisconnectClick={onDisconnect}
                />
            )}
        </div>
    </Card>

    {integrationToConfigure && (
        <IntegrationSettingsModal
            integration={integrationToConfigure}
            isOpen={!!configuringIntegration}
            onClose={() => setConfiguringIntegration(null)}
            onConnect={handleConnect}
            isConnecting={integrationToConfigure.isLoading || false}
        />
    )}
    </>
  );
};

export default Settings;