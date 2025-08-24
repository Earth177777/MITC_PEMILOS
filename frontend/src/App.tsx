import React from 'react';
import VotingPage from './pages/VotingPage';
import Header from './components/Header';
import Footer from './components/Footer';

const App: React.FC = () => {
  return (
    <div 
      className="flex flex-col h-screen text-dark-100"
      style={{
        backgroundImage: 'url(/images/MW_GEDUNG.png)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundAttachment: 'fixed'
      }}
    >
      <Header />
      <main className="flex-grow w-full px-2 sm:px-4 flex flex-col items-center justify-center">
        <VotingPage />
      </main>
      <Footer />
    </div>
  );
};

export default App;