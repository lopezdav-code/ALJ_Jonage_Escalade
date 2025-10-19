import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/customSupabaseClient';

const MemberScheduleTest = () => {
  const [groups, setGroups] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        // Select member_schedule with member and schedule info
        const { data, error: err } = await supabase
          .from('member_schedule')
          .select(`id, member:members(id, first_name, last_name), schedule:schedules(id, type, age_category, day,start_time, end_time)`)
          .order('schedule_id', { ascending: true });

        if (err) throw err;

        // Group by schedule id
        const grouped = (data || []).reduce((acc, row) => {
          const schedule = row.schedule || {};
          const scheduleId = schedule.id || row.schedule_id || 'unknown';
          if (!acc[scheduleId]) {
            acc[scheduleId] = {
              schedule,
              members: []
            };
          }

          acc[scheduleId].members.push({
            id: row.id,
            memberId: row.member?.id || row.member_id,
            first_name: row.member?.first_name || '',
            last_name: row.member?.last_name || '',
          });

          return acc;
        }, {});

        setGroups(grouped);
      } catch (e) {
        console.error('Erreur fetching member_schedule:', e);
        setError(e.message || String(e));
      } finally {
        setLoading(false);
      }
    };

    fetch();
  }, []);

  if (loading) return <div className="p-8">Chargement des données...</div>;
  if (error) return <div className="p-8 text-red-500">Erreur: {error}</div>;

  const scheduleEntries = Object.values(groups);

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Test - member_schedule (groupé par schedule)</h1>
        <Button onClick={() => navigate('/groupes/admin')}>
          <PlusCircle className="w-4 h-4 mr-2" />
          Gérer les groupes
        </Button>
      </div>

      {scheduleEntries.length === 0 && (
        <p className="text-gray-500">Aucun enregistrement trouvé</p>
      )}

      {scheduleEntries.map((g, idx) => (
        <div key={g.schedule.id || idx} className="mb-8 border p-4 rounded">
          <h2 className="font-semibold mb-2">
            Schedules: {g.schedule.type || '—'}
            {g.schedule.age_category ? (
              <span className="ml-2 text-sm text-muted-foreground">• Age: {g.schedule.age_category}</span>
            ) : null}
            {g.schedule.day ? (
              <span className="ml-2 text-sm text-muted-foreground">• Jour: {g.schedule.day}</span>
            ) : null}
            {g.schedule.start_time ? (
              <span className="ml-2 text-sm text-muted-foreground">• Début: {g.schedule.start_time}</span>
            ) : null}
          </h2>
          <p className="text-sm text-muted-foreground mb-4">ID: {g.schedule.id}</p>

          <table className="w-full table-auto border-collapse text-sm">
            <thead>
              <tr className="bg-gray-100">
                <th className="border px-2 py-1 text-left">Prénom</th>
                <th className="border px-2 py-1 text-left">Nom</th>
              </tr>
            </thead>
            <tbody>
              {g.members.map((m) => (
                <tr key={m.id}>
                  <td className="border px-2 py-1">{m.first_name}</td>
                  <td className="border px-2 py-1">{m.last_name}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  );
};

export default MemberScheduleTest;
