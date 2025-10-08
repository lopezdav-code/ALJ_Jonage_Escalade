import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, XCircle, Clock, Award, Repeat } from 'lucide-react';
import { formatName } from '@/lib/utils';

const correctSound = new Audio("data:audio/wav;base64,UklGRl9vT19XQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YU... (truncated)");
const incorrectSound = new Audio("data:audio/wav;base64,UklGRl9vT19XQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YU... (truncated)");

const shuffleArray = (array) => {
  let currentIndex = array.length, randomIndex;
  while (currentIndex !== 0) {
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;
    [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
  }
  return array;
};

const QuizSetup = ({ onStartQuiz }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: 1, scale: 1 }}
    className="text-center"
  >
    <Card className="max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl">Prêt pour le défi ?</CardTitle>
        <CardDescription>Choisissez la durée de votre session de quiz.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {[1, 2, 3, 5].map(duration => (
          <Button key={duration} size="lg" onClick={() => onStartQuiz(duration * 60)}>
            {duration} minute{duration > 1 ? 's' : ''}
          </Button>
        ))}
      </CardContent>
    </Card>
  </motion.div>
);

const QuizSummary = ({ score, total, onRestart, onExit }) => (
  <motion.div
    initial={{ opacity: 0, y: 50 }}
    animate={{ opacity: 1, y: 0 }}
    className="text-center"
  >
    <Card className="max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-3xl">Session terminée !</CardTitle>
        <div className="flex justify-center my-4">
          <Award className="w-16 h-16 text-yellow-500" />
        </div>
        <CardDescription className="text-lg">Votre score final est de</CardDescription>
        <p className="text-5xl font-bold my-2">{score} / {total}</p>
      </CardHeader>
      <CardContent className="flex justify-center gap-4">
        <Button onClick={onRestart}>
          <Repeat className="mr-2 h-4 w-4" /> Rejouer
        </Button>
        <Button variant="outline" onClick={onExit}>
          Quitter
        </Button>
      </CardContent>
    </Card>
  </motion.div>
);

const VolunteerQuiz = ({ volunteers, onQuizEnd }) => {
  const [gameState, setGameState] = useState('setup');
  const [duration, setDuration] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [score, setScore] = useState(0);
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answerStatus, setAnswerStatus] = useState(null);

  const generateQuestions = useCallback(() => {
    const allQuestions = [];
    const volunteersWithData = volunteers.filter(v => v.first_name && v.photo_url);
    if (volunteersWithData.length < 4) {
        setQuestions([]);
        return;
    }
    
    const bureauMembers = volunteersWithData.filter(v => v.title === 'Bureau' && (v.sub_group || v.dynamic_roles?.length > 0));
    const otherVolunteers = volunteersWithData.filter(v => v.title !== 'Bureau');

    const questionSubjects = shuffleArray([...bureauMembers, ...bureauMembers, ...otherVolunteers]);

    questionSubjects.forEach(subject => {
      let question = null;
      const isBureauMember = subject.title === 'Bureau';
      const allRoles = Array.from(new Set([...(subject.dynamic_roles || []), ...(subject.sub_group ? [subject.sub_group] : [])]));

      const questionTypes = [];
      if (subject.photo_url) {
        questionTypes.push('photo-to-name');
        if (isBureauMember && allRoles.length > 0) {
          questionTypes.push('photo-to-role');
        }
      }
      if (isBureauMember && allRoles.length > 0) {
        questionTypes.push('role-to-name');
        if (bureauMembers.filter(v => v.photo_url).length >= 4) {
            questionTypes.push('role-to-photo');
        }
      }

      if (questionTypes.length === 0) return;

      const questionType = questionTypes[Math.floor(Math.random() * questionTypes.length)];
      const chosenRole = allRoles.length > 0 ? allRoles[Math.floor(Math.random() * allRoles.length)] : null;

      const getRoleOptions = (correctRole) => {
        const allPossibleRoles = new Set(['Coach', 'Encadrant', 'Ouvreur']);
        bureauMembers.forEach(v => {
          if (v.sub_group) allPossibleRoles.add(v.sub_group);
          v.dynamic_roles?.forEach(r => allPossibleRoles.add(r));
        });
        const options = new Set([correctRole]);
        const rolePool = Array.from(allPossibleRoles);
        while (options.size < 4 && options.size < rolePool.length) {
          options.add(rolePool[Math.floor(Math.random() * rolePool.length)]);
        }
        return shuffleArray(Array.from(options));
      };

      const getNameOptions = (correctName) => {
        const options = new Set([correctName]);
        while (options.size < 4 && options.size < volunteersWithData.length) {
          const randomVol = volunteersWithData[Math.floor(Math.random() * volunteersWithData.length)];
          options.add(randomVol.first_name);
        }
        return shuffleArray(Array.from(options));
      };

      const getPhotoOptions = (correctSubject) => {
        const photoVolunteers = bureauMembers.filter(v => v.photo_url);
        const options = new Set([correctSubject]);
        while (options.size < 4 && options.size < photoVolunteers.length) {
          options.add(photoVolunteers[Math.floor(Math.random() * photoVolunteers.length)]);
        }
        return shuffleArray(Array.from(options));
      };

      switch (questionType) {
        case 'photo-to-name':
          question = {
            type: 'photo-to-name',
            text: 'Qui est cette personne ?',
            subject: subject,
            options: getNameOptions(subject.first_name),
            correctAnswer: subject.first_name,
          };
          break;
        case 'photo-to-role':
          question = {
            type: 'photo-to-role',
            text: 'Quel est un des rôles de cette personne ?',
            subject: subject,
            options: getRoleOptions(chosenRole),
            correctAnswer: chosenRole,
          };
          break;
        case 'role-to-name':
          question = {
            type: 'role-to-name',
            text: `Qui a le rôle de "${chosenRole}" ?`,
            subject: subject,
            options: getNameOptions(subject.first_name),
            correctAnswer: subject.first_name,
          };
          break;
        case 'role-to-photo':
          question = {
            type: 'role-to-photo',
            text: `Qui a le rôle de "${chosenRole}" ?`,
            subject: subject,
            options: getPhotoOptions(subject),
            correctAnswer: subject.id,
          };
          break;
        default:
          break;
      }

      if (question) {
        allQuestions.push(question);
      }
    });

    setQuestions(shuffleArray(allQuestions));
  }, [volunteers]);

  useEffect(() => {
    if (gameState === 'playing') {
      generateQuestions();
      const timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            setGameState('summary');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [gameState, generateQuestions]);

  const handleStartQuiz = (selectedDuration) => {
    setDuration(selectedDuration);
    setTimeLeft(selectedDuration);
    setScore(0);
    setCurrentQuestionIndex(0);
    setGameState('playing');
  };

  const handleAnswer = (answer) => {
    if (answerStatus) return;

    const currentQuestion = questions[currentQuestionIndex];
    let isCorrect = false;
    if (currentQuestion.type === 'role-to-photo') {
        isCorrect = answer.id === currentQuestion.correctAnswer;
    } else {
        isCorrect = answer === currentQuestion.correctAnswer;
    }

    if (isCorrect) {
      setScore(s => s + 1);
      setAnswerStatus('correct');
      correctSound.play();
    } else {
      setAnswerStatus('incorrect');
      incorrectSound.play();
    }

    setTimeout(() => {
      setAnswerStatus(null);
      if (currentQuestionIndex + 1 < questions.length) {
        setCurrentQuestionIndex(i => i + 1);
      } else {
        generateQuestions();
        setCurrentQuestionIndex(0);
      }
    }, 1500);
  };

  const handleRestart = () => {
    setGameState('setup');
  };

  const currentQuestion = questions[currentQuestionIndex];
  const progress = (timeLeft / duration) * 100;

  if (gameState === 'setup') {
    return <QuizSetup onStartQuiz={handleStartQuiz} />;
  }

  if (gameState === 'summary') {
    return <QuizSummary score={score} total={currentQuestionIndex + (answerStatus ? 1 : 0)} onRestart={handleRestart} onExit={onQuizEnd} />;
  }

  if (!currentQuestion) {
    return (
      <div className="text-center p-8">
        <p className="text-lg">Préparation du quiz...</p>
        <p className="text-sm text-muted-foreground mt-2">Il faut au moins 4 bénévoles avec des photos pour démarrer le quiz.</p>
      </div>
    );
  }
  
  const getInitials = (firstName, lastName) => `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="flex items-center gap-4 mb-4">
        <Clock className="w-6 h-6" />
        <Progress value={progress} className="w-full" />
        <span className="font-bold text-lg">{Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, '0')}</span>
      </div>
      <AnimatePresence mode="wait">
        <motion.div
          key={currentQuestionIndex}
          initial={{ opacity: 0, x: 100 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -100 }}
          transition={{ duration: 0.3 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="text-center text-2xl">{currentQuestion.text}</CardTitle>
              {(currentQuestion.type === 'photo-to-name' || currentQuestion.type === 'photo-to-role') && (
                <div className="flex justify-center mt-4">
                  <Avatar className="w-32 h-32">
                    <AvatarImage src={currentQuestion.subject.photo_url} />
                    <AvatarFallback className="text-4xl">{getInitials(currentQuestion.subject.first_name, currentQuestion.subject.last_name)}</AvatarFallback>
                  </Avatar>
                </div>
              )}
            </CardHeader>
            <CardContent>
              <div className={`grid ${currentQuestion.type === 'role-to-photo' ? 'grid-cols-2' : 'grid-cols-1'} gap-4`}>
                {currentQuestion.options.map((option, i) => {
                  const isPhotoOption = currentQuestion.type === 'role-to-photo';
                  const isSelected = answerStatus && (isPhotoOption ? option.id === currentQuestion.correctAnswer : option === currentQuestion.correctAnswer);
                  const isWrongSelection = answerStatus === 'incorrect' && (isPhotoOption ? option.id === (answerStatus.selected?.id) : option === answerStatus.selected);

                  return (
                    <Button
                      key={i}
                      variant="outline"
                      size={isPhotoOption ? 'xl' : 'lg'}
                      className={`relative justify-center h-auto p-4 text-base ${
                        answerStatus === 'correct' && isSelected ? 'bg-green-200 border-green-500' : ''
                      } ${
                        answerStatus === 'incorrect' && isSelected ? 'bg-green-200 border-green-500' : ''
                      } ${
                        isWrongSelection ? 'bg-red-200 border-red-500' : ''
                      }`}
                      onClick={() => handleAnswer(isPhotoOption ? option : option)}
                      disabled={!!answerStatus}
                    >
                      {isPhotoOption ? (
                        <div className="flex flex-col items-center gap-2">
                           <Avatar className="w-24 h-24">
                            <AvatarImage src={option.photo_url} />
                            <AvatarFallback className="text-3xl">{getInitials(option.first_name, option.last_name)}</AvatarFallback>
                          </Avatar>
                        </div>
                      ) : (
                        <span>{option}</span>
                      )}
                      {answerStatus === 'correct' && isSelected && <CheckCircle className="absolute right-4 top-1/2 -translate-y-1/2 w-6 h-6 text-green-600" />}
                      {answerStatus === 'incorrect' && isSelected && <CheckCircle className="absolute right-4 top-1/2 -translate-y-1/2 w-6 h-6 text-green-600" />}
                      {isWrongSelection && <XCircle className="absolute right-4 top-1/2 -translate-y-1/2 w-6 h-6 text-red-600" />}
                    </Button>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </AnimatePresence>
      <div className="text-center mt-4 font-bold text-xl">Score: {score}</div>
      <AnimatePresence>
        {score > 0 && score % 5 === 0 && answerStatus === 'correct' && (
            <motion.div
                initial={{ opacity: 0, y: 50, scale: 0.5 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.5 }}
                className="text-center text-green-500 font-bold text-2xl mt-4"
            >
                Bravo ! Déjà {score} bonnes réponses !
            </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default VolunteerQuiz;