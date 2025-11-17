import React, { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import context from '../../Context';
import ChangePasswordModal from './ChangePasswordModal';

const Settings = () => {
  const { authenticatedUser, actions } = useContext(context.Context);
  const [user, setUser] = useState(authenticatedUser);
  const [showModal, setShowModal] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    setUser(authenticatedUser);
  }, [authenticatedUser]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setUser({ ...user, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const updatedUser = {
        firstName: user.firstName,
        lastName: user.lastName,
      };
      await actions.updateUser(updatedUser, authenticatedUser.emailAddress);
      navigate('/courses');
    } catch (error) {
      console.error('Error updating user:', error);
      // Handle error (e.g., show error message)
    }
  };

  const handleCancel = () => {
    navigate('/courses');
  };

  return (
    <div className="wrap">
      {showModal && <ChangePasswordModal setShowModal={setShowModal} />}
      <h2>Settings</h2>
      <form onSubmit={handleSubmit}>
        <div className="main--flex">
          <div>
            <label htmlFor="firstName">First Name</label>
            <input
              id="firstName"
              name="firstName"
              type="text"
              value={user.firstName || ''}
              onChange={handleChange}
            />
            <label htmlFor="lastName">Last Name</label>
            <input
              id="lastName"
              name="lastName"
              type="text"
              value={user.lastName || ''}
              onChange={handleChange}
            />
            <label htmlFor="emailAddress">Email Address</label>
            <input
              id="emailAddress"
              name="emailAddress"
              type="email"
              value={user.emailAddress || ''}
              disabled
            />
          </div>
        </div>
        <button className="button" type="submit">
          Save
        </button>
        <button
          type="button"
          className="button button-secondary"
          onClick={() => setShowModal(true)}
        >
          Change Password
        </button>
        <button
          type="button"
          className="button button-secondary"
          onClick={handleCancel}
        >
          Cancel
        </button>
      </form>
    </div>
  );
};

export default Settings;

