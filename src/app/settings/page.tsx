import { AppShell } from '@/components/layout/app-shell';
import { SapConfigForm } from '@/components/settings/sap-config-form';

export default function SettingsPage() {
  return (
    <AppShell>
      <div className="px-6 py-6 max-w-screen-md mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Paramètres</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Configuration de la connexion SAP et préférences de l&apos;application
          </p>
        </div>
        <SapConfigForm />
      </div>
    </AppShell>
  );
}
