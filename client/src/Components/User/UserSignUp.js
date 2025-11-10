import React, { useState, useContext } from 'react';
import Context from '../../Context';
import { Link, useNavigate } from 'react-router-dom';

const UserSignUp = () => {
  const context = useContext(Context.Context);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [emailAddress, setEmailAddress] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState([]);
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [secret, setSecret] = useState('');
  const [userId, setUserId] = useState(null);
  const [token, setToken] = useState('');

  let navigate = useNavigate();

  const onChange = (event) => {
    const name = event.target.name;
    const value = event.target.value;

    if (name === 'firstName') {
      setFirstName(value);
    }

    if (name === 'lastName') {
      setLastName(value);
    }

    if (name === 'emailAddress') {
      setEmailAddress(value);
    }

    if (name === 'password') {
      setPassword(value);
    }
  }

  const submit = (event) => {
    event.preventDefault();
    // User object to create a new user
    const user = {
      firstName,
      lastName,
      emailAddress,
      password,
    };

    context.data.createUser(user)
      .then(data => {
        if (data.errors) {
          setErrors(data.errors);
        } else {
          setQrCodeUrl(data.qrCodeUrl);
          setSecret(data.secret);
          setUserId(data.userId);
        }
      })
      .catch((error) => {
        console.error(error);
        navigate('/error');
      });
  }

  const handleVerify2FA = (event) => {
    event.preventDefault();
    context.actions.login2FA(userId, token)
      .then(user => {
        if (user) {
          navigate('/');
        } else {
          setErrors(['Invalid 2FA token.']);
        }
      })
      .catch((error) => {
        console.error(error);
        navigate('/error');
      });
  }

  const cancel = (event) => {
    event.preventDefault();
    navigate('/');
  }

  return (
    <div className="form--centered">
      <h2>Sign Up</h2>
      {errors.length ?
        <div className="validation--errors">
          <h3>Validation Errors</h3>
          <ul>
            {errors.map((error, i) => <li key={i}>{error}</li>)}
          </ul>
        </div>
        : null
      }
      {!qrCodeUrl ? (
        <form>
          <label htmlFor="firstName">First Name</label>
          <input id="firstName" name="firstName" type="text" value={firstName} onChange={onChange} />
          <label htmlFor="lastName">Last Name</label>
          <input id="lastName" name="lastName" type="text" value={lastName} onChange={onChange} />
          <label htmlFor="emailAddress">Email Address</label>
          <input id="emailAddress" name="emailAddress" type="email" value={emailAddress} onChange={onChange} />
          <label htmlFor="password">Password</label>
          <input id="password" name="password" type="password" value={password} onChange={onChange} />
          <button className="button" type="submit" onClick={submit}>Sign Up</button>
          <button className="button button-secondary" onClick={cancel}>Cancel</button>
        </form>
      ) : (
        <div>
          <h3>Set up 2-Factor Authentication</h3>
          <p>Scan the QR code with your authenticator app.</p>
          <img src={qrCodeUrl} alt="QR Code" />
          <p>Your secret key is: {secret}</p>
          <form>
            <label htmlFor="token">Enter 2FA Token</label>
            <input id="token" name="token" type="text" value={token} onChange={(e) => setToken(e.target.value)} />
            <button className="button" type="submit" onClick={handleVerify2FA}>Verify</button>
          </form>
        </div>
      )}
      <p>Already have a user account? Click here to <Link to='/signin'>sign in!</Link></p>
    </div>
  );
}

export default UserSignUp;
