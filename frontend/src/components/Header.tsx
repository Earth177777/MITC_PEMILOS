import React from 'react';
import LiveClock from './LiveClock';
import MarqueeBanner from './MarqueeBanner';

const Header: React.FC = () => {
  return (
    <header className="w-full bg-base-100 shadow-lg z-10 border-b border-base-300">
      <div className="container mx-auto px-4 sm:px-6 lg:p-4">
        <div className="flex items-center justify-between h-16">
          <div className="w-1/4">
            <LiveClock />
          </div>
          <div className="w-1/2 flex items-center justify-center">
            <img
              src="/images/MW_LOGO.jpeg"
              alt="MW Logo"
              className="h-10 w-10 object-contain text-brand-primary mr-3"
            />
            <div className="text-center">
                <h1 className="text-dark-100 text-lg md:text-xl font-bold tracking-wider">
                  SMA Maitreyawira & Mitc Club
                </h1>
                <p className="text-brand-primary font-semibold text-xs tracking-widest">PEMILIHAN OSIS DAN WAKIL OSIS SMA MAITREYAWIRA 2025/2026</p>
            </div>
          </div>
          <div className="w-1/4">
            {/* Placeholder for logo or other info */}
          </div>
        </div>
      </div>
      <MarqueeBanner 
        messages={[
          "PEMILIHAN ANDA ADALAH SUARA KITA SEMUA.",
          "MITC Maitreyawira Innovation Technology Club.",
          "PEMILIHAN BERSIFAT WAJIB, AKAN ADA NOTIF JIKA TIDAK MEMILIH.", 
          "PILIHLAH YANG TERBAIK.",
          "SUARAMU, PILIHANMU, MASADEPAN KITA."
        ]}
        rotationInterval={3000}
      />
    </header>
  );
};

export default Header;