import React from 'react';
import type { Candidate } from '../types';

interface CandidateCardProps {
  candidate: Candidate;
  onVote: (candidate: Candidate) => void;
}

const CandidateCard: React.FC<CandidateCardProps> = ({ candidate, onVote }) => {
  return (
    <div
      className={`
        relative bg-base-100 rounded-lg shadow-lg
        transition-all duration-300 flex flex-col text-dark-100
        hover:transform hover:-translate-y-1 hover:shadow-2xl border border-base-300
      `}
    >
      <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-brand-primary text-white w-14 h-14 rounded-full flex items-center justify-center border-4 border-base-200 z-10">
        <span className="text-xl font-bold">{candidate.candidateNumber}</span>
      </div>

      <div className="p-4 pt-8">
        <img className="w-full h-64 object-cover object-center rounded-md" src={candidate.imageUrl} alt={`${candidate.ketua.name} & ${candidate.wakil.name}`} />
      </div>

      <div className="p-4 pt-2 flex flex-col flex-grow text-center">
        <h3 className="text-lg font-bold text-dark-200">Candidate</h3>
        <p className="text-xl font-semibold text-brand-primary mb-1">{candidate.ketua.name}</p>
        <h3 className="text-lg font-bold text-dark-200">Running Mate</h3>
        <p className="text-xl font-semibold text-brand-primary mb-2">{candidate.wakil.name}</p>

        <div className="text-left border border-base-300 rounded-md p-3 h-36 my-2 bg-base-200 overflow-hidden">
            <div>
                <h4 className="text-md font-bold mb-1 text-brand-primary">VISION</h4>
                <p className="text-sm text-dark-200 line-clamp-2">
                    {candidate.visi.join(' ')}
                </p>
            </div>
            <div className="mt-2">
                <h4 className="text-md font-bold mb-1 text-brand-primary">MISSION</h4>
                 <p className="text-sm text-dark-200 line-clamp-3">
                    {candidate.misi.join(' ')}
                </p>
            </div>
        </div>
        
        <div className="mt-auto">
            <button
            onClick={() => onVote(candidate)}
            className="w-full bg-brand-primary text-white font-bold py-3 px-4 rounded-lg text-lg hover:bg-brand-primary-hover transition-colors duration-300"
            >
            VOTE
            </button>
        </div>
      </div>
    </div>
  );
};

export default CandidateCard;