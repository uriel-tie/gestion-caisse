import React, { useState } from 'react';
import { HelpCircle, X } from 'lucide-react';

interface HelpIconProps {
  /** Texte d'aide à afficher */
  content: string | React.ReactNode;
  /** Titre optionnel pour la modale */
  title?: string;
  /** Position de la tooltip (si contenu court) */
  position?: 'top' | 'bottom' | 'left' | 'right';
  /** Taille de l'icône */
  size?: number;
  /** Classe CSS personnalisée */
  className?: string;
  /** Force l'affichage en modale même pour les textes courts */
  forceModal?: boolean;
}

export const HelpIcon: React.FC<HelpIconProps> = ({
  content,
  title,
  position = 'top',
  size = 16,
  className = '',
  forceModal = false,
}) => {
  const [showModal, setShowModal] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);

  // Détecter si le contenu est long (nécessite une modale)
  const isLongContent = typeof content === 'string' && content.length > 150;
  const useModal = forceModal || isLongContent || typeof content !== 'string';

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (useModal) {
      setShowModal(true);
    }
  };

  const handleMouseEnter = () => {
    if (!useModal) {
      setShowTooltip(true);
    }
  };

  const handleMouseLeave = () => {
    if (!useModal) {
      setShowTooltip(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className={`inline-flex items-center justify-center text-blue-500 hover:text-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-full ${className}`}
        aria-label="Aide contextuelle"
      >
        <HelpCircle size={size} />
      </button>

      {/* Tooltip pour les contenus courts */}
      {!useModal && showTooltip && (
        <div
          className={`absolute z-50 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg shadow-xl max-w-xs pointer-events-none animate-in fade-in duration-200 ${
            position === 'top' ? 'bottom-full mb-2' : ''
          } ${position === 'bottom' ? 'top-full mt-2' : ''} ${
            position === 'left' ? 'right-full mr-2' : ''
          } ${position === 'right' ? 'left-full ml-2' : ''}`}
          style={{ whiteSpace: 'pre-wrap' }}
        >
          {typeof content === 'string' ? content : content}
          <div
            className={`absolute w-2 h-2 bg-gray-900 transform rotate-45 ${
              position === 'top' ? 'top-full -mt-1 left-4' : ''
            } ${position === 'bottom' ? 'bottom-full -mb-1 left-4' : ''} ${
              position === 'left' ? 'left-full -ml-1 top-2' : ''
            } ${position === 'right' ? 'right-full -mr-1 top-2' : ''}`}
          />
        </div>
      )}

      {/* Modale pour les contenus longs */}
      {useModal && showModal && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
          onClick={() => setShowModal(false)}
        >
          <div
            className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto animate-in fade-in zoom-in duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 flex justify-between items-center rounded-t-xl">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <HelpCircle size={24} />
                {title || 'Aide contextuelle'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 hover:bg-white/20 rounded transition"
                aria-label="Fermer"
              >
                <X size={24} />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 text-gray-700 leading-relaxed">
              {typeof content === 'string' ? (
                <div className="whitespace-pre-wrap">{content}</div>
              ) : (
                content
              )}
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 bg-gray-50 border-t p-4 flex justify-end rounded-b-xl">
              <button
                onClick={() => setShowModal(false)}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition"
              >
                Compris
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};



