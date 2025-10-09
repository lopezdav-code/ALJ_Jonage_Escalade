import React from 'react';
import { useImageErrorReporting } from '@/hooks/useImageErrorHandler';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, Image as ImageIcon } from 'lucide-react';

const ImageErrorReporting = () => {
  const { reportedErrors } = useImageErrorReporting();

  if (reportedErrors.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ImageIcon className="w-5 h-5" />
            Images manquantes
          </CardTitle>
          <CardDescription>
            Aucune erreur d'image détectée pour le moment
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-green-600">
            ✅ Toutes les images semblent se charger correctement
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-orange-500" />
          Images manquantes ({reportedErrors.length})
        </CardTitle>
        <CardDescription>
          Images qui n'ont pas pu être chargées
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {reportedErrors.map((error, index) => (
            <Alert key={index} variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-1">
                  <div className="font-medium">{error.alt}</div>
                  <div className="text-xs opacity-75">
                    URL: {error.url}
                  </div>
                  <div className="text-xs opacity-75">
                    Détecté: {new Date(error.timestamp).toLocaleString('fr-FR')}
                  </div>
                </div>
              </AlertDescription>
            </Alert>
          ))}
        </div>
        
        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
          <div className="text-sm text-blue-800">
            <strong>💡 Solution :</strong> Vérifiez que les fichiers images existent dans le dossier 
            <code className="mx-1 px-1 bg-blue-100 rounded">public/assets/members/</code>
            avec les noms exacts listés ci-dessus.
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ImageErrorReporting;