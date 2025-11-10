import React, { useContext } from 'react';
import context from '../Context';
import { Link, useLocation, useNavigate } from 'react-router-dom';

const Header = () => {
  const authUser = useContext(context.Context).authenticatedUser;
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <header>
      <div className="wrap header--flex">
        <h1 className="header--logo"><Link to='/'>Courses</Link></h1>
        <nav>
          {location.pathname === '/settings' ? (
            <ul className="header--signedin">
              <li>
                <button className="button button-secondary" onClick={() => navigate('/courses')}>
                  Back
                </button>
              </li>
            </ul>
          ) : authUser ? (
            <ul className="header--signedin">
              <li>Welcome, {authUser.firstName} {authUser.lastName}!</li>
              <li><Link to='/settings'>Settings</Link></li>
              <li><Link to='/signout'>Sign Out</Link></li>
            </ul>
          ) : (
            <ul className="header--signedout">
              <li><Link to='/signup'>Sign Up</Link></li>
              <li><Link to='/signin'>Sign In</Link></li>
            </ul>
          )}
        </nav>
      </div>
    </header>
  )
}

export default Header;