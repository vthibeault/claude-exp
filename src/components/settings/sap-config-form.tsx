'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useSapConfig } from '@/hooks/use-sap-config';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';

type TestStatus = 'idle' | 'loading' | 'success' | 'error';

export function SapConfigForm() {
  const { config, saveConfig, clearConfig } = useSapConfig();
  const [baseUrl, setBaseUrl] = useState(config?.baseUrl ?? '');
  const [username, setUsername] = useState(config?.username ?? '');
  const [password, setPassword] = useState(config?.password ?? '');
  const [testStatus, setTestStatus] = useState<TestStatus>('idle');
  const [testMessage, setTestMessage] = useState('');

  async function handleTest() {
    setTestStatus('loading');
    try {
      const res = await fetch('/api/sap/API_PROJECT_V2/Project?$top=1');
      if (res.ok) {
        setTestStatus('success');
        setTestMessage('Connexion réussie');
      } else {
        setTestStatus('error');
        setTestMessage(`Erreur ${res.status}: ${res.statusText}`);
      }
    } catch (err) {
      setTestStatus('error');
      setTestMessage(err instanceof Error ? err.message : 'Erreur de connexion');
    }
  }

  function handleSave() {
    saveConfig({ baseUrl, username, password });
    setTestStatus('idle');
  }

  return (
    <div className="space-y-6 max-w-md">
      <div>
        <h2 className="text-lg font-semibold">Connexion SAP OData</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Ces paramètres sont stockés localement et utilisés en mode démo.
          En production, configurez les variables d&apos;environnement sur le serveur.
        </p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="baseUrl">URL SAP Gateway</Label>
          <Input
            id="baseUrl"
            placeholder="https://your-s4hana.example.com:8000"
            value={baseUrl}
            onChange={(e) => setBaseUrl(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="username">Utilisateur SAP</Label>
          <Input
            id="username"
            placeholder="SAPUSER"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Mot de passe</Label>
          <Input
            id="password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Button onClick={handleSave} disabled={!baseUrl}>
          Enregistrer
        </Button>

        <Button variant="outline" onClick={handleTest} disabled={testStatus === 'loading'}>
          {testStatus === 'loading' ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : null}
          Tester la connexion
        </Button>

        {config && (
          <Button variant="ghost" onClick={clearConfig}>
            Réinitialiser
          </Button>
        )}
      </div>

      {testStatus !== 'idle' && testStatus !== 'loading' && (
        <div className={`flex items-center gap-2 text-sm ${testStatus === 'success' ? 'text-green-600' : 'text-red-600'}`}>
          {testStatus === 'success' ? (
            <CheckCircle2 className="h-4 w-4" />
          ) : (
            <XCircle className="h-4 w-4" />
          )}
          {testMessage}
        </div>
      )}

      <div className="rounded-md border p-4 bg-muted/30 text-sm space-y-1">
        <p className="font-medium">Mode démo actif</p>
        <p className="text-muted-foreground">
          Sans SAP_BASE_URL configuré sur le serveur, l&apos;application utilise des données de
          démonstration (projets Vidéotron/Freedom Mobile fictifs). Idéal pour présenter l&apos;outil.
        </p>
      </div>
    </div>
  );
}
