import React, { useRef } from 'react';
import SignatureCanvas from 'react-signature-canvas';

interface SignatureAreaProps {
    onEnd: (base64: string | null) => void;
}

const SignatureArea: React.FC<SignatureAreaProps> = ({ onEnd }) => {
    const sigPad = useRef<SignatureCanvas>(null);

    const handleClear = () => {
        sigPad.current?.clear();
        onEnd(null); // On vide la signature dans le parent
    };

    const handleEnd = () => {
        // On récupère l'image en format Base64 PNG
        if (sigPad.current && !sigPad.current.isEmpty()) {
            onEnd(sigPad.current.getTrimmedCanvas().toDataURL('image/png'));
        }
    };

    return (
        <div className="border rounded p-2 bg-white">
            <p className="text-sm font-bold text-gray-700 mb-1">Signature du bénéficiaire :</p>
            <div className="border-2 border-dashed border-gray-300 rounded bg-gray-50 cursor-crosshair">
                <SignatureCanvas 
                    ref={sigPad}
                    penColor="black"
                    canvasProps={{
                        width: 450, // Largeur fixe ou adapte avec CSS
                        height: 150,
                        className: 'sigCanvas w-full h-40' 
                    }}
                    onEnd={handleEnd} // Déclenché quand on lève le doigt/souris
                />
            </div>
            <button 
                type="button" 
                onClick={handleClear}
                className="text-xs text-red-600 mt-1 underline"
            >
                Effacer la signature
            </button>
        </div>
    );
};

export default SignatureArea;