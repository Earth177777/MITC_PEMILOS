import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="w-full bg-base-100 text-dark-200 py-3 text-center text-sm border-t border-base-300">
      <div className="container mx-auto">
        <p className="font-semibold text-dark-100">SMA Maitreyawira & Mitc Club &copy; {new Date().getFullYear()}</p>
        <p className="text-xs">MITC Electronic Voting System</p>
      </div>
    </footer>
  );
};

export default Footer;