import React, { useState, useContext } from 'react';
import Context from '../../Context';
import { Link, useNavigate, useLocation } from 'react-router-dom';

const UserSignIn = () => {
  const context = useContext(Context.Context);
  const [emailAddress, setEmailAddress] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState([]);

  let navigate = useNavigate();
  let location = useLocation();

  const onChange = (event) => {
    const { name, value } = event.target;

    if (name === 'emailAddress') {
      setEmailAddress(value);
    }
    if (name === 'password') {
      setPassword(value);
    }
  };

  const submit = async (event) => {
  event.preventDefault();
  const { from } = location.state || { from: { pathname: '/' } };

  try {
  const response = await context.actions.signIn(emailAddress, password);

  if (response?.message?.toLowerCase().includes('locked')) {
    const extra = response.details ? ` ${response.details}` : '';
    setErrors([response.message + extra]);
  } else if (response?.id) {
    navigate(from);
  } else {
    setErrors(['Invalid email or password.']);
  }
} catch (error) {
    console.error('Sign-in error:', error);

    // Handle errors thrown from fetch (e.g. 401/403 responses)
    if (error.response) {
      if (error.response.status === 403) {
        setErrors([error.response.data.message || 'Your account is temporarily locked.']);
      } else if (error.response.status === 401) {
        setErrors(['Invalid email or password.']);
      } else {
        setErrors(['Unexpected error occurred.']);
      }
    } else {
      setErrors(['Unexpected error occurred.']);
    }
  }
};


  const cancel = (event) => {
    event.preventDefault();
    navigate('/');
  };

  return (
    <div className="form--centered">
      <h2>Sign In</h2>
      {errors.length > 0 && (
        <div className="validation--errors">
          <h3>Sign in unsuccessful</h3>
          <ul>
            {errors.map((error, i) => (
              <li key={i}>{error}</li>
            ))}
          </ul>
        </div>
      )}
      <form>
        <label htmlFor="emailAddress">Email Address</label>
        <input
          id="emailAddress"
          name="emailAddress"
          type="email"
          value={emailAddress}
          onChange={onChange}
        />
        <label htmlFor="password">Password</label>
        <input
          id="password"
          name="password"
          type="password"
          value={password}
          onChange={onChange}
        />
        <button className="button" type="submit" onClick={submit}>
          Sign In
        </button>
        <button className="button button-secondary" onClick={cancel}>
          Cancel
        </button>
      </form>
      <p>
        Don't have a user account? Click here to <Link to="/signup">sign up!</Link>
      </p>
      <p>
        Forgot your password? Click here to{' '}
        <Link to="/forgot-password">reset it.</Link>
      </p>
    </div>
  );
};

export default UserSignIn;
