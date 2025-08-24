import React from 'react';
import { Candidate } from '../types';

interface ConfirmVoteModalProps {
  candidate: Candidate;
  onConfirm: () => void;
  onCancel: () => void;
}

const ConfirmVoteModal: React.FC<ConfirmVoteModalProps> = ({ candidate, onConfirm, onCancel }) => {
  if (!candidate) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="bg-base-100 rounded-lg shadow-2xl w-full max-w-md flex flex-col">
        <div className="p-6 text-center border-b border-base-300">
            <h2 className="text-3xl font-bold text-dark-100">
                Confirm Your Selection
            </h2>
            <p className="text-lg text-dark-200 mt-1">
                Apakah Anda Yakin Akan Memberikan Suara Untuk Kandidat Ini?:
            </p>
        </div>
        <div className="p-8 text-center">
            <div className="bg-brand-primary text-white w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold mb-4 mx-auto border-4 border-base-200">
                {candidate.candidateNumber}
            </div>
            <p className="text-2xl font-semibold text-brand-primary">{candidate.ketua.name}</p>
            <p className="text-lg text-dark-200">&</p>
            <p className="text-2xl font-semibold text-brand-primary">{candidate.wakil.name}</p>
        </div>
        <div className="p-4 border-t border-base-300 flex justify-center gap-4">
            <button
                onClick={onCancel}
                className="bg-gray-500 text-white font-bold py-3 px-8 rounded-lg text-md hover:bg-gray-600 transition-colors duration-300"
            >
                Change Selection
            </button>
             <button
                onClick={onConfirm}
                className="bg-brand-primary text-white font-bold py-3 px-8 rounded-lg text-md hover:bg-brand-primary-hover transition-colors duration-300"
            >
                Confirm Vote
            </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmVoteModal;