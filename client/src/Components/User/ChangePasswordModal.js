import React, { useState, useContext } from 'react';
import context from '../../Context';

const ChangePasswordModal = ({ setShowModal }) => {
  const { authenticatedUser, actions } = useContext(context.Context);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [isVerified, setIsVerified] = useState(false);
  const [error, setError] = useState('');

  const handleVerifyPassword = async (e) => {
    e.preventDefault();
    try {
      const response = await actions.verifyPassword(oldPassword);
      const data = await response.json();
      if (data.isMatch) {
        setIsVerified(true);
        setError('');
      } else {
        setError('Incorrect password.');
      }
    } catch (error) {
      console.error('Verify password error:', error);
      setError('An error occurred.');
    }
  };

  const handleSaveNewPassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmNewPassword) {
      setError('New passwords do not match.');
      return;
    }
    try {
      const result = await actions.updateUser({
        password: newPassword,
        oldPassword: oldPassword,
      });
      
      if (result.length === 0) {
        // Success - clear sensitive data and close modal
        setOldPassword('');
        setNewPassword('');
        setConfirmNewPassword('');
        setShowModal(false);
      } else {
        // Display the specific error from the API
        setError(result[0]);
      }
    } catch (error) {
      console.error('Update password error:', error);
      setError('An error occurred while updating the password.');
    }
  };

  return (
    <div className="modal">
      <div className="modal-content">
        <span className="close" onClick={() => setShowModal(false)}>&times;</span>
        {!isVerified ? (
          <form onSubmit={handleVerifyPassword}>
            <h2>Verify Password</h2>
            {error && <p className="error">{error}</p>}
            <label htmlFor="oldPassword">Old Password</label>
            <input
              id="oldPassword"
              name="oldPassword"
              type="password"
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
            />
            <button className="button" type="submit">Verify</button>
          </form>
        ) : (
          <form onSubmit={handleSaveNewPassword}>
            <h2>Enter New Password</h2>
            {error && <p className="error">{error}</p>}
            <label htmlFor="newPassword">New Password</label>
            <input
              id="newPassword"
              name="newPassword"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
            <label htmlFor="confirmNewPassword">Confirm New Password</label>
            <input
              id="confirmNewPassword"
              name="confirmNewPassword"
              type="password"
              value={confirmNewPassword}
              onChange={(e) => setConfirmNewPassword(e.target.value)}
            />
            <button className="button" type="submit">Save New Password</button>
          </form>
        )}
      </div>
    </div>
  );
};

export default ChangePasswordModal;
