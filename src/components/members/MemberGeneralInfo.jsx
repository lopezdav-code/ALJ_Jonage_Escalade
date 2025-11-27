import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { User, Mail, Phone, Award, Shield, Eye, Users, FileText } from 'lucide-react';

const InfoRow = ({ icon: Icon, label, value }) => {
  if (!value) return null;

  return (
    <div className="flex items-start gap-3 py-2">
      {Icon && <Icon className="w-5 h-5 text-muted-foreground mt-0.5" />}
      <div className="flex-1">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        <p className="text-base">{value}</p>
      </div>
    </div>
  );
};

const MemberGeneralInfo = ({ member, emergencyContacts, isEmergencyContactFor, fromTab }) => {
  const navigate = useNavigate();

  return (
    <div className="grid gap-6 md:grid-cols-2 animate-in fade-in duration-500">
      {/* Informations générales */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            Informations générales
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-1">
          <InfoRow icon={User} label="Sexe" value={member.sexe === 'H' ? 'Homme' : member.sexe === 'F' ? 'Femme' : null} />
          <InfoRow icon={Users} label="Groupe" value={member.groupInfo ? `${member.groupInfo.category} ${member.groupInfo.sous_category ? '- ' + member.groupInfo.sous_category : ''}` : 'Aucun'} />
          <InfoRow icon={FileText} label="Licence" value={member.licence} />
        </CardContent>
      </Card>

      {/* Contact */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5" />
            Contact
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-1">
          <InfoRow icon={Mail} label="Email" value={member.email} />
          <InfoRow icon={Phone} label="Téléphone" value={member.phone} />
        </CardContent>
      </Card>

      {/* Escalade */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="w-5 h-5" />
            Escalade
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-1">
          <InfoRow icon={Award} label="Passeport" value={member.passeport} />
          {member.tete_ok !== null && member.tete_ok !== undefined && (
            <div className="py-2">
              <p className="text-sm font-medium text-muted-foreground mb-1">Montée en tête</p>
              <Badge variant={member.tete_ok ? "default" : "secondary"}>
                {member.tete_ok ? "Sait monter en tête" : "Ne sait pas monter en tête"}
              </Badge>
            </div>
          )}
          {member.brevet_federaux && member.brevet_federaux.length > 0 && (
            <div className="py-2">
              <p className="text-sm font-medium text-muted-foreground mb-2">Brevets fédéraux</p>
              <div className="flex flex-wrap gap-2">
                {member.brevet_federaux.map((brevet, index) => (
                  <Badge key={index} variant="outline">
                    {brevet}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Emergency contacts */}
      {(emergencyContacts.contact1 || emergencyContacts.contact2) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Contacts d'urgence
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {emergencyContacts.contact1 && (
              <div className="pb-3 border-b last:border-b-0">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <p className="text-sm font-medium text-muted-foreground">Contact 1</p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate(`/member-view/${emergencyContacts.contact1.id}`, { state: { fromTab } })}
                    className="flex items-center gap-1"
                  >
                    <Eye className="w-3 h-3" />
                    Voir la fiche
                  </Button>
                </div>
                <p className="text-base font-semibold mb-1">{emergencyContacts.contact1.first_name} {emergencyContacts.contact1.last_name}</p>
                <div className="space-y-1">
                  {emergencyContacts.contact1.phone && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Phone className="w-3 h-3" />
                      <span>{emergencyContacts.contact1.phone}</span>
                    </div>
                  )}
                  {emergencyContacts.contact1.email && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Mail className="w-3 h-3" />
                      <span>{emergencyContacts.contact1.email}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
            {emergencyContacts.contact2 && (
              <div className="pb-3 border-b last:border-b-0">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <p className="text-sm font-medium text-muted-foreground">Contact 2</p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate(`/member-view/${emergencyContacts.contact2.id}`, { state: { fromTab } })}
                    className="flex items-center gap-1"
                  >
                    <Eye className="w-3 h-3" />
                    Voir la fiche
                  </Button>
                </div>
                <p className="text-base font-semibold mb-1">{emergencyContacts.contact2.first_name} {emergencyContacts.contact2.last_name}</p>
                <div className="space-y-1">
                  {emergencyContacts.contact2.phone && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Phone className="w-3 h-3" />
                      <span>{emergencyContacts.contact2.phone}</span>
                    </div>
                  )}
                  {emergencyContacts.contact2.email && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Mail className="w-3 h-3" />
                      <span>{emergencyContacts.contact2.email}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Is emergency contact for */}
      {isEmergencyContactFor.length > 0 && (
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Contact d'urgence pour
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {isEmergencyContactFor.map((person) => (
                <Button
                  key={person.id}
                  variant="outline"
                  size="sm"
                  onClick={() => navigate(`/member-view/${person.id}`, { state: { fromTab } })}
                  className="flex items-center gap-2"
                >
                  <Eye className="w-3 h-3" />
                  {person.first_name} {person.last_name}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default MemberGeneralInfo;
