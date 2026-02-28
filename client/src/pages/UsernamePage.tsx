import React, { useState } from 'react';
import '../styles/UsernamePage.css';

interface UsernamePageProps {
  onConfirm: (username: string) => void;
}

const USERNAME_RE = /^[a-zA-Z0-9_]{2,16}$/;

const UsernamePage: React.FC<UsernamePageProps> = ({ onConfirm }) => {
  const [value, setValue] = useState('');
  const [touched, setTouched] = useState(false);

  const isValid = USERNAME_RE.test(value);
  const showError = touched && !isValid;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);
    if (isValid) {
      localStorage.setItem('ms_username', value);
      onConfirm(value);
    }
  };

  return (
    <div className="username-page">
      <div className="username-card">
        <h1>Minesweeper 1v1</h1>
        <p className="username-subtitle">Choisissez un pseudo pour jouer</p>
        <form onSubmit={handleSubmit} className="username-form">
          <input
            type="text"
            className={`username-input${showError ? ' input-error' : ''}`}
            placeholder="Votre pseudo"
            value={value}
            maxLength={16}
            onChange={e => setValue(e.target.value)}
            onBlur={() => setTouched(true)}
            autoFocus
          />
          {showError && (
            <p className="username-error">
              2-16 caractères, lettres/chiffres/underscore uniquement
            </p>
          )}
          <button className="btn-primary" type="submit" disabled={!isValid}>
            Jouer
          </button>
        </form>
      </div>
    </div>
  );
};

export default UsernamePage;
