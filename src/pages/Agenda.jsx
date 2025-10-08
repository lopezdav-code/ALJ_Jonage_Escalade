import React from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Calendar } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const Agenda = () => {
  return (
    <div className="space-y-8">
      <Helmet>
        <title>Agenda - Club d'Escalade</title>
        <meta name="description" content="Consultez l'agenda des événements, compétitions et dates importantes du club d'escalade" />
      </Helmet>

      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center space-y-4"
      >
        <h1 className="text-4xl font-bold headline">Agenda du Club</h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Restez informé de tous les événements et dates importantes du club.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary" />
              Agenda du club
            </CardTitle>
            <CardDescription>
              Consultez l'agenda des événements, compétitions et autres dates importantes du club.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="w-full" style={{ aspectRatio: '4/3' }}>
              <iframe
                src="https://calendar.google.com/calendar/embed?src=40d41279d5c035a144ac235350ac3c6e1fa958eb2d1205404ab392d694098806%40group.calendar.google.com&ctz=Europe%2FParis"
                style={{ border: 0 }}
                width="100%"
                height="100%"
                frameBorder="0"
                scrolling="no"
                className="rounded-lg"
                title="Agenda du club d'escalade"
              />
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default Agenda;