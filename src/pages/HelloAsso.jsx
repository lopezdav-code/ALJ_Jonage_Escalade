import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { authenticate, getOrders } from '@/services/helloasso';
import { supabase } from '@/lib/customSupabaseClient';
import { Loader2, Save, RefreshCw } from 'lucide-react';

const HelloAsso = () => {
    const clientId = import.meta.env.VITE_HELLOASSO_CLIENT_ID;
    const clientSecret = import.meta.env.VITE_HELLOASSO_CLIENT_SECRET;
    const organizationSlug = import.meta.env.VITE_HELLOASSO_ORGANIZATION_SLUG;
    const [logs, setLogs] = useState([]);
    const [showDebug, setShowDebug] = useState(true);
    const [loading, setLoading] = useState(false);
    const [orders, setOrders] = useState([]);
    const [jsonResponse, setJsonResponse] = useState(null);
    const [saving, setSaving] = useState(false);
    const { toast } = useToast();

    const addLog = (message) => {
        const logMessage = `${new Date().toLocaleTimeString()} - ${message}`;
        console.log('[HelloAsso]', logMessage);
        setLogs(prev => [...prev, logMessage]);
    };

    const handleFetchOrders = async () => {
        setLoading(true);
        setLogs([]);

        addLog("=== HELLO WORLD - Debug mode started ===");
        addLog(`Client ID: ${clientId ? clientId.substring(0, 8) + '...' : 'NOT SET'}`);
        addLog(`Organization Slug: ${organizationSlug || 'NOT SET'}`);
        addLog(`Client Secret: ${clientSecret ? '***SET***' : 'NOT SET'}`);

        try {
            if (!clientId || !clientSecret || !organizationSlug) {
                const errorMsg = "Veuillez remplir tous les champs de configuration (Client ID, Secret, Slug).";
                addLog(`ERROR: ${errorMsg}`);
                throw new Error(errorMsg);
            }

            addLog("Starting authentication...");
            const authData = await authenticate(clientId, clientSecret, addLog);

            addLog("Fetching orders...");
            const ordersData = await getOrders(authData.access_token, organizationSlug, 1, 20, addLog);

            addLog("Enriching orders with member and competition data...");
            const enrichedOrders = await Promise.all(ordersData.data.map(async (order) => {
                const customFields = order.items?.[0]?.customFields || [];
                const licenseField = customFields.find(f => f.name === "License");
                const competitionField = customFields.find(f => f.name === "Compétition concernée");

                let memberData = null;
                let competitionData = null;

                if (licenseField?.answer) {
                    addLog(`Looking up member with license: ${licenseField.answer}`);
                    const { data: members, error } = await supabase
                        .from('members')
                        .select('first_name, last_name')
                        .eq('licence', licenseField.answer);

                    if (error) {
                        addLog(`Member lookup error for license ${licenseField.answer}: ${error.message}`);
                    } else if (members && members.length > 0) {
                        memberData = members[0];
                        addLog(`Found member: ${memberData.first_name} ${memberData.last_name}`);
                    } else {
                        addLog(`No member found for license ${licenseField.answer}`);
                    }
                }

                if (competitionField?.answer) {
                    addLog(`Looking up competition with ID: ${competitionField.answer}`);
                    const { data: competitions, error } = await supabase
                        .from('competitions')
                        .select('name')
                        .eq('id', competitionField.answer);

                    if (error) {
                        addLog(`Competition lookup error for ID ${competitionField.answer}: ${error.message}`);
                    } else if (competitions && competitions.length > 0) {
                        competitionData = competitions[0];
                        addLog(`Found competition: ${competitionData.name}`);
                    } else {
                        addLog(`No competition found for ID ${competitionField.answer}`);
                    }
                }

                return { ...order, memberData, competitionData };
            }));

            setOrders(enrichedOrders);
            setJsonResponse(ordersData);
            addLog(`Received ${enrichedOrders.length} orders`);
            toast({
                title: "Succès",
                description: `${enrichedOrders.length} commandes récupérées.`,
            });
        } catch (error) {
            console.error("Erreur HelloAsso:", error);
            const errorMessage = error?.message || error?.toString() || "Erreur inconnue";
            addLog(`FATAL ERROR: ${errorMessage}`);
            toast({
                title: "Erreur",
                description: errorMessage,
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    const handleSaveOrders = async () => {
        setSaving(true);
        try {
            const ordersToSave = orders.map(order => {
                const customFields = order.items?.[0]?.customFields || [];
                const licenseField = customFields.find(f => f.name === "License");
                const competitionField = customFields.find(f => f.name === "Compétition concernée");

                return {
                    id: order.id.toString(),
                    date: order.date,
                    payer_first_name: order.payer.firstName,
                    payer_last_name: order.payer.lastName,
                    payer_email: order.payer.email,
                    total_amount: order.amount.total,
                    status: order.items?.[0]?.state || 'Unknown',
                    form_slug: order.formSlug,
                    license: licenseField?.answer || null,
                    competition_id: competitionField?.answer || null,
                    items: order.items,
                    raw_data: order
                };
            });

            const { error } = await supabase
                .from('helloasso_orders')
                .upsert(ordersToSave, { onConflict: 'id' });

            if (error) throw error;

            toast({
                title: "Succès",
                description: "Commandes sauvegardées dans la base de données.",
            });
        } catch (error) {
            console.error("Erreur sauvegarde:", error);
            toast({
                title: "Erreur",
                description: "Impossible de sauvegarder les commandes.",
                variant: "destructive",
            });
        } finally {
            setSaving(false);
        }
    };

    const handleRegisterParticipant = async (order, licenseField, competitionField) => {
        try {
            const { data: member } = await supabase
                .from('members')
                .select('id')
                .eq('licence', licenseField.answer)
                .single();

            if (!member) {
                toast({
                    title: "Erreur",
                    description: "Membre non trouvé",
                    variant: "destructive",
                });
                return;
            }

            // Vérifier si le participant existe déjà
            const { data: existing } = await supabase
                .from('competition_participants')
                .select('id, role')
                .eq('competition_id', competitionField.answer)
                .eq('member_id', member.id)
                .single();

            let error;
            if (existing) {
                // Existe déjà : mettre à jour SEULEMENT le statut
                const result = await supabase
                    .from('competition_participants')
                    .update({ statut: order.items?.[0]?.state || 'Unknown' })
                    .eq('competition_id', competitionField.answer)
                    .eq('member_id', member.id);
                error = result.error;
            } else {
                // N'existe pas : créer avec role et statut
                const result = await supabase
                    .from('competition_participants')
                    .insert({
                        competition_id: competitionField.answer,
                        member_id: member.id,
                        role: 'Competitor',
                        statut: order.items?.[0]?.state || 'Unknown'
                    });
                error = result.error;
            }

            if (error) throw error;

            toast({
                title: "Succès",
                description: existing
                    ? `Statut mis à jour pour ${order.memberData.first_name} ${order.memberData.last_name}`
                    : `${order.memberData.first_name} ${order.memberData.last_name} inscrit`,
            });
        } catch (error) {
            console.error("Erreur inscription:", error);
            toast({
                title: "Erreur",
                description: error.message,
                variant: "destructive",
            });
        }
    };

    return (
        <div className="container mx-auto p-4 space-y-6">
            <h1 className="text-3xl font-bold">Intégration HelloAsso</h1>

            <Card>
                <CardHeader>
                    <CardTitle className="flex justify-between items-center">
                        <span>Actions</span>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setShowDebug(!showDebug)}
                        >
                            {showDebug ? 'Masquer Debug' : 'Afficher Debug'}
                        </Button>
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <Button onClick={handleFetchOrders} disabled={loading}>
                        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
                        Récupérer les commandes
                    </Button>

                    {showDebug && (
                        <div className="space-y-4">
                            <div>
                                <h3 className="text-sm font-semibold mb-2">Logs</h3>
                                <div className="bg-slate-950 text-slate-50 p-4 rounded-md font-mono text-xs h-48 overflow-y-auto">
                                    {logs.length === 0 ? (
                                        <div className="text-slate-500">Aucun log...</div>
                                    ) : (
                                        logs.map((log, i) => (
                                            <div key={i} className="border-b border-slate-800 last:border-0 py-1">
                                                {log}
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>

                            {jsonResponse && (
                                <div>
                                    <h3 className="text-sm font-semibold mb-2">Réponse JSON HelloAsso</h3>
                                    <div className="bg-slate-950 text-slate-50 p-4 rounded-md font-mono text-xs h-96 overflow-auto">
                                        <pre>{JSON.stringify(jsonResponse, null, 2)}</pre>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>

            {orders.length > 0 && (
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle>Résultats ({orders.length})</CardTitle>
                        <Button onClick={handleSaveOrders} disabled={saving}>
                            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                            Sauvegarder en BDD
                        </Button>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="text-xs uppercase bg-muted">
                                    <tr>
                                        <th className="px-4 py-2">Date</th>
                                        <th className="px-4 py-2">Payeur</th>
                                        <th className="px-4 py-2">Email</th>
                                        <th className="px-4 py-2">License</th>
                                        <th className="px-4 py-2">Membre</th>
                                        <th className="px-4 py-2">Compétition</th>
                                        <th className="px-4 py-2">Montant</th>
                                        <th className="px-4 py-2">Statut</th>
                                        <th className="px-4 py-2">Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {orders.map((order) => {
                                        const customFields = order.items?.[0]?.customFields || [];
                                        const licenseField = customFields.find(f => f.name === "License");
                                        const competitionField = customFields.find(f => f.name === "Compétition concernée");

                                        const canRegister = order.memberData && order.competitionData;

                                        return (
                                            <tr key={order.id} className="border-b hover:bg-muted/50">
                                                <td className="px-4 py-2">{new Date(order.date).toLocaleDateString()}</td>
                                                <td className="px-4 py-2">{order.payer.firstName} {order.payer.lastName}</td>
                                                <td className="px-4 py-2">{order.payer.email}</td>
                                                <td className="px-4 py-2">{licenseField?.answer || '-'}</td>
                                                <td className="px-4 py-2">
                                                    {order.memberData ?
                                                        `${order.memberData.first_name} ${order.memberData.last_name}`
                                                        : '-'}
                                                </td>
                                                <td className="px-4 py-2">
                                                    {order.competitionData ?
                                                        order.competitionData.name
                                                        : (competitionField?.answer?.substring(0, 8) || '-')}
                                                </td>
                                                <td className="px-4 py-2">{(order.amount.total / 100).toFixed(2)} €</td>
                                                <td className="px-4 py-2">{order.items?.[0]?.state || '-'}</td>
                                                <td className="px-4 py-2">
                                                    <Button
                                                        size="sm"
                                                        onClick={() => handleRegisterParticipant(order, licenseField, competitionField)}
                                                        disabled={!canRegister}
                                                        variant={canRegister ? "default" : "ghost"}
                                                    >
                                                        <Save className="h-3 w-3" />
                                                    </Button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
};

export default HelloAsso;
