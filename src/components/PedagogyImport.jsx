import React, { useState } from 'react';
import { UploadCloud, Loader2, FileJson } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/customSupabaseClient';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from "@/components/ui/dialog";
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

const PedagogyImport = ({ onImportSuccess }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [file, setFile] = useState(null);
    const { toast } = useToast();

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
        }
    };

    const handleImport = async () => {
        if (!file) {
            toast({ title: "Erreur", description: "Veuillez sélectionner un fichier JSON.", variant: "destructive" });
            return;
        }

        setLoading(true);
        const reader = new FileReader();

        reader.onload = async (e) => {
            try {
                const jsonContent = JSON.parse(e.target.result);

                if (!Array.isArray(jsonContent)) {
                    throw new Error("Le fichier doit contenir un tableau d'objets JSON.");
                }

                // Validation basique et nettoyage
                const sheetsToInsert = jsonContent.map(item => ({
                    title: item.title,
                    description: item.description,
                    game_goal: item.game_goal,
                    starting_situation: item.starting_situation,
                    success_criteria: item.success_criteria,
                    evolution: item.evolution,
                    sheet_type: item.sheet_type || 'educational_game',
                    theme: item.theme,
                    structure: item.structure || 'SAE',
                    type: item.type || 'image_file',
                    url: item.url,
                    illustration_image: item.illustration_image,
                    skill_to_develop: item.skill_to_develop,
                    remarks: item.remarks,
                    categories: item.categories || [],
                    thumbnail_url: item.thumbnail_url
                }));

                const { error } = await supabase.from('pedagogy_sheets').insert(sheetsToInsert);

                if (error) throw error;

                toast({ title: "Succès", description: `${sheetsToInsert.length} fiches importées avec succès.` });
                setIsOpen(false);
                setFile(null);
                if (onImportSuccess) onImportSuccess();

            } catch (error) {
                console.error("Erreur d'import:", error);
                toast({
                    title: "Erreur d'import",
                    description: error.message || "Une erreur est survenue lors de l'import.",
                    variant: "destructive"
                });
            } finally {
                setLoading(false);
            }
        };

        reader.onerror = () => {
            toast({ title: "Erreur", description: "Impossible de lire le fichier.", variant: "destructive" });
            setLoading(false);
        };

        reader.readAsText(file);
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" className="gap-2">
                    <UploadCloud className="w-4 h-4" />
                    Importer JSON
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Importer des fiches pédagogiques</DialogTitle>
                    <DialogDescription>
                        Sélectionnez un fichier JSON contenant les fiches à importer.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="file" className="text-right">
                            Fichier JSON
                        </Label>
                        <div className="col-span-3">
                            <Input
                                id="file"
                                type="file"
                                accept=".json"
                                onChange={handleFileChange}
                                disabled={loading}
                            />
                        </div>
                    </div>
                </div>
                <DialogFooter>
                    <Button onClick={handleImport} disabled={!file || loading}>
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Importer
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default PedagogyImport;
