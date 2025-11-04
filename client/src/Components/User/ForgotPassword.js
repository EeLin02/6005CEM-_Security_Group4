import React, { useState } from 'react';
import Data from '../../Data';   // adjust relative path if needed
const data = new Data();

const ForgotPassword = () => {
  const [emailAddress, setEmailAddress] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage('');
    setError('');

    try {
      const result = await data.forgotPassword(emailAddress);
      if (result.error) setError(result.error);
      else setMessage(result.message);
    } catch (err) {
      console.error(err);
      setError('Something went wrong.');
    }
  };

  return (
    <div className="form--centered">
      <h2>Forgot Password</h2>
      {message && <p style={{ color: 'green' }}>{message}</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <form onSubmit={handleSubmit}>
        <label htmlFor="emailAddress">Email Address</label>
        <input
          id="emailAddress"
          name="emailAddress"
          type="email"
          value={emailAddress}
          onChange={(e) => setEmailAddress(e.target.value)}
          required
        />
        <button className="button" type="submit">Send Reset Link</button>
      </form>
    </div>
  );
};

export default ForgotPassword;
