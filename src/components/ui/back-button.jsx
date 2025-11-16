import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from './button';

/**
 * BackButton - Composant standardisé pour tous les boutons retour du projet
 *
 * @param {Object} props
 * @param {string} [props.to] - Chemin vers lequel naviguer (ex: '/admin'). Si non fourni, utilise navigate(-1)
 * @param {Function} [props.onClick] - Fonction personnalisée onClick (prioritaire sur 'to')
 * @param {string} [props.children] - Texte du bouton (défaut: "Retour")
 * @param {string} [props.variant] - Variant du bouton (défaut: "ghost")
 * @param {string} [props.size] - Taille du bouton
 * @param {string} [props.className] - Classes CSS additionnelles
 */
export const BackButton = ({
  to,
  onClick,
  children = "Retour",
  variant = "ghost",
  size,
  className = "",
  ...props
}) => {
  const navigate = useNavigate();

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else if (to) {
      navigate(to);
    } else {
      navigate(-1);
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleClick}
      className={className}
      {...props}
    >
      <ArrowLeft className="w-4 h-4 mr-2" />
      {children}
    </Button>
  );
};

export default BackButton;
